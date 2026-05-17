import { describe, it, expect } from 'vitest';
import { computeVariantSlotStyles, styleMapToString } from './issue_card_variant_css.js';
import type { IssueCardAppearanceSettings } from './issue_card_settings.js';
import type { IssueCardState } from './issue_card_variants.js';

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

function computeForVariant(
	variant: IssueCardAppearanceSettings['variant'],
	overrides: Partial<IssueCardAppearanceSettings> = {},
	options: { issueColor?: string; state?: IssueCardState } = {},
) {
	return computeVariantSlotStyles({
		variant,
		settings: makeSettings({ variant, ...overrides }),
		issueColor: options.issueColor ?? '#ff5500',
		state: options.state ?? 'interactive',
		isHovered: false,
	});
}

describe('computeVariantSlotStyles', () => {
	describe('veil variant', () => {
		it('sets --ic-color on card', () => {
			const result = computeForVariant('veil', {}, { issueColor: '#ff5500' });
			expect(result.card['--ic-color']).toBe('#ff5500');
		});

		it('computes card background as gradient using issue color and saturation', () => {
			const result = computeForVariant('veil', { colorSaturation: 150, gradientReach: 60 });
			expect(result.card.background).toContain('linear-gradient');
			expect(result.card.background).toContain('#ff5500');
			expect(result.card.background).toContain('150%');
		});

		it('uses var(--background) as mix target', () => {
			const result = computeForVariant('veil');
			expect(result.card.background).toContain('var(--background)');
		});

		it('header has transparent background', () => {
			const result = computeForVariant('veil');
			expect(result.header.background).toBe('transparent');
		});

		it('sets --ic-header-text via contrast color for veil', () => {
			const result = computeForVariant('veil', {}, { issueColor: '#000000' });
			expect(result.card['--ic-header-text']).toBe('#ffffff');
		});

		it('preview has gradient background', () => {
			const result = computeForVariant('veil');
			expect(result.preview.background).toContain('linear-gradient');
		});
	});

	describe('refined-horizon variant', () => {
		it('sets --ic-color on card', () => {
			const result = computeForVariant('refined-horizon', {}, { issueColor: '#3366cc' });
			expect(result.card['--ic-color']).toBe('#3366cc');
		});

		it('header has gradient using headerSaturation', () => {
			const result = computeForVariant('refined-horizon', { headerSaturation: 85 });
			expect(result.header.background).toContain('linear-gradient');
			expect(result.header.background).toContain('0.85');
		});

		it('header has border-bottom', () => {
			const result = computeForVariant('refined-horizon');
			expect(result.header['border-bottom']).toContain('1px solid');
		});

		it('sets --ic-header-text to var(--foreground) for non-veil', () => {
			const result = computeForVariant('refined-horizon', {}, { issueColor: '#ffffff' });
			expect(result.card['--ic-header-text']).toBe('var(--foreground)');
		});
	});

	describe('radiant variant', () => {
		it('sets --ic-color on card', () => {
			const result = computeForVariant('radiant', {}, { issueColor: '#00cc88' });
			expect(result.card['--ic-color']).toBe('#00cc88');
		});

		it('card background uses radial-gradient', () => {
			const result = computeForVariant('radiant', { radialIntensity: 75 });
			expect(result.card.background).toContain('radial-gradient');
			expect(result.card.background).toContain('0.75');
		});

		it('header has semi-transparent surface gradient', () => {
			const result = computeForVariant('radiant');
			expect(result.header.background).toContain('linear-gradient');
			expect(result.header.background).toContain('var(--surface)');
		});

		it('sets --ic-header-text to var(--foreground) for radiant', () => {
			const result = computeForVariant('radiant', {}, { issueColor: '#000000' });
			expect(result.card['--ic-header-text']).toBe('var(--foreground)');
		});

		it('preview uses gradient with theme-aware surface variables', () => {
			const result = computeForVariant('radiant');
			expect(result.preview.background).toContain('linear-gradient');
			expect(result.preview.background).toContain('var(--surface-2)');
		});
	});

	describe('overlay glow for all variants', () => {
		it('veil includes --ic-overlay-glow from settings', () => {
			const result = computeForVariant('veil', { overlayGlow: 150 });
			expect(result.card['--ic-overlay-glow']).toBe('1.5');
		});

		it('refined-horizon includes --ic-overlay-glow from settings', () => {
			const result = computeForVariant('refined-horizon', { overlayGlow: 120 });
			expect(result.card['--ic-overlay-glow']).toBe('1.2');
		});

		it('radiant includes --ic-overlay-glow from settings', () => {
			const result = computeForVariant('radiant', { overlayGlow: 100 });
			expect(result.card['--ic-overlay-glow']).toBe('1');
		});
	});

	describe('state overrides', () => {
		it('hovered state adds transform and shadow', () => {
			const result = computeVariantSlotStyles({
				variant: 'refined-horizon',
				settings: makeSettings(),
				issueColor: '#ff5500',
				state: 'hovered',
				isHovered: true,
			});
			expect(result.card.transform).toBe('translateY(-3px)');
			expect(result.card['box-shadow']).toContain('var(--shadow-lg)');
		});

		it('done state sets transparent background', () => {
			const result = computeForVariant('refined-horizon', {}, { state: 'done' });
			expect(result.card.background).toBe('transparent');
			expect(result.card['border-color']).toBe('transparent');
			expect(result.card['box-shadow']).toBe('none');
		});

		it('archived state sets opacity and grayscale', () => {
			const result = computeForVariant('refined-horizon', {}, { state: 'archived' });
			expect(result.card.opacity).toBe('0.7');
			expect(result.card.filter).toBe('grayscale(0.8)');
		});

		it('selected state uses issue-color outline and glow', () => {
			const result = computeForVariant('refined-horizon', {}, { state: 'selected' });
			expect(result.card.outline).toContain('#ff5500');
			expect(result.card['box-shadow']).toContain('#ff5500');
		});
	});

	describe('styleMapToString', () => {
		it('converts style map to CSS string', () => {
			const result = styleMapToString({ background: 'red', color: 'blue' });
			expect(result).toBe('background: red; color: blue');
		});
	});
});
