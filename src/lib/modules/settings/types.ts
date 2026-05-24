export const SETTING_KEYS = {
	// Appearance
	themeMode: 'theme_mode',
	accentColor: 'accent_color',

	// Account
	username: 'username',
	userInitials: 'user_initials',

	// General
	startupBehavior: 'startup_behavior',
	chartColorTheme: 'chart_color_theme',
	language: 'language',

	// Notifications
	notificationVolume: 'notification_volume',

	// Editor
	editorCommand: 'editor_command',

	// Issue Card
	issueCardVariant: 'issue_card_variant',
	issueCardButtonColor: 'issue_card_button_color',
	issueCardPriorityPosition: 'issue_card_priority_position',
	issueCardBadgeStyle: 'issue_card_badge_style',
	issueCardLabelTint: 'issue_card_label_tint',
	issueCardOverlayGlow: 'issue_card_overlay_glow',
	issueCardGradientReach: 'issue_card_gradient_reach',
	issueCardColorSaturation: 'issue_card_color_saturation',
	issueCardHeaderSaturation: 'issue_card_header_saturation',
	issueCardRadialIntensity: 'issue_card_radial_intensity',
} as const;

export type SettingKey = keyof typeof SETTING_KEYS;
export type SettingDbKey = (typeof SETTING_KEYS)[SettingKey];

export const SETTING_DEFAULTS: Record<SettingKey, string> = {
	themeMode: 'system',
	accentColor: 'moss',
	username: 'User',
	userInitials: 'U',
	startupBehavior: 'overview',
	chartColorTheme: 'monochrome',
	language: 'en',
	editorCommand: 'code',
	notificationVolume: '0.7',
	issueCardVariant: 'refined-horizon',
	issueCardButtonColor: 'issue-color',
	issueCardPriorityPosition: 'header-right',
	issueCardBadgeStyle: 'subtle',
	issueCardLabelTint: '20',
	issueCardOverlayGlow: '150',
	issueCardGradientReach: '60',
	issueCardColorSaturation: '150',
	issueCardHeaderSaturation: '85',
	issueCardRadialIntensity: '75',
};

// Settings that can be overridden per workspace
export const WORKSPACE_OVERRIDABLE_KEYS: readonly SettingKey[] = [
	'themeMode',
	'accentColor',
	'issueCardVariant',
	'issueCardButtonColor',
	'issueCardPriorityPosition',
	'issueCardBadgeStyle',
	'issueCardLabelTint',
	'issueCardOverlayGlow',
	'issueCardGradientReach',
	'issueCardColorSaturation',
	'issueCardHeaderSaturation',
	'issueCardRadialIntensity',
	'notificationVolume',
] as const;

// Settings that need localStorage mirror for FOUC prevention
export const FOUC_MIRROR_KEYS: readonly SettingKey[] = ['themeMode', 'accentColor'] as const;

// LocalStorage key prefix for FOUC mirror
export const FOUC_STORAGE_PREFIX = 'grovekeeper_settings_';

export type SettingScope = 'user' | 'workspace';
