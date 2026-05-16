import { describe, it, expect } from 'vitest';
import { computeVariantCssProperties } from './issue_card_variant_css.js';
import type { IssueCardAppearanceSettings } from './issue_card_settings.js';

function makeSettings(
	overrides: Partial<IssueCardAppearanceSettings> = {},
): IssueCardAppearanceSettings {
	return {
		buttonColor: 'issue-color',
		priorityPosition: 'header-right',
		badgeStyle: 'borderless-dark',
		labelTint: 20,
		overlayGlow: 150,
		variant: 'refined-horizon',
		gradientReach: 60,
		colorSaturation: 150,
		headerSaturation: 85,
		radialIntensity: 75,
		...overrides,
	};
}

describe('computeVariantCssProperties', () => {
	describe('veil variant', () => {
		it('returns --ic-color set to issueColor', () => {
			const result = computeVariantCssProperties({
				variant: 'veil',
				settings: makeSettings({ variant: 'veil' }),
				issueColor: '#ff5500',
				theme: 'dark',
			});
			expect(result['--ic-color']).toBe('#ff5500');
		});

		it('returns --ic-gradient-reach as percentage string', () => {
			const result = computeVariantCssProperties({
				variant: 'veil',
				settings: makeSettings({ variant: 'veil', gradientReach: 60 }),
				issueColor: '#ff5500',
				theme: 'dark',
			});
			expect(result['--ic-gradient-reach']).toBe('60%');
		});

		it('returns --ic-color-sat as percentage string', () => {
			const result = computeVariantCssProperties({
				variant: 'veil',
				settings: makeSettings({ variant: 'veil', colorSaturation: 150 }),
				issueColor: '#ff5500',
				theme: 'dark',
			});
			expect(result['--ic-color-sat']).toBe('150%');
		});

		it('returns --ic-mix-target as #1e1e1e for dark theme', () => {
			const result = computeVariantCssProperties({
				variant: 'veil',
				settings: makeSettings({ variant: 'veil' }),
				issueColor: '#ff5500',
				theme: 'dark',
			});
			expect(result['--ic-mix-target']).toBe('#1e1e1e');
		});

		it('returns --ic-mix-target as #ffffff for light theme', () => {
			const result = computeVariantCssProperties({
				variant: 'veil',
				settings: makeSettings({ variant: 'veil' }),
				issueColor: '#ff5500',
				theme: 'light',
			});
			expect(result['--ic-mix-target']).toBe('#ffffff');
		});

		it('returns --ic-header-text via contrast color computation', () => {
			const result = computeVariantCssProperties({
				variant: 'veil',
				settings: makeSettings({ variant: 'veil' }),
				issueColor: '#000000',
				theme: 'dark',
			});
			// Dark background -> white text
			expect(result['--ic-header-text']).toBe('#ffffff');
		});
	});

	describe('refined-horizon variant', () => {
		it('returns --ic-color set to issueColor', () => {
			const result = computeVariantCssProperties({
				variant: 'refined-horizon',
				settings: makeSettings({ variant: 'refined-horizon' }),
				issueColor: '#3366cc',
				theme: 'dark',
			});
			expect(result['--ic-color']).toBe('#3366cc');
		});

		it('returns --ic-sat as decimal from headerSaturation', () => {
			const result = computeVariantCssProperties({
				variant: 'refined-horizon',
				settings: makeSettings({ variant: 'refined-horizon', headerSaturation: 85 }),
				issueColor: '#3366cc',
				theme: 'dark',
			});
			expect(result['--ic-sat']).toBe('0.85');
		});

		it('returns --ic-header-text via contrast color', () => {
			const result = computeVariantCssProperties({
				variant: 'refined-horizon',
				settings: makeSettings({ variant: 'refined-horizon' }),
				issueColor: '#ffffff',
				theme: 'dark',
			});
			// Light background -> black text
			expect(result['--ic-header-text']).toBe('#000000');
		});
	});

	describe('radiant variant', () => {
		it('returns --ic-color set to issueColor', () => {
			const result = computeVariantCssProperties({
				variant: 'radiant',
				settings: makeSettings({ variant: 'radiant' }),
				issueColor: '#00cc88',
				theme: 'dark',
			});
			expect(result['--ic-color']).toBe('#00cc88');
		});

		it('returns --ic-radial-intensity as decimal', () => {
			const result = computeVariantCssProperties({
				variant: 'radiant',
				settings: makeSettings({ variant: 'radiant', radialIntensity: 75 }),
				issueColor: '#00cc88',
				theme: 'dark',
			});
			expect(result['--ic-radial-intensity']).toBe('0.75');
		});

		it('returns --ic-glow-origin as fixed position', () => {
			const result = computeVariantCssProperties({
				variant: 'radiant',
				settings: makeSettings({ variant: 'radiant' }),
				issueColor: '#00cc88',
				theme: 'dark',
			});
			expect(result['--ic-glow-origin']).toBe('12% 58%');
		});

		it('returns --ic-header-text via contrast color', () => {
			const result = computeVariantCssProperties({
				variant: 'radiant',
				settings: makeSettings({ variant: 'radiant' }),
				issueColor: '#000000',
				theme: 'dark',
			});
			expect(result['--ic-header-text']).toBe('#ffffff');
		});
	});

	describe('dark theme does NOT override --header-saturate', () => {
		it('does not include --header-saturate in returned properties', () => {
			const result = computeVariantCssProperties({
				variant: 'veil',
				settings: makeSettings({ variant: 'veil' }),
				issueColor: '#ff5500',
				theme: 'dark',
			});
			expect(result).not.toHaveProperty('--header-saturate');
		});
	});

	describe('overlay glow for all variants', () => {
		it('veil includes --ic-overlay-glow from settings', () => {
			const result = computeVariantCssProperties({
				variant: 'veil',
				settings: makeSettings({ variant: 'veil', overlayGlow: 150 }),
				issueColor: '#ff5500',
				theme: 'dark',
			});
			expect(result['--ic-overlay-glow']).toBe('1.5');
		});

		it('refined-horizon includes --ic-overlay-glow from settings', () => {
			const result = computeVariantCssProperties({
				variant: 'refined-horizon',
				settings: makeSettings({ variant: 'refined-horizon', overlayGlow: 120 }),
				issueColor: '#3366cc',
				theme: 'dark',
			});
			expect(result['--ic-overlay-glow']).toBe('1.2');
		});

		it('radiant includes --ic-overlay-glow from settings', () => {
			const result = computeVariantCssProperties({
				variant: 'radiant',
				settings: makeSettings({ variant: 'radiant', overlayGlow: 100 }),
				issueColor: '#00cc88',
				theme: 'dark',
			});
			expect(result['--ic-overlay-glow']).toBe('1');
		});
	});
});
