import { createContext } from 'svelte';
import { SvelteSet } from 'svelte/reactivity';
import { StateRaw } from '$lib/reactivity/state.svelte.js';
import { getAppSetting, setAppSetting } from '$lib/modules/window/window_commands.js';
import {
	ISSUE_CARD_SETTING_DEFAULTS,
	ISSUE_CARD_SETTING_KEYS,
	resolveSettingValue,
	type IssueCardAppearanceSettings,
	type IssueCardSettingKey,
	type IssueCardVariant,
	type ButtonColorOption,
	type PriorityPositionOption,
	type BadgeStyleOption,
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
	const buttonColor = new StateRaw<ButtonColorOption>(ISSUE_CARD_SETTING_DEFAULTS.buttonColor);
	const priorityPosition = new StateRaw<PriorityPositionOption>(
		ISSUE_CARD_SETTING_DEFAULTS.priorityPosition,
	);
	const badgeStyle = new StateRaw<BadgeStyleOption>(ISSUE_CARD_SETTING_DEFAULTS.badgeStyle);
	const labelTint = new StateRaw<number>(ISSUE_CARD_SETTING_DEFAULTS.labelTint);
	const overlayGlow = new StateRaw<number>(ISSUE_CARD_SETTING_DEFAULTS.overlayGlow);
	const variant = new StateRaw<IssueCardVariant>(ISSUE_CARD_SETTING_DEFAULTS.variant);
	const gradientReach = new StateRaw<number>(ISSUE_CARD_SETTING_DEFAULTS.gradientReach);
	const colorSaturation = new StateRaw<number>(ISSUE_CARD_SETTING_DEFAULTS.colorSaturation);
	const headerSaturation = new StateRaw<number>(ISSUE_CARD_SETTING_DEFAULTS.headerSaturation);
	const radialIntensity = new StateRaw<number>(ISSUE_CARD_SETTING_DEFAULTS.radialIntensity);

	const overriddenKeys = new StateRaw<SvelteSet<IssueCardSettingKey>>(new SvelteSet());

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

	// fallow-ignore-next-line complexity
	async function loadSettings() {
		const keys = Object.keys(ISSUE_CARD_SETTING_KEYS) as IssueCardSettingKey[];
		const newOverrides = new SvelteSet<IssueCardSettingKey>();

		for (const key of keys) {
			const dbKey = ISSUE_CARD_SETTING_KEYS[key];
			const wsDbKey =
				dashboardId !== null && dashboardId !== undefined
					? `ws_${dashboardId}_${dbKey}`
					: null;

			const userSetting = await getAppSetting(dbKey);
			const wsSetting = wsDbKey !== null ? await getAppSetting(wsDbKey) : null;

			const result = resolveSettingValue(
				key,
				userSetting?.value ?? null,
				wsSetting?.value ?? null,
			);

			(stateMap[key] as StateRaw<string | number>).current = result.value;
			if (result.isOverridden) {
				newOverrides.add(key);
			}
		}

		overriddenKeys.current = newOverrides;
	}

	async function updateSetting(key: IssueCardSettingKey, value: string | number) {
		const dbKey = ISSUE_CARD_SETTING_KEYS[key];
		const effectiveKey =
			dashboardId !== null && dashboardId !== undefined
				? `ws_${dashboardId}_${dbKey}`
				: dbKey;
		await setAppSetting(effectiveKey, String(value));
		(stateMap[key] as StateRaw<string | number>).current = value;

		if (dashboardId !== null && dashboardId !== undefined) {
			const current = overriddenKeys.current;
			const updated = new SvelteSet(current);
			updated.add(key);
			overriddenKeys.current = updated;
		}
	}

	async function resetOverride(key: IssueCardSettingKey) {
		if (dashboardId === null || dashboardId === undefined) {
			return;
		}
		const dbKey = ISSUE_CARD_SETTING_KEYS[key];
		const wsKey = `ws_${dashboardId}_${dbKey}`;
		await setAppSetting(wsKey, '');

		const userSetting = await getAppSetting(dbKey);
		const result = resolveSettingValue(key, userSetting?.value ?? null, null);
		(stateMap[key] as StateRaw<string | number>).current = result.value;

		const current = overriddenKeys.current;
		const updated = new SvelteSet(current);
		updated.delete(key);
		overriddenKeys.current = updated;
	}

	function isOverridden(key: IssueCardSettingKey): boolean {
		return overriddenKeys.current.has(key);
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

		get overriddenKeys() {
			return overriddenKeys.current;
		},

		set buttonColor(value: ButtonColorOption) {
			buttonColor.current = value;
		},

		get buttonColor() {
			return buttonColor.current;
		},

		set priorityPosition(value: PriorityPositionOption) {
			priorityPosition.current = value;
		},

		get priorityPosition() {
			return priorityPosition.current;
		},

		set badgeStyle(value: BadgeStyleOption) {
			badgeStyle.current = value;
		},

		get badgeStyle() {
			return badgeStyle.current;
		},

		set labelTint(value: number) {
			labelTint.current = value;
		},

		get labelTint() {
			return labelTint.current;
		},

		set overlayGlow(value: number) {
			overlayGlow.current = value;
		},

		get overlayGlow() {
			return overlayGlow.current;
		},

		set variant(value: IssueCardVariant) {
			variant.current = value;
		},

		get variant() {
			return variant.current;
		},

		set gradientReach(value: number) {
			gradientReach.current = value;
		},

		get gradientReach() {
			return gradientReach.current;
		},

		set colorSaturation(value: number) {
			colorSaturation.current = value;
		},

		get colorSaturation() {
			return colorSaturation.current;
		},

		set headerSaturation(value: number) {
			headerSaturation.current = value;
		},

		get headerSaturation() {
			return headerSaturation.current;
		},

		set radialIntensity(value: number) {
			radialIntensity.current = value;
		},

		get radialIntensity() {
			return radialIntensity.current;
		},

		loadSettings,
		updateSetting,
		resetOverride,
		isOverridden,
	};
}
