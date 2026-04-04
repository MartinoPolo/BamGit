import { describe, it, expect } from 'vitest';
import {
	hex_to_oklch,
	compute_accent_colors,
	compute_trunk_color,
	oklch_to_css,
} from './color_utils';

// ─── hex_to_oklch ────────────────────────────────────────────────────────

describe('hex_to_oklch', () => {
	it('converts pure red (#ff0000) to approximate OKLCH values', () => {
		const result = hex_to_oklch('#ff0000');
		expect(result.lightness).toBeCloseTo(0.6279, 1);
		expect(result.chroma).toBeGreaterThan(0.2);
		expect(result.hue).toBeGreaterThan(20);
		expect(result.hue).toBeLessThan(35);
	});

	it('converts pure white (#ffffff) to L≈1, C≈0', () => {
		const result = hex_to_oklch('#ffffff');
		expect(result.lightness).toBeCloseTo(1.0, 1);
		expect(result.chroma).toBeCloseTo(0, 2);
	});

	it('converts pure black (#000000) to L≈0, C≈0', () => {
		const result = hex_to_oklch('#000000');
		expect(result.lightness).toBeCloseTo(0, 2);
		expect(result.chroma).toBeCloseTo(0, 2);
	});

	it('handles 3-char hex shorthand (#f00)', () => {
		const result = hex_to_oklch('#f00');
		expect(result.lightness).toBeCloseTo(0.6279, 1);
		expect(result.chroma).toBeGreaterThan(0.2);
	});

	it('handles hex without # prefix', () => {
		const result = hex_to_oklch('ef4444');
		expect(result.lightness).toBeGreaterThan(0.5);
		expect(result.chroma).toBeGreaterThan(0.1);
	});
});

// ─── compute_accent_colors ───────────────────────────────────────────────

describe('compute_accent_colors', () => {
	it('returns front at L=0.65, shadow at L=0.50, highlight at L=0.78', () => {
		const result = compute_accent_colors('#3b82f6');
		expect(result.front).toContain('oklch(');
		expect(result.shadow).toContain('oklch(');
		expect(result.highlight).toContain('oklch(');
		// Parse L values from strings
		const front_l = parse_lightness(result.front);
		const shadow_l = parse_lightness(result.shadow);
		const highlight_l = parse_lightness(result.highlight);
		expect(front_l).toBeCloseTo(0.65, 2);
		expect(shadow_l).toBeCloseTo(0.5, 2);
		expect(highlight_l).toBeCloseTo(0.78, 2);
	});

	it('preserves original chroma and hue', () => {
		const original = hex_to_oklch('#3b82f6');
		const result = compute_accent_colors('#3b82f6');
		const front_parts = parse_oklch_parts(result.front);
		expect(front_parts.chroma).toBeCloseTo(original.chroma, 2);
		expect(front_parts.hue).toBeCloseTo(original.hue, 0);
	});

	it('handles achromatic colors (black) without NaN hue', () => {
		const result = compute_accent_colors('#000000');
		expect(result.front).not.toContain('NaN');
		expect(result.shadow).not.toContain('NaN');
		expect(result.highlight).not.toContain('NaN');
	});
});

// ─── compute_trunk_color ─────────────────────────────────────────────────

describe('compute_trunk_color', () => {
	it('returns light mode trunk color when isDark=false', () => {
		const result = compute_trunk_color(false);
		expect(result).toBe('oklch(0.45 0.02 60)');
	});

	it('returns dark mode trunk color when isDark=true', () => {
		const result = compute_trunk_color(true);
		expect(result).toBe('oklch(0.35 0.02 60)');
	});
});

// ─── oklch_to_css ────────────────────────────────────────────────────────

describe('oklch_to_css', () => {
	it('formats OKLCH values to CSS string', () => {
		const result = oklch_to_css({ lightness: 0.65, chroma: 0.15, hue: 250 });
		expect(result).toBe('oklch(0.65 0.15 250)');
	});

	it('clamps lightness between 0 and 1', () => {
		const result = oklch_to_css({ lightness: 1.5, chroma: 0.1, hue: 100 });
		expect(result).toBe('oklch(1 0.1 100)');
	});
});

// ─── Helpers ─────────────────────────────────────────────────────────────

function parse_lightness(css: string): number {
	const match = css.match(/oklch\(([\d.]+)/);
	return match ? parseFloat(match[1]) : NaN;
}

function parse_oklch_parts(css: string): { lightness: number; chroma: number; hue: number } {
	const match = css.match(/oklch\(([\d.]+)\s+([\d.]+)\s+([\d.]+)\)/);
	if (!match) {
		return { lightness: NaN, chroma: NaN, hue: NaN };
	}
	return {
		lightness: parseFloat(match[1]),
		chroma: parseFloat(match[2]),
		hue: parseFloat(match[3]),
	};
}
