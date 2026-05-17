import { createContext } from 'svelte';
import { browser } from '$app/environment';
import { MediaQuery, SvelteMap, SvelteSet } from 'svelte/reactivity';
import { StateRaw } from '$lib/reactivity/state.svelte.js';
import {
	SETTING_KEYS,
	SETTING_DEFAULTS,
	WORKSPACE_OVERRIDABLE_KEYS,
	type SettingKey,
	type SettingScope,
} from './types.js';
import {
	resolveSettingCascade,
	mirrorToLocalStorage,
	readFoucMirror,
} from './settings_resolution.js';
import {
	getAllUserSettings,
	setUserSetting,
	getAllWorkspaceSettings,
	setWorkspaceSetting,
	deleteWorkspaceSetting,
} from './settings_commands.js';
import { isThemeMode, isAccentColor } from '$lib/modules/board/types.js';

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
	const returnUrl = new StateRaw<string>('/');

	for (const key of Object.keys(SETTING_DEFAULTS) as SettingKey[]) {
		const foucValue = browser ? readFoucMirror(key) : null;
		values.set(key, foucValue ?? SETTING_DEFAULTS[key]);
	}

	// ── Theme DOM application ─────────────────────────────────────────────
	const prefersDark = browser ? new MediaQuery('(prefers-color-scheme: dark)') : null;

	const isDark = $derived.by(() => {
		const mode = values.get('themeMode') ?? SETTING_DEFAULTS.themeMode;
		if (mode === 'system') {
			return prefersDark?.current ?? true;
		}
		return mode === 'dark';
	});

	$effect.pre(() => {
		document.documentElement.dataset.theme = isDark ? 'dark' : 'light';
		document.documentElement.dataset.accent =
			values.get('accentColor') ?? SETTING_DEFAULTS.accentColor;
	});

	// ── API ────────────────────────────────────────────────────────────────

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
		const normalizedDashboardId = dashboardId ?? null;
		const userSettings = await getAllUserSettings();
		const userMap = toKeyValueMap(userSettings);
		const wsMap = await loadWorkspaceMap(normalizedDashboardId);

		for (const settingKey of Object.keys(SETTING_KEYS) as SettingKey[]) {
			const dbKey = SETTING_KEYS[settingKey];
			const resolved = resolveSettingCascade(
				settingKey,
				userMap.get(dbKey) ?? null,
				wsMap.get(dbKey) ?? null,
			);
			values.set(settingKey, resolved.value);
			mirrorToLocalStorage(settingKey, resolved.value);
		}
	}

	function toKeyValueMap(
		settings: Array<{ key: string; value: string }>,
	): SvelteMap<string, string> {
		const map = new SvelteMap<string, string>();
		for (const setting of settings) {
			map.set(setting.key, setting.value);
		}
		return map;
	}

	async function loadWorkspaceMap(
		dashboardId: string | null,
	): Promise<SvelteMap<string, string>> {
		if (dashboardId === null) {
			return new SvelteMap();
		}
		const wsSettings = await getAllWorkspaceSettings(dashboardId);
		overriddenKeys.set(dashboardId, new SvelteSet(wsSettings.map((s) => s.key)));
		return toKeyValueMap(wsSettings);
	}

	function setScope(scope: SettingScope, dashboardId?: string | null): void {
		activeScope.current = scope;
		activeDashboardId.current = dashboardId ?? null;
	}

	function getThemeMode(): string {
		const raw = values.get('themeMode') ?? SETTING_DEFAULTS.themeMode;
		return isThemeMode(raw) ? raw : SETTING_DEFAULTS.themeMode;
	}

	function getAccentColor(): string {
		const raw = values.get('accentColor') ?? SETTING_DEFAULTS.accentColor;
		return isAccentColor(raw) ? raw : SETTING_DEFAULTS.accentColor;
	}

	function setReturnUrl(url: string): void {
		returnUrl.current = url;
	}

	return {
		get,
		set,
		isOverridden,
		resetOverride,
		loadSettings,
		setScope,
		setReturnUrl,
		getThemeMode,
		getAccentColor,
		get isDark() {
			return isDark;
		},
		get activeScope() {
			return activeScope.current;
		},
		get activeDashboardId() {
			return activeDashboardId.current;
		},
		get returnUrl() {
			return returnUrl.current;
		},
	};
}
