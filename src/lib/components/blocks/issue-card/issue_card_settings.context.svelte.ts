import { createContext } from 'svelte';
import { useSettings } from '$lib/modules/settings/index.js';
import type { SettingKey } from '$lib/modules/settings/index.js';
import {
	parseSettingValue,
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

export function setIssueCardSettingsContext() {
	const ctx = createIssueCardSettingsContext();
	setIssueCardSettingsInternal(ctx);
	return ctx;
}

const ISSUE_CARD_KEY_TO_SETTING_KEY: Record<IssueCardSettingKey, SettingKey> = {
	buttonColor: 'issueCardButtonColor',
	priorityPosition: 'issueCardPriorityPosition',
	badgeStyle: 'issueCardBadgeStyle',
	labelTint: 'issueCardLabelTint',
	overlayGlow: 'issueCardOverlayGlow',
	variant: 'issueCardVariant',
	gradientReach: 'issueCardGradientReach',
	colorSaturation: 'issueCardColorSaturation',
	headerSaturation: 'issueCardHeaderSaturation',
	radialIntensity: 'issueCardRadialIntensity',
};

function createIssueCardSettingsContext() {
	const settingsCtx = useSettings();

	function getRaw(key: IssueCardSettingKey): string | number {
		const settingKey = ISSUE_CARD_KEY_TO_SETTING_KEY[key];
		const raw = settingsCtx.get(settingKey);
		return parseSettingValue(key, raw);
	}

	function isOverridden(key: IssueCardSettingKey): boolean {
		const settingKey = ISSUE_CARD_KEY_TO_SETTING_KEY[key];
		return settingsCtx.isOverridden(settingKey);
	}

	async function updateSetting(key: IssueCardSettingKey, value: string | number) {
		const settingKey = ISSUE_CARD_KEY_TO_SETTING_KEY[key];
		await settingsCtx.set(settingKey, String(value));
	}

	async function resetOverride(key: IssueCardSettingKey) {
		const settingKey = ISSUE_CARD_KEY_TO_SETTING_KEY[key];
		await settingsCtx.resetOverride(settingKey);
	}

	const overriddenKeys = $derived.by(() => {
		const keys = Object.keys(ISSUE_CARD_KEY_TO_SETTING_KEY) as IssueCardSettingKey[];
		return new Set(keys.filter((key) => isOverridden(key)));
	});

	return {
		get settings(): IssueCardAppearanceSettings {
			return {
				buttonColor: getRaw('buttonColor') as ButtonColorOption,
				priorityPosition: getRaw('priorityPosition') as PriorityPositionOption,
				badgeStyle: getRaw('badgeStyle') as BadgeStyleOption,
				labelTint: getRaw('labelTint') as number,
				overlayGlow: getRaw('overlayGlow') as number,
				variant: getRaw('variant') as IssueCardVariant,
				gradientReach: getRaw('gradientReach') as number,
				colorSaturation: getRaw('colorSaturation') as number,
				headerSaturation: getRaw('headerSaturation') as number,
				radialIntensity: getRaw('radialIntensity') as number,
			};
		},

		get overriddenKeys() {
			return overriddenKeys;
		},

		updateSetting,
		resetOverride,
		isOverridden,
	};
}
