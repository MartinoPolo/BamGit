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

// ── Defaults ─────────────────────────────────────────────────────────

export const ISSUE_CARD_SETTING_DEFAULTS = {
	buttonColor: 'issue-color' as ButtonColorOption,
	priorityPosition: 'header-right' as PriorityPositionOption,
	badgeStyle: 'borderless-dark' as BadgeStyleOption,
	labelTint: 20,
	overlayGlow: 150,
	variant: 'refined-horizon' as IssueCardVariant,
	gradientReach: 60,
	colorSaturation: 150,
	headerSaturation: 85,
	radialIntensity: 75,
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

export const ISSUE_CARD_SETTING_RANGES: Record<string, SettingRange> = {
	labelTint: { min: 5, max: 30 },
	overlayGlow: { min: 100, max: 200 },
	gradientReach: { min: 30, max: 100 },
	colorSaturation: { min: 30, max: 200 },
	headerSaturation: { min: 30, max: 100 },
	radialIntensity: { min: 30, max: 100 },
} as const;

// ── Clamp ────────────────────────────────────────────────────────────

export function clampSettingValue(key: string, value: number): number {
	const range = ISSUE_CARD_SETTING_RANGES[key];
	if (range === undefined) {
		return value;
	}
	return Math.min(Math.max(value, range.min), range.max);
}

// ── Parse ────────────────────────────────────────────────────────────

export function parseSettingValue(key: IssueCardSettingKey, rawValue: string): string | number {
	if (NUMERIC_SETTING_KEYS.has(key)) {
		const parsed = Number(rawValue);
		if (Number.isNaN(parsed) || rawValue === '') {
			return ISSUE_CARD_SETTING_DEFAULTS[key];
		}
		return clampSettingValue(key, parsed);
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

// ── Setting resolution (used by settings context) ───────────────────

export interface SettingResolutionResult {
	readonly value: string | number;
	readonly isOverridden: boolean;
}

export function resolveSettingValue(
	key: IssueCardSettingKey,
	userRawValue: string | null,
	workspaceRawValue: string | null,
): SettingResolutionResult {
	let value: string | number = ISSUE_CARD_SETTING_DEFAULTS[key];
	let isOverridden = false;

	if (userRawValue !== null) {
		value = parseSettingValue(key, userRawValue);
	}

	if (workspaceRawValue !== null) {
		value = parseSettingValue(key, workspaceRawValue);
		isOverridden = true;
	}

	return { value, isOverridden };
}
