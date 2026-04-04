import type { OklchColor } from './types';

// ─── Hex → OKLCH Conversion ──────────────────────────────────────────────

function parse_hex(hex: string): [number, number, number] {
	let cleaned = hex.replace(/^#/, '');
	if (cleaned.length === 3) {
		cleaned = cleaned[0] + cleaned[0] + cleaned[1] + cleaned[1] + cleaned[2] + cleaned[2];
	}
	const r = parseInt(cleaned.slice(0, 2), 16) / 255;
	const g = parseInt(cleaned.slice(2, 4), 16) / 255;
	const b = parseInt(cleaned.slice(4, 6), 16) / 255;
	return [r, g, b];
}

function srgb_to_linear(c: number): number {
	return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

function linear_rgb_to_oklab(r: number, g: number, b: number): [number, number, number] {
	const l = 0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b;
	const m = 0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b;
	const s = 0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b;

	const l_root = Math.cbrt(l);
	const m_root = Math.cbrt(m);
	const s_root = Math.cbrt(s);

	const L = 0.2104542553 * l_root + 0.793617785 * m_root - 0.0040720468 * s_root;
	const a = 1.9779984951 * l_root - 2.428592205 * m_root + 0.4505937099 * s_root;
	const b_val = 0.0259040371 * l_root + 0.7827717662 * m_root - 0.808675766 * s_root;

	return [L, a, b_val];
}

function oklab_to_oklch(L: number, a: number, b: number): OklchColor {
	const chroma = Math.sqrt(a * a + b * b);
	let hue = (Math.atan2(b, a) * 180) / Math.PI;
	if (hue < 0) {
		hue += 360;
	}
	// For achromatic colors, set hue to 0 to avoid NaN
	if (chroma < 0.001) {
		return { lightness: L, chroma, hue: 0 };
	}
	return { lightness: L, chroma, hue };
}

export function hex_to_oklch(hex: string): OklchColor {
	const [r, g, b] = parse_hex(hex);
	const [lr, lg, lb] = [srgb_to_linear(r), srgb_to_linear(g), srgb_to_linear(b)];
	const [L, a, b_val] = linear_rgb_to_oklab(lr, lg, lb);
	return oklab_to_oklch(L, a, b_val);
}

// ─── OKLCH → CSS ─────────────────────────────────────────────────────────

export function oklch_to_css(color: OklchColor): string {
	const l = Math.round(Math.min(1, Math.max(0, color.lightness)) * 100) / 100;
	const c = Math.round(color.chroma * 100) / 100;
	const h = Math.round(color.hue * 100) / 100;
	return `oklch(${l} ${c} ${h})`;
}

// ─── Accent Color Variants ───────────────────────────────────────────────

const ACCENT_FRONT_LIGHTNESS = 0.65;
const ACCENT_SHADOW_LIGHTNESS = 0.5;
const ACCENT_HIGHLIGHT_LIGHTNESS = 0.78;

export function compute_accent_colors(hex: string): {
	front: string;
	shadow: string;
	highlight: string;
} {
	const base = hex_to_oklch(hex);
	return {
		front: oklch_to_css({
			lightness: ACCENT_FRONT_LIGHTNESS,
			chroma: base.chroma,
			hue: base.hue,
		}),
		shadow: oklch_to_css({
			lightness: ACCENT_SHADOW_LIGHTNESS,
			chroma: base.chroma,
			hue: base.hue,
		}),
		highlight: oklch_to_css({
			lightness: ACCENT_HIGHLIGHT_LIGHTNESS,
			chroma: base.chroma,
			hue: base.hue,
		}),
	};
}

// ─── Trunk Color ─────────────────────────────────────────────────────────

export function compute_trunk_color(is_dark: boolean): string {
	return is_dark ? 'oklch(0.35 0.02 60)' : 'oklch(0.45 0.02 60)';
}

// ─── Ground Shadow ───────────────────────────────────────────────────────

export function compute_ground_color(is_dark: boolean): string {
	return is_dark ? 'oklch(0.25 0.01 60)' : 'oklch(0.75 0.01 60)';
}
