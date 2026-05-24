import { describe, it, expect } from 'vitest';
import {
	ISSUE_CARD_VARIANTS,
	ISSUE_CARD_SETTING_KEYS,
	ISSUE_CARD_SETTING_DEFAULTS,
	ISSUE_CARD_SETTING_RANGES,
	clampSettingValue,
	parseSettingValue,
	VARIANT_SPECIFIC_SETTINGS,
	BUTTON_COLOR_OPTIONS,
	PRIORITY_POSITION_OPTIONS,
	BADGE_STYLE_OPTIONS,
	type IssueCardVariant,
	type IssueCardAppearanceSettings,
} from './issue_card_settings.js';

describe('issue_card_settings', () => {
	describe('ISSUE_CARD_VARIANTS', () => {
		it('has exactly three variants: veil, refined-horizon, radiant', () => {
			expect(ISSUE_CARD_VARIANTS).toEqual({
				veil: 'veil',
				'refined-horizon': 'refined-horizon',
				radiant: 'radiant',
			});
		});

		it('IssueCardVariant type accepts valid variants', () => {
			const variant: IssueCardVariant = ISSUE_CARD_VARIANTS.veil;
			expect(variant).toBe('veil');
		});
	});

	describe('ISSUE_CARD_SETTING_KEYS', () => {
		it('maps all 10 logical names to issue_card_ prefixed DB keys', () => {
			expect(ISSUE_CARD_SETTING_KEYS).toEqual({
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
			});
		});

		it('has exactly 10 keys', () => {
			expect(Object.keys(ISSUE_CARD_SETTING_KEYS)).toHaveLength(10);
		});
	});

	describe('ISSUE_CARD_SETTING_DEFAULTS', () => {
		it('has correct string defaults', () => {
			expect(ISSUE_CARD_SETTING_DEFAULTS.buttonColor).toBe('issue-color');
			expect(ISSUE_CARD_SETTING_DEFAULTS.priorityPosition).toBe('header-right');
			expect(ISSUE_CARD_SETTING_DEFAULTS.badgeStyle).toBe('subtle');
			expect(ISSUE_CARD_SETTING_DEFAULTS.variant).toBe('refined-horizon');
		});

		it('has correct numeric defaults', () => {
			expect(ISSUE_CARD_SETTING_DEFAULTS.labelTint).toBe(20);
			expect(ISSUE_CARD_SETTING_DEFAULTS.overlayGlow).toBe(150);
			expect(ISSUE_CARD_SETTING_DEFAULTS.gradientReach).toBe(60);
			expect(ISSUE_CARD_SETTING_DEFAULTS.colorSaturation).toBe(150);
			expect(ISSUE_CARD_SETTING_DEFAULTS.headerSaturation).toBe(85);
			expect(ISSUE_CARD_SETTING_DEFAULTS.radialIntensity).toBe(75);
		});
	});

	describe('ISSUE_CARD_SETTING_RANGES', () => {
		it('defines min/max for labelTint', () => {
			expect(ISSUE_CARD_SETTING_RANGES.labelTint).toEqual({ min: 5, max: 30 });
		});

		it('defines min/max for overlayGlow', () => {
			expect(ISSUE_CARD_SETTING_RANGES.overlayGlow).toEqual({ min: 100, max: 200 });
		});

		it('defines min/max for gradientReach', () => {
			expect(ISSUE_CARD_SETTING_RANGES.gradientReach).toEqual({ min: 30, max: 100 });
		});

		it('defines min/max for colorSaturation', () => {
			expect(ISSUE_CARD_SETTING_RANGES.colorSaturation).toEqual({ min: 30, max: 200 });
		});

		it('defines min/max for headerSaturation', () => {
			expect(ISSUE_CARD_SETTING_RANGES.headerSaturation).toEqual({ min: 30, max: 100 });
		});

		it('defines min/max for radialIntensity', () => {
			expect(ISSUE_CARD_SETTING_RANGES.radialIntensity).toEqual({ min: 30, max: 100 });
		});
	});

	describe('clampSettingValue', () => {
		it('clamps value below min to min', () => {
			expect(clampSettingValue('labelTint', 1)).toBe(5);
		});

		it('clamps value above max to max', () => {
			expect(clampSettingValue('overlayGlow', 999)).toBe(200);
		});

		it('returns value unchanged when within range', () => {
			expect(clampSettingValue('gradientReach', 50)).toBe(50);
		});

		it('returns value unchanged for key with no range', () => {
			expect(clampSettingValue('buttonColor', 42)).toBe(42);
		});

		it('returns min when value equals min', () => {
			expect(clampSettingValue('colorSaturation', 30)).toBe(30);
		});

		it('returns max when value equals max', () => {
			expect(clampSettingValue('radialIntensity', 100)).toBe(100);
		});
	});

	describe('parseSettingValue', () => {
		it('parses numeric string for numeric setting', () => {
			expect(parseSettingValue('labelTint', '25')).toBe(25);
		});

		it('returns default for invalid numeric string', () => {
			expect(parseSettingValue('labelTint', 'abc')).toBe(
				ISSUE_CARD_SETTING_DEFAULTS.labelTint,
			);
		});

		it('returns default for empty string on numeric setting', () => {
			expect(parseSettingValue('overlayGlow', '')).toBe(
				ISSUE_CARD_SETTING_DEFAULTS.overlayGlow,
			);
		});

		it('returns string value for enum setting', () => {
			expect(parseSettingValue('buttonColor', 'moss-green')).toBe('moss-green');
		});

		it('returns string value for variant setting', () => {
			expect(parseSettingValue('variant', 'radiant')).toBe('radiant');
		});

		it('clamps parsed numeric value to range', () => {
			expect(parseSettingValue('labelTint', '999')).toBe(30);
		});

		it('returns default for NaN result', () => {
			expect(parseSettingValue('gradientReach', 'not-a-number')).toBe(
				ISSUE_CARD_SETTING_DEFAULTS.gradientReach,
			);
		});
	});

	describe('IssueCardAppearanceSettings type', () => {
		it('can be constructed with all 10 fields', () => {
			const settings: IssueCardAppearanceSettings = {
				buttonColor: 'issue-color',
				priorityPosition: 'header-right',
				badgeStyle: 'subtle',
				labelTint: 20,
				overlayGlow: 150,
				variant: 'refined-horizon',
				gradientReach: 60,
				colorSaturation: 150,
				headerSaturation: 85,
				radialIntensity: 75,
			};
			expect(Object.keys(settings)).toHaveLength(10);
		});
	});

	describe('VARIANT_SPECIFIC_SETTINGS', () => {
		it('maps veil to gradientReach and colorSaturation', () => {
			expect(VARIANT_SPECIFIC_SETTINGS.veil).toEqual(['gradientReach', 'colorSaturation']);
		});

		it('maps refined-horizon to headerSaturation', () => {
			expect(VARIANT_SPECIFIC_SETTINGS['refined-horizon']).toEqual(['headerSaturation']);
		});

		it('maps radiant to radialIntensity', () => {
			expect(VARIANT_SPECIFIC_SETTINGS.radiant).toEqual(['radialIntensity']);
		});
	});

	describe('BUTTON_COLOR_OPTIONS', () => {
		it('contains issue-color and moss-green', () => {
			expect(BUTTON_COLOR_OPTIONS).toEqual(['issue-color', 'moss-green']);
		});
	});

	describe('PRIORITY_POSITION_OPTIONS', () => {
		it('has 9 position options', () => {
			expect(PRIORITY_POSITION_OPTIONS).toHaveLength(9);
		});

		it('includes expected positions', () => {
			expect(PRIORITY_POSITION_OPTIONS).toContain('header-right');
			expect(PRIORITY_POSITION_OPTIONS).toContain('preview-bottom-half');
			expect(PRIORITY_POSITION_OPTIONS).toContain('preview-top-half');
			expect(PRIORITY_POSITION_OPTIONS).toContain('preview-bottom-inside');
			expect(PRIORITY_POSITION_OPTIONS).toContain('preview-top-inside');
			expect(PRIORITY_POSITION_OPTIONS).toContain('preview-tl');
			expect(PRIORITY_POSITION_OPTIONS).toContain('preview-tr');
			expect(PRIORITY_POSITION_OPTIONS).toContain('preview-bl');
			expect(PRIORITY_POSITION_OPTIONS).toContain('preview-br');
		});
	});

	describe('BADGE_STYLE_OPTIONS', () => {
		it('contains solid, subtle, outlined', () => {
			expect(BADGE_STYLE_OPTIONS).toEqual(['solid', 'subtle', 'outlined']);
		});
	});
});
