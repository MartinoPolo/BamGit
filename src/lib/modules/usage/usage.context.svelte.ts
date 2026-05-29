import { createContext } from 'svelte';
import { invoke } from '$lib/tauri.js';
import { StateRaw } from '$lib/reactivity/state.svelte.js';
import { Persisted, stringSerde } from '$lib/reactivity/persisted.svelte.js';
import type { UsageDashboardData, Achievement, ImportSummary } from '$lib/types/generated/index.js';
import { useToasts } from '$lib/modules/toasts/index.js';
import { getUserSetting, setUserSetting } from '$lib/modules/settings/settings_commands.js';
import { formatImportToastMessage, isImportPrompted } from './import_helpers.js';
import {
	CHART_COLOR_THEMES,
	FRESH_THRESHOLD_MS,
	GROUP_BY_OPTIONS,
	REFRESH_STATES,
	STALE_THRESHOLD_MS,
	USAGE_SCOPES,
	isChartColorTheme,
	isGroupByOption,
	type ChartColorTheme,
	type GroupByOption,
	type MetricsPeriod,
	type RefreshState,
	type UsageScope,
} from './usage_types.js';

type UsageContext = ReturnType<typeof createUsageContext>;

const [useUsage, setUsageInternal] = createContext<UsageContext>();
// fallow-ignore-next-line unused-export
export { useUsage };

export function setUsageContext() {
	const ctx = createUsageContext();
	setUsageInternal(ctx);
	return ctx;
}

function createUsageContext() {
	const toasts = useToasts();

	const activePeriod = new StateRaw<MetricsPeriod>('thirty-days');
	const scope = new StateRaw<UsageScope>(USAGE_SCOPES.workspace);
	const customDateRange = new StateRaw<{ start: string; end: string } | null>(null);
	const groupBy = new Persisted({
		key: 'gk-usage-group-by',
		serde: stringSerde(isGroupByOption),
		defaultValue: GROUP_BY_OPTIONS.none as GroupByOption,
	});
	const colorTheme = new Persisted({
		key: 'gk-usage-color-theme',
		serde: stringSerde(isChartColorTheme),
		defaultValue: CHART_COLOR_THEMES.monochrome as ChartColorTheme,
	});

	const dashboardData = new StateRaw<UsageDashboardData | null>(null);
	const achievements = new StateRaw<Achievement[]>([]);
	const refreshState = new StateRaw<RefreshState>(REFRESH_STATES.idle);
	const lastUpdatedAt = new StateRaw<number | null>(null);
	const showAchievements = new StateRaw(false);
	const importState = new StateRaw<'idle' | 'loading' | 'done'>('idle');
	const importPrompted = new StateRaw(false);
	const importPromptedLoaded = new StateRaw(false);

	void getUserSetting('usage_import_prompted').then((setting) => {
		if (isImportPrompted(setting)) {
			importPrompted.current = true;
		}
		importPromptedLoaded.current = true;
	});

	const unlockedCount = $derived.by(
		() => achievements.current.filter((a) => a.unlocked_at !== null).length,
	);

	let staleTimer: ReturnType<typeof setTimeout> | undefined;
	let freshTimer: ReturnType<typeof setTimeout> | undefined;

	function clearTimers() {
		if (staleTimer) {
			clearTimeout(staleTimer);
		}
		if (freshTimer) {
			clearTimeout(freshTimer);
		}
	}

	function startFreshnessTimers() {
		clearTimers();
		freshTimer = setTimeout(() => {
			if (refreshState.current === REFRESH_STATES.fresh) {
				refreshState.current = REFRESH_STATES.idle;
			}
		}, FRESH_THRESHOLD_MS);
		staleTimer = setTimeout(() => {
			if (
				refreshState.current !== REFRESH_STATES.loading &&
				refreshState.current !== REFRESH_STATES.newDataAvailable
			) {
				refreshState.current = REFRESH_STATES.stale;
			}
		}, STALE_THRESHOLD_MS);
	}

	async function loadData(dashboardId?: string) {
		if (activePeriod.current === 'custom' && customDateRange.current == null) {
			return;
		}
		refreshState.current = REFRESH_STATES.loading;
		try {
			const periodArg =
				activePeriod.current === 'custom' && customDateRange.current
					? { custom: customDateRange.current }
					: activePeriod.current;

			const groupByArg =
				groupBy.current === GROUP_BY_OPTIONS.none ? undefined : groupBy.current;

			const [dashboard, achievementList] = await Promise.all([
				invoke<UsageDashboardData>('get_usage_dashboard', {
					period: periodArg,
					dashboardId,
					groupBy: groupByArg,
				}),
				invoke<Achievement[]>('get_achievements'),
			]);
			dashboardData.current = dashboard;
			achievements.current = achievementList;
			lastUpdatedAt.current = Date.now();
			refreshState.current = REFRESH_STATES.fresh;
			startFreshnessTimers();
		} catch (error) {
			console.error('Failed to load usage data:', error);
			refreshState.current = REFRESH_STATES.stale;
		}
	}

	function notifyNewData() {
		if (refreshState.current !== REFRESH_STATES.loading) {
			refreshState.current = REFRESH_STATES.newDataAvailable;
		}
	}

	async function handleImport(dashboardId?: string) {
		importState.current = 'loading';
		try {
			const summary = await invoke<ImportSummary>('import_historical_sessions');
			toasts.show({
				tone: 'success',
				title: 'Import complete',
				body: formatImportToastMessage(summary),
			});
			importState.current = 'done';
			await setUserSetting('usage_import_prompted', 'true');
			importPrompted.current = true;
			await loadData(dashboardId);
		} catch (error) {
			console.error('Failed to import historical sessions:', error);
			toasts.show({
				tone: 'danger',
				title: 'Import failed',
				body: String(error),
			});
			importState.current = 'idle';
		}
	}

	async function handleSkipImport() {
		await setUserSetting('usage_import_prompted', 'true');
		importPrompted.current = true;
	}

	return {
		activePeriod,
		scope,
		customDateRange,
		groupBy,
		colorTheme,
		dashboardData,
		achievements,
		refreshState,
		lastUpdatedAt,
		showAchievements,
		importState,
		importPrompted,
		importPromptedLoaded,
		get unlockedCount() {
			return unlockedCount;
		},
		loadData,
		notifyNewData,
		clearTimers,
		handleImport,
		handleSkipImport,
	};
}
