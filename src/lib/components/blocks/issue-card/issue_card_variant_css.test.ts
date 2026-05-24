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
		badgeStyle: 'subtle',
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
	options: {
		issueColor?: string;
		state?: IssueCardState;
		isHovered?: boolean;
		isDone?: boolean;
		labels?: ReadonlyArray<{ name: string; color: string }>;
	} = {},
) {
	return computeVariantSlotStyles({
		variant,
		settings: makeSettings({ variant, ...overrides }),
		issueColor: options.issueColor ?? '#ff5500',
		state: options.state ?? 'interactive',
		isHovered: options.isHovered ?? false,
		isDone: options.isDone ?? false,
		labels: options.labels ?? [],
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
				isDone: false,
				isHovered: true,
				labels: [],
			});
			expect(result.card.transform).toBe('translateY(-3px)');
			expect(result.card['box-shadow']).toContain('var(--shadow-lg)');
		});

		it('archived state sets opacity and grayscale', () => {
			const result = computeForVariant('refined-horizon', {}, { state: 'archived' });
			expect(result.card.opacity).toBe('0.7');
			expect(result.card.filter).toBe('grayscale(0.8)');
		});

		it('selected state uses --primary outline and glow', () => {
			const result = computeForVariant('refined-horizon', {}, { state: 'selected' });
			expect(result.card.outline).toContain('var(--primary)');
			expect(result.card['box-shadow']).toContain('var(--primary)');
		});

		it('done state sets transparent bg, transparent border, no shadow', () => {
			const result = computeForVariant('refined-horizon', {}, { state: 'done' });
			expect(result.card.background).toBe('transparent');
			expect(result.card['border-color']).toBe('transparent');
			expect(result.card['box-shadow']).toBe('none');
		});

		it('done state does NOT set opacity (full opacity)', () => {
			const result = computeForVariant('refined-horizon', {}, { state: 'done' });
			expect(result.card.opacity).toBeUndefined();
		});

		it('hovered state with isDone uses neutral bg/border instead of issue-color glow', () => {
			const result = computeVariantSlotStyles({
				variant: 'refined-horizon',
				settings: makeSettings(),
				issueColor: '#ff5500',
				state: 'hovered',
				isHovered: true,
				isDone: true,
				labels: [],
			});
			expect(result.card.background).toBe('var(--surface)');
			expect(result.card['border-color']).toBe('var(--border)');
			expect(result.card['box-shadow']).toBe('var(--shadow-sm)');
			expect(result.card.transform).toBe('translateY(-2px)');
		});

		it('hovered state without isDone uses issue-color glow as before', () => {
			const result = computeVariantSlotStyles({
				variant: 'refined-horizon',
				settings: makeSettings(),
				issueColor: '#ff5500',
				state: 'hovered',
				isHovered: true,
				isDone: false,
				labels: [],
			});
			expect(result.card['box-shadow']).toContain('#ff5500');
			expect(result.card.transform).toBe('translateY(-3px)');
		});
	});

	describe('styleMapToString', () => {
		it('converts style map to CSS string', () => {
			const result = styleMapToString({ background: 'red', color: 'blue' });
			expect(result).toBe('background: red; color: blue');
		});
	});

	describe('ghost state CSS', () => {
		describe('base (0 labels, not hovered)', () => {
			it('has dashed border-style', () => {
				const result = computeForVariant('veil', {}, { state: 'ghost' });
				expect(result.card['border-style']).toBe('dashed');
			});

			it('has neutral gray border-color', () => {
				const result = computeForVariant('veil', {}, { state: 'ghost' });
				expect(result.card['border-color']).toBe('var(--border)');
			});

			it('has neutral #1e1e1e background', () => {
				const result = computeForVariant('veil', {}, { state: 'ghost' });
				expect(result.card.background).toBe('#1e1e1e');
			});

			it('has no box-shadow', () => {
				const result = computeForVariant('veil', {}, { state: 'ghost' });
				expect(result.card['box-shadow']).toBe('none');
			});

			it('has opacity 0.82', () => {
				const result = computeForVariant('veil', {}, { state: 'ghost' });
				expect(result.card.opacity).toBe('0.82');
			});

			it('sets --ic-color to issueColor', () => {
				const result = computeForVariant(
					'veil',
					{},
					{ state: 'ghost', issueColor: '#aabbcc' },
				);
				expect(result.card['--ic-color']).toBe('#aabbcc');
			});

			it('sets --ic-header-text to var(--foreground)', () => {
				const result = computeForVariant('veil', {}, { state: 'ghost' });
				expect(result.card['--ic-header-text']).toBe('var(--foreground)');
			});

			it('has transparent header background', () => {
				const result = computeForVariant('veil', {}, { state: 'ghost' });
				expect(result.header.background).toBe('transparent');
			});
		});

		describe('hover (0 labels, hovered)', () => {
			it('has brighter border-color on hover', () => {
				const result = computeForVariant('veil', {}, { state: 'ghost', isHovered: true });
				expect(result.card['border-color']).toBe('var(--border-strong)');
			});

			it('has subtle gradient background on hover', () => {
				const result = computeForVariant('veil', {}, { state: 'ghost', isHovered: true });
				expect(result.card.background).toContain('linear-gradient');
			});

			it('has translateY(-2px) transform on hover', () => {
				const result = computeForVariant('veil', {}, { state: 'ghost', isHovered: true });
				expect(result.card.transform).toBe('translateY(-2px)');
			});

			it('has opacity 0.92 on hover', () => {
				const result = computeForVariant('veil', {}, { state: 'ghost', isHovered: true });
				expect(result.card.opacity).toBe('0.92');
			});

			it('keeps dashed border-style on hover', () => {
				const result = computeForVariant('veil', {}, { state: 'ghost', isHovered: true });
				expect(result.card['border-style']).toBe('dashed');
			});
		});

		describe('hover with labels', () => {
			const oneLabel = [{ name: 'bug', color: '#ff0000' }];

			it('labeled ghost hover gains gradient overlay on top of tint', () => {
				const result = computeForVariant(
					'veil',
					{ labelTint: 20 },
					{ state: 'ghost', isHovered: true, labels: oneLabel },
				);
				expect(result.card.background).toContain('linear-gradient');
				expect(result.card.background).toContain('#ff0000');
			});

			it('labeled ghost hover still lifts and brightens border', () => {
				const result = computeForVariant(
					'veil',
					{},
					{ state: 'ghost', isHovered: true, labels: oneLabel },
				);
				expect(result.card.transform).toBe('translateY(-2px)');
				expect(result.card['border-color']).toBe('var(--border-strong)');
			});
		});

		describe('1 label tinting', () => {
			const oneLabel = [{ name: 'bug', color: '#ff0000' }];

			it('card background uses color-mix with label color', () => {
				const result = computeForVariant(
					'veil',
					{ labelTint: 20 },
					{ state: 'ghost', labels: oneLabel },
				);
				expect(result.card.background).toContain('color-mix');
				expect(result.card.background).toContain('#ff0000');
				expect(result.card.background).toContain('20%');
			});

			it('header background uses higher tint opacity', () => {
				const result = computeForVariant(
					'veil',
					{ labelTint: 20 },
					{ state: 'ghost', labels: oneLabel },
				);
				expect(result.header.background).toContain('color-mix');
				expect(result.header.background).toContain('#ff0000');
				expect(result.header.background).toContain('40%');
			});
		});

		describe('2 labels tinting', () => {
			const twoLabels = [
				{ name: 'enhancement', color: '#00ff00' },
				{ name: 'bug', color: '#ff0000' },
			];

			it('sorts labels alphabetically and uses gradient', () => {
				const result = computeForVariant(
					'veil',
					{ labelTint: 20 },
					{ state: 'ghost', labels: twoLabels },
				);
				expect(result.card.background).toContain('linear-gradient');
				// bug (#ff0000) comes first alphabetically, enhancement (#00ff00) second
				const bgValue = result.card.background;
				const firstColorIdx = bgValue.indexOf('#ff0000');
				const secondColorIdx = bgValue.indexOf('#00ff00');
				expect(firstColorIdx).toBeLessThan(secondColorIdx);
			});

			it('both labels appear in the gradient', () => {
				const result = computeForVariant(
					'veil',
					{ labelTint: 20 },
					{ state: 'ghost', labels: twoLabels },
				);
				expect(result.card.background).toContain('#ff0000');
				expect(result.card.background).toContain('#00ff00');
			});
		});

		describe('3+ labels tinting', () => {
			const threeLabels = [
				{ name: 'enhancement', color: '#00ff00' },
				{ name: 'bug', color: '#ff0000' },
				{ name: 'docs', color: '#0000ff' },
			];

			it('uses only first 2 alphabetically (same as 2-label)', () => {
				const result = computeForVariant(
					'veil',
					{ labelTint: 20 },
					{ state: 'ghost', labels: threeLabels },
				);
				// alphabetically: bug, docs, enhancement → first 2 are bug (#ff0000) and docs (#0000ff)
				expect(result.card.background).toContain('#ff0000');
				expect(result.card.background).toContain('#0000ff');
				expect(result.card.background).not.toContain('#00ff00');
			});
		});

		describe('labelTint respects settings', () => {
			const oneLabel = [{ name: 'bug', color: '#ff0000' }];

			it('uses 10% tint when labelTint is 10', () => {
				const result = computeForVariant(
					'veil',
					{ labelTint: 10 },
					{ state: 'ghost', labels: oneLabel },
				);
				expect(result.card.background).toContain('10%');
			});

			it('uses 30% tint when labelTint is 30', () => {
				const result = computeForVariant(
					'veil',
					{ labelTint: 30 },
					{ state: 'ghost', labels: oneLabel },
				);
				expect(result.card.background).toContain('30%');
			});
		});

		describe('ghost produces same styles regardless of variant', () => {
			it('veil ghost matches refined-horizon ghost', () => {
				const veilResult = computeForVariant('veil', {}, { state: 'ghost' });
				const horizonResult = computeForVariant('refined-horizon', {}, { state: 'ghost' });
				expect(veilResult.card.background).toBe(horizonResult.card.background);
				expect(veilResult.card['border-style']).toBe(horizonResult.card['border-style']);
				expect(veilResult.card.opacity).toBe(horizonResult.card.opacity);
			});

			it('veil ghost matches radiant ghost', () => {
				const veilResult = computeForVariant('veil', {}, { state: 'ghost' });
				const radiantResult = computeForVariant('radiant', {}, { state: 'ghost' });
				expect(veilResult.card.background).toBe(radiantResult.card.background);
				expect(veilResult.card['border-style']).toBe(radiantResult.card['border-style']);
				expect(veilResult.card.opacity).toBe(radiantResult.card.opacity);
			});

			it('refined-horizon ghost matches radiant ghost', () => {
				const horizonResult = computeForVariant('refined-horizon', {}, { state: 'ghost' });
				const radiantResult = computeForVariant('radiant', {}, { state: 'ghost' });
				expect(horizonResult.card.background).toBe(radiantResult.card.background);
				expect(horizonResult.card['border-style']).toBe(radiantResult.card['border-style']);
				expect(horizonResult.card.opacity).toBe(radiantResult.card.opacity);
			});
		});
	});
});
