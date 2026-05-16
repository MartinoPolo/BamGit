import { createContext } from 'svelte';
import { StateRaw } from '$lib/reactivity/state.svelte.js';
import { getAppSetting, setAppSetting } from '$lib/modules/window/window_commands.js';
import {
	ISSUE_CARD_SETTING_DEFAULTS,
	ISSUE_CARD_SETTING_KEYS,
	parseSettingValue,
	type IssueCardAppearanceSettings,
	type IssueCardSettingKey,
	type IssueCardVariant,
} from './issue_card_settings.js';

type IssueCardSettingsContext = ReturnType<typeof createIssueCardSettingsContext>;

const [useIssueCardSettings, setIssueCardSettingsInternal] =
	createContext<IssueCardSettingsContext>();
export { useIssueCardSettings };

export function setIssueCardSettingsContext(dashboardId?: string) {
	const ctx = createIssueCardSettingsContext(dashboardId);
	setIssueCardSettingsInternal(ctx);
	return ctx;
}

function createIssueCardSettingsContext(dashboardId?: string) {
	const buttonColor = new StateRaw(ISSUE_CARD_SETTING_DEFAULTS.buttonColor);
	const priorityPosition = new StateRaw(ISSUE_CARD_SETTING_DEFAULTS.priorityPosition);
	const badgeStyle = new StateRaw(ISSUE_CARD_SETTING_DEFAULTS.badgeStyle);
	const labelTint = new StateRaw(ISSUE_CARD_SETTING_DEFAULTS.labelTint);
	const overlayGlow = new StateRaw(ISSUE_CARD_SETTING_DEFAULTS.overlayGlow);
	const variant = new StateRaw<IssueCardVariant>(ISSUE_CARD_SETTING_DEFAULTS.variant);
	const gradientReach = new StateRaw(ISSUE_CARD_SETTING_DEFAULTS.gradientReach);
	const colorSaturation = new StateRaw(ISSUE_CARD_SETTING_DEFAULTS.colorSaturation);
	const headerSaturation = new StateRaw(ISSUE_CARD_SETTING_DEFAULTS.headerSaturation);
	const radialIntensity = new StateRaw(ISSUE_CARD_SETTING_DEFAULTS.radialIntensity);

	const overriddenKeys = new StateRaw<Set<IssueCardSettingKey>>(new Set());

	const stateMap = {
		buttonColor,
		priorityPosition,
		badgeStyle,
		labelTint,
		overlayGlow,
		variant,
		gradientReach,
		colorSaturation,
		headerSaturation,
		radialIntensity,
	} as const;

	async function loadSettings() {
		const keys = Object.keys(ISSUE_CARD_SETTING_KEYS) as IssueCardSettingKey[];
		const newOverrides = new Set<IssueCardSettingKey>();

		for (const key of keys) {
			const dbKey = ISSUE_CARD_SETTING_KEYS[key];
			const wsKey = dashboardId ? `ws_${dashboardId}_${dbKey}` : null;

			let resolvedValue: string | number = ISSUE_CARD_SETTING_DEFAULTS[key];

			const userSetting = await getAppSetting(dbKey);
			if (userSetting !== null) {
				resolvedValue = parseSettingValue(key, userSetting.value);
			}

			if (wsKey) {
				const wsSetting = await getAppSetting(wsKey);
				if (wsSetting !== null) {
					resolvedValue = parseSettingValue(key, wsSetting.value);
					newOverrides.add(key);
				}
			}

			(stateMap[key] as StateRaw<string | number>).current = resolvedValue;
		}

		overriddenKeys.current = newOverrides;
	}

	async function updateSetting(key: IssueCardSettingKey, value: string | number) {
		const dbKey = ISSUE_CARD_SETTING_KEYS[key];
		const effectiveKey = dashboardId ? `ws_${dashboardId}_${dbKey}` : dbKey;
		await setAppSetting(effectiveKey, String(value));
		(stateMap[key] as StateRaw<string | number>).current = value;

		if (dashboardId) {
			const current = overriddenKeys.current;
			const updated = new Set(current);
			updated.add(key);
			overriddenKeys.current = updated;
		}
	}

	async function resetOverride(key: IssueCardSettingKey) {
		if (!dashboardId) {
			return;
		}
		const dbKey = ISSUE_CARD_SETTING_KEYS[key];
		const wsKey = `ws_${dashboardId}_${dbKey}`;
		await setAppSetting(wsKey, '');

		const userSetting = await getAppSetting(dbKey);
		const resolvedValue =
			userSetting !== null
				? parseSettingValue(key, userSetting.value)
				: ISSUE_CARD_SETTING_DEFAULTS[key];
		(stateMap[key] as StateRaw<string | number>).current = resolvedValue;

		const current = overriddenKeys.current;
		const updated = new Set(current);
		updated.delete(key);
		overriddenKeys.current = updated;
	}

	return {
		get settings(): IssueCardAppearanceSettings {
			return {
				buttonColor: buttonColor.current,
				priorityPosition: priorityPosition.current,
				badgeStyle: badgeStyle.current,
				labelTint: labelTint.current,
				overlayGlow: overlayGlow.current,
				variant: variant.current,
				gradientReach: gradientReach.current,
				colorSaturation: colorSaturation.current,
				headerSaturation: headerSaturation.current,
				radialIntensity: radialIntensity.current,
			};
		},
		get variant(): IssueCardVariant {
			return variant.current;
		},
		isOverridden(key: IssueCardSettingKey): boolean {
			return overriddenKeys.current.has(key);
		},
		loadSettings,
		updateSetting,
		resetOverride,
	};
}
