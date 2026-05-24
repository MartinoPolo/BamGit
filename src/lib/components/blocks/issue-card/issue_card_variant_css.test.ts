import { describe, it, expect } from 'vitest';
import { computeVariantSlotStyles, styleMapToString } from './issue_card_variant_css.js';
import { deriveSessionOverlay } from './issue_card.context.svelte.js';
import type { IssueCardAppearanceSettings } from './issue_card_settings.js';
import type { IssueCardState } from './issue_card_variants.js';
import type { SessionOverlay } from './types.js';

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
	options: { issueColor?: string; state?: IssueCardState; sessionOverlay?: SessionOverlay } = {},
) {
	return computeVariantSlotStyles({
		variant,
		settings: makeSettings({ variant, ...overrides }),
		issueColor: options.issueColor ?? '#ff5500',
		state: options.state ?? 'interactive',
		isHovered: false,
		sessionOverlay: options.sessionOverlay ?? null,
	});
}

function computeHovered(
	variant: IssueCardAppearanceSettings['variant'],
	overrides: Partial<IssueCardAppearanceSettings> = {},
	options: { issueColor?: string; state?: IssueCardState; sessionOverlay?: SessionOverlay } = {},
) {
	return computeVariantSlotStyles({
		variant,
		settings: makeSettings({ variant, ...overrides }),
		issueColor: options.issueColor ?? '#ff5500',
		state: options.state ?? 'hovered',
		isHovered: true,
		sessionOverlay: options.sessionOverlay ?? null,
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
				sessionOverlay: null,
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
	});

	describe('styleMapToString', () => {
		it('converts style map to CSS string', () => {
			const result = styleMapToString({ background: 'red', color: 'blue' });
			expect(result).toBe('background: red; color: blue');
		});
	});

	describe('session overlay', () => {
		it('B1: error overlay sets border-color to session-errored', () => {
			const result = computeForVariant('refined-horizon', {}, { sessionOverlay: 'error' });
			expect(result.card['border-color']).toContain('session-errored');
		});

		it('B2: error overlay sets animation to ic-error-pulse', () => {
			const result = computeForVariant('refined-horizon', {}, { sessionOverlay: 'error' });
			expect(result.card['animation']).toContain('ic-error-pulse');
		});

		it('B3: error overlay sets box-shadow with red glow color', () => {
			const result = computeForVariant('refined-horizon', {}, { sessionOverlay: 'error' });
			expect(result.card['box-shadow']).toContain('var(--session-errored)');
		});

		it('B4: needs-input overlay sets border-color to session-needs-input', () => {
			const result = computeForVariant(
				'refined-horizon',
				{},
				{ sessionOverlay: 'needs-input' },
			);
			expect(result.card['border-color']).toContain('session-needs-input');
		});

		it('B5: needs-input overlay sets animation to ic-needs-input-pulse', () => {
			const result = computeForVariant(
				'refined-horizon',
				{},
				{ sessionOverlay: 'needs-input' },
			);
			expect(result.card['animation']).toContain('ic-needs-input-pulse');
		});

		it('B6: needs-input overlay sets box-shadow with amber glow', () => {
			const result = computeForVariant(
				'refined-horizon',
				{},
				{ sessionOverlay: 'needs-input' },
			);
			expect(result.card['box-shadow']).toContain('var(--session-needs-input)');
		});

		it('B7: null overlay applies no animation and leaves border-color unchanged', () => {
			const withOverlay = computeForVariant('refined-horizon', {}, { sessionOverlay: null });
			const baseline = computeForVariant('refined-horizon');
			expect(withOverlay.card['animation']).toBeUndefined();
			expect(withOverlay.card['border-color']).toBe(baseline.card['border-color']);
		});

		it('B8: active + error has both outline from active and border/animation from error', () => {
			const result = computeForVariant(
				'refined-horizon',
				{},
				{ state: 'active', sessionOverlay: 'error' },
			);
			expect(result.card['outline']).toContain('#ff5500');
			expect(result.card['border-color']).toContain('session-errored');
			expect(result.card['animation']).toContain('ic-error-pulse');
		});

		it('B9: selected + needs-input has both outline from selected and border/animation from needs-input', () => {
			const result = computeForVariant(
				'refined-horizon',
				{},
				{ state: 'selected', sessionOverlay: 'needs-input' },
			);
			expect(result.card['outline']).toContain('var(--primary)');
			expect(result.card['border-color']).toContain('session-needs-input');
			expect(result.card['animation']).toContain('ic-needs-input-pulse');
		});

		it('B10: hovered + error has hover transform and error overlay border/animation', () => {
			const result = computeHovered('refined-horizon', {}, { sessionOverlay: 'error' });
			expect(result.card['transform']).toContain('translateY');
			expect(result.card['border-color']).toContain('session-errored');
			expect(result.card['animation']).toContain('ic-error-pulse');
		});

		it('B11: overlayGlow 100 produces scale factor 1, overlayGlow 200 produces 2', () => {
			const at100 = computeForVariant(
				'refined-horizon',
				{ overlayGlow: 100 },
				{ sessionOverlay: 'error' },
			);
			expect(at100.card['--ic-overlay-glow']).toBe('1');

			const at200 = computeForVariant(
				'refined-horizon',
				{ overlayGlow: 200 },
				{ sessionOverlay: 'error' },
			);
			expect(at200.card['--ic-overlay-glow']).toBe('2');
			expect(at100.card['box-shadow']).toContain('var(--ic-overlay-glow)');
		});

		it('B12: error overlay box-shadow is appended to existing state box-shadow', () => {
			const activeBase = computeForVariant(
				'refined-horizon',
				{},
				{ state: 'active', sessionOverlay: null },
			);
			const activeWithError = computeForVariant(
				'refined-horizon',
				{},
				{ state: 'active', sessionOverlay: 'error' },
			);
			const existingShadow = activeBase.card['box-shadow'];
			expect(activeWithError.card['box-shadow']).toContain(existingShadow);
			expect(activeWithError.card['box-shadow']).toContain('var(--session-errored)');
		});
	});

	describe('deriveSessionOverlay (B13)', () => {
		it('maps error sessionState to error overlay', () => {
			expect(deriveSessionOverlay('error')).toBe('error');
		});

		it('maps hitl sessionState to needs-input overlay', () => {
			expect(deriveSessionOverlay('hitl')).toBe('needs-input');
		});

		it('maps executing sessionState to null overlay', () => {
			expect(deriveSessionOverlay('executing')).toBeNull();
		});

		it('maps null sessionState to null overlay', () => {
			expect(deriveSessionOverlay(null)).toBeNull();
		});

		it('maps review sessionState to null overlay', () => {
			expect(deriveSessionOverlay('review')).toBeNull();
		});

		it('maps paused sessionState to null overlay', () => {
			expect(deriveSessionOverlay('paused')).toBeNull();
		});

		it('maps done sessionState to null overlay', () => {
			expect(deriveSessionOverlay('done')).toBeNull();
		});
	});
});
