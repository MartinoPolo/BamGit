import { createContext } from 'svelte';
import { SvelteMap, SvelteSet } from 'svelte/reactivity';
import { StateRaw } from '$lib/reactivity/state.svelte.js';
import {
	SETTING_KEYS,
	SETTING_DEFAULTS,
	WORKSPACE_OVERRIDABLE_KEYS,
	type SettingKey,
	type SettingScope,
} from './types.js';
import { resolveSettingCascade, mirrorToLocalStorage } from './settings_resolution.js';
import {
	getAllUserSettings,
	setUserSetting,
	getAllWorkspaceSettings,
	setWorkspaceSetting,
	deleteWorkspaceSetting,
} from './settings_commands.js';

// ─── Context ──────────────────────────────────────────────────────────────

type SettingsContext = ReturnType<typeof createSettingsContext>;

const [useSettings, setSettingsInternal] = createContext<SettingsContext>();
export { useSettings };

export function setSettingsContext() {
	const ctx = createSettingsContext();
	setSettingsInternal(ctx);
	return ctx;
}

// ─── Factory ──────────────────────────────────────────────────────────────

function createSettingsContext() {
	const values = new SvelteMap<SettingKey, string>();
	const overriddenKeys = new SvelteMap<string, SvelteSet<string>>();
	const activeScope = new StateRaw<SettingScope>('user');
	const activeDashboardId = new StateRaw<string | null>(null);

	for (const key of Object.keys(SETTING_DEFAULTS) as SettingKey[]) {
		values.set(key, SETTING_DEFAULTS[key]);
	}

	function get(key: SettingKey): string {
		return values.get(key) ?? SETTING_DEFAULTS[key];
	}

	async function set(key: SettingKey, value: string): Promise<void> {
		values.set(key, value);
		mirrorToLocalStorage(key, value);

		const dbKey = SETTING_KEYS[key];
		if (
			activeScope.current === 'workspace' &&
			activeDashboardId.current !== null &&
			WORKSPACE_OVERRIDABLE_KEYS.includes(key)
		) {
			await setWorkspaceSetting(activeDashboardId.current, dbKey, value);
			const wsOverrides =
				overriddenKeys.get(activeDashboardId.current) ?? new SvelteSet<string>();
			wsOverrides.add(dbKey);
			overriddenKeys.set(activeDashboardId.current, wsOverrides);
		} else {
			await setUserSetting(dbKey, value);
		}
	}

	function isOverridden(key: SettingKey): boolean {
		if (activeDashboardId.current === null) {
			return false;
		}
		const dbKey = SETTING_KEYS[key];
		const wsOverrides = overriddenKeys.get(activeDashboardId.current);
		return wsOverrides?.has(dbKey) ?? false;
	}

	async function resetOverride(key: SettingKey): Promise<void> {
		if (activeDashboardId.current === null) {
			return;
		}
		const dbKey = SETTING_KEYS[key];
		await deleteWorkspaceSetting(activeDashboardId.current, dbKey);

		const wsOverrides = overriddenKeys.get(activeDashboardId.current);
		if (wsOverrides !== undefined) {
			wsOverrides.delete(dbKey);
			overriddenKeys.set(activeDashboardId.current, wsOverrides);
		}

		await loadSettings(activeDashboardId.current);
	}

	async function loadSettings(dashboardId?: string | null): Promise<void> {
		const userSettings = await getAllUserSettings();

		const userMap = new SvelteMap<string, string>();
		for (const setting of userSettings) {
			userMap.set(setting.key, setting.value);
		}

		const wsMap = new SvelteMap<string, string>();
		if (dashboardId !== undefined && dashboardId !== null) {
			const wsSettings = await getAllWorkspaceSettings(dashboardId);
			for (const setting of wsSettings) {
				wsMap.set(setting.key, setting.value);
			}
			overriddenKeys.set(dashboardId, new SvelteSet(wsSettings.map((s) => s.key)));
		}

		for (const settingKey of Object.keys(SETTING_KEYS) as SettingKey[]) {
			const dbKey = SETTING_KEYS[settingKey];
			const hasDashboard = dashboardId !== undefined && dashboardId !== null;
			const resolved = resolveSettingCascade(
				settingKey,
				userMap.get(dbKey) ?? null,
				hasDashboard ? (wsMap.get(dbKey) ?? null) : null,
			);
			values.set(settingKey, resolved.value);
			mirrorToLocalStorage(settingKey, resolved.value);
		}
	}

	function setScope(scope: SettingScope, dashboardId?: string | null): void {
		activeScope.current = scope;
		activeDashboardId.current = dashboardId ?? null;
	}

	return {
		get,
		set,
		isOverridden,
		resetOverride,
		loadSettings,
		setScope,
		get activeScope() {
			return activeScope.current;
		},
		get activeDashboardId() {
			return activeDashboardId.current;
		},
	};
}
