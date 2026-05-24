import { describe, it, expect } from 'vitest';
import { getComparisonBadgeStyle, applyComparisonOverride } from './dev_comparison_toggle.js';
import type { IssueCardAppearanceSettings } from './issue_card_settings.js';

const BASE_SETTINGS: IssueCardAppearanceSettings = {
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

describe('dev_comparison_toggle', () => {
	describe('getComparisonBadgeStyle', () => {
		it('returns outlined when current badge style is solid', () => {
			expect(getComparisonBadgeStyle('solid')).toBe('outlined');
		});

		it('returns solid when current badge style is subtle', () => {
			expect(getComparisonBadgeStyle('subtle')).toBe('solid');
		});

		it('returns solid when current badge style is outlined', () => {
			expect(getComparisonBadgeStyle('outlined')).toBe('solid');
		});
	});

	describe('applyComparisonOverride', () => {
		it('returns original settings unchanged when comparison is disabled', () => {
			const result = applyComparisonOverride(BASE_SETTINGS, false);
			expect(result).toEqual(BASE_SETTINGS);
		});

		it('overrides badgeStyle when comparison is enabled', () => {
			const result = applyComparisonOverride(BASE_SETTINGS, true);
			expect(result.badgeStyle).toBe('solid');
		});

		it('preserves all non-badge settings when comparison is enabled', () => {
			const result = applyComparisonOverride(BASE_SETTINGS, true);
			expect(result.buttonColor).toBe(BASE_SETTINGS.buttonColor);
			expect(result.priorityPosition).toBe(BASE_SETTINGS.priorityPosition);
			expect(result.labelTint).toBe(BASE_SETTINGS.labelTint);
			expect(result.overlayGlow).toBe(BASE_SETTINGS.overlayGlow);
			expect(result.variant).toBe(BASE_SETTINGS.variant);
			expect(result.gradientReach).toBe(BASE_SETTINGS.gradientReach);
			expect(result.colorSaturation).toBe(BASE_SETTINGS.colorSaturation);
			expect(result.headerSaturation).toBe(BASE_SETTINGS.headerSaturation);
			expect(result.radialIntensity).toBe(BASE_SETTINGS.radialIntensity);
		});

		it('flips solid to outlined when comparison is enabled', () => {
			const solidSettings: IssueCardAppearanceSettings = {
				...BASE_SETTINGS,
				badgeStyle: 'solid',
			};
			const result = applyComparisonOverride(solidSettings, true);
			expect(result.badgeStyle).toBe('outlined');
		});
	});
});
