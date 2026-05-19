// ── Variants ──────────────────────────────────────────────────────────

export const ISSUE_CARD_VARIANTS = {
	veil: 'veil',
	'refined-horizon': 'refined-horizon',
	radiant: 'radiant',
} as const;

export type IssueCardVariant = (typeof ISSUE_CARD_VARIANTS)[keyof typeof ISSUE_CARD_VARIANTS];

// ── Setting keys (DB column names) ───────────────────────────────────

export const ISSUE_CARD_SETTING_KEYS = {
	buttonColor: 'issue_card_button_color',
	priorityPosition: 'issue_card_priority_position',
	badgeStyle: 'issue_card_badge_style',
	labelTint: 'issue_card_label_tint',
	overlayGlow: 'issue_card_overlay_glow',
	variant: 'issue_card_variant',
	gradientReach: 'issue_card_gradient_reach',
	colorSaturation: 'issue_card_color_saturation',
	headerSaturation: 'issue_card_header_saturation',
	radialIntensity: 'issue_card_radial_intensity',
} as const;

export type IssueCardSettingKey = keyof typeof ISSUE_CARD_SETTING_KEYS;

// ── Enum option constants ────────────────────────────────────────────

export const BUTTON_COLOR_OPTIONS = ['issue-color', 'moss-green'] as const;
export type ButtonColorOption = (typeof BUTTON_COLOR_OPTIONS)[number];

export const PRIORITY_POSITION_OPTIONS = [
	'header-right',
	'preview-bottom-half',
	'preview-top-half',
	'preview-bottom-inside',
	'preview-top-inside',
	'preview-tl',
	'preview-tr',
	'preview-bl',
	'preview-br',
] as const;
export type PriorityPositionOption = (typeof PRIORITY_POSITION_OPTIONS)[number];

export const BADGE_STYLE_OPTIONS = ['solid', 'borderless-dark', 'bordered-dark'] as const;
export type BadgeStyleOption = (typeof BADGE_STYLE_OPTIONS)[number];

// ── Defaults (derived from SETTING_DEFAULTS — single source of truth) ───

import { SETTING_DEFAULTS } from '$lib/modules/settings/types.js';

export const ISSUE_CARD_SETTING_DEFAULTS = {
	buttonColor: SETTING_DEFAULTS.issueCardButtonColor as ButtonColorOption,
	priorityPosition: SETTING_DEFAULTS.issueCardPriorityPosition as PriorityPositionOption,
	badgeStyle: SETTING_DEFAULTS.issueCardBadgeStyle as BadgeStyleOption,
	labelTint: Number(SETTING_DEFAULTS.issueCardLabelTint),
	overlayGlow: Number(SETTING_DEFAULTS.issueCardOverlayGlow),
	variant: SETTING_DEFAULTS.issueCardVariant as IssueCardVariant,
	gradientReach: Number(SETTING_DEFAULTS.issueCardGradientReach),
	colorSaturation: Number(SETTING_DEFAULTS.issueCardColorSaturation),
	headerSaturation: Number(SETTING_DEFAULTS.issueCardHeaderSaturation),
	radialIntensity: Number(SETTING_DEFAULTS.issueCardRadialIntensity),
} as const;

// ── Ranges for numeric settings ──────────────────────────────────────

interface SettingRange {
	readonly min: number;
	readonly max: number;
}

const NUMERIC_SETTING_KEYS = new Set<IssueCardSettingKey>([
	'labelTint',
	'overlayGlow',
	'gradientReach',
	'colorSaturation',
	'headerSaturation',
	'radialIntensity',
]);

export const ISSUE_CARD_SETTING_RANGES = {
	labelTint: { min: 5, max: 30 },
	overlayGlow: { min: 100, max: 200 },
	gradientReach: { min: 30, max: 100 },
	colorSaturation: { min: 30, max: 200 },
	headerSaturation: { min: 30, max: 100 },
	radialIntensity: { min: 30, max: 100 },
} as const satisfies Partial<Record<IssueCardSettingKey, SettingRange>>;

// ── Clamp ────────────────────────────────────────────────────────────

// fallow-ignore-next-line unused-type
export type RangeKey = keyof typeof ISSUE_CARD_SETTING_RANGES;

export function clampSettingValue(key: string, value: number): number {
	if (!(key in ISSUE_CARD_SETTING_RANGES)) {
		return value;
	}
	const range = ISSUE_CARD_SETTING_RANGES[key as RangeKey];
	return Math.min(Math.max(value, range.min), range.max);
}

// ── Parse ────────────────────────────────────────────────────────────

const ENUM_VALIDATORS: Partial<Record<IssueCardSettingKey, readonly string[]>> = {
	buttonColor: BUTTON_COLOR_OPTIONS,
	badgeStyle: BADGE_STYLE_OPTIONS,
	variant: Object.values(ISSUE_CARD_VARIANTS),
	priorityPosition: PRIORITY_POSITION_OPTIONS,
};

export function parseSettingValue(key: IssueCardSettingKey, rawValue: string): string | number {
	if (NUMERIC_SETTING_KEYS.has(key)) {
		const parsed = Number(rawValue);
		if (Number.isNaN(parsed) || rawValue === '') {
			return ISSUE_CARD_SETTING_DEFAULTS[key];
		}
		return clampSettingValue(key, parsed);
	}

	const allowedValues = ENUM_VALIDATORS[key];
	if (allowedValues) {
		return allowedValues.includes(rawValue) ? rawValue : ISSUE_CARD_SETTING_DEFAULTS[key];
	}
	return rawValue;
}

// ── Appearance settings interface ────────────────────────────────────

export interface IssueCardAppearanceSettings {
	readonly buttonColor: ButtonColorOption;
	readonly priorityPosition: PriorityPositionOption;
	readonly badgeStyle: BadgeStyleOption;
	readonly labelTint: number;
	readonly overlayGlow: number;
	readonly variant: IssueCardVariant;
	readonly gradientReach: number;
	readonly colorSaturation: number;
	readonly headerSaturation: number;
	readonly radialIntensity: number;
}

// ── Variant-specific settings ────────────────────────────────────────

export const VARIANT_SPECIFIC_SETTINGS = {
	veil: ['gradientReach', 'colorSaturation'],
	'refined-horizon': ['headerSaturation'],
	radiant: ['radialIntensity'],
} as const satisfies Record<IssueCardVariant, readonly IssueCardSettingKey[]>;

// ── Display labels (shared across UI components) ────────────────────

// fallow-ignore-next-line unused-export
export const VARIANT_LABELS: Record<IssueCardVariant, string> = {
	veil: 'Veil',
	'refined-horizon': 'Refined Horizon',
	radiant: 'Radiant',
};

// fallow-ignore-next-line unused-export
export const BUTTON_COLOR_LABELS: Record<string, string> = {
	'issue-color': 'Issue Color',
	'moss-green': 'Moss Green',
};

// fallow-ignore-next-line unused-export
export const SLIDER_LABELS: Record<string, string> = {
	labelTint: 'Label Tint',
	overlayGlow: 'Overlay Glow Intensity',
	gradientReach: 'Gradient Reach',
	colorSaturation: 'Color Saturation',
	headerSaturation: 'Header Saturation',
	radialIntensity: 'Radial Intensity',
};
