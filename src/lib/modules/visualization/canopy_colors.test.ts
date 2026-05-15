import { describe, it, expect } from 'vitest';
import { deriveCanopyColors } from './testing';

// ════════════════════════════════════════════════════════════════════════
// deriveCanopyColors
// ════════════════════════════════════════════════════════════════════════

describe('deriveCanopyColors — chromatic hex colors', () => {
	it('returns canopy colors with adapted hue for red input', () => {
		const result = deriveCanopyColors('#ff0000');
		expect(result).not.toBeNull();
		expect(result!.canopyLightColor).toMatch(/^#[0-9a-f]{6}$/);
		expect(result!.canopyDarkColor).toMatch(/^#[0-9a-f]{6}$/);
		expect(result!.canopyLightColor).not.toBe(result!.canopyDarkColor);
	});

	it('adapts red hue toward green (adaptedHue = lerp(0, 120, 0.5) = 60)', () => {
		// Red: h=0, adaptedHue = 0 + (120-0)*0.5 = 60
		// Light: hslToHex(60, 60%, 60%) = #d6d65c (yellow-green, higher lightness)
		// Dark:  hslToHex(60, 45%, 20%) = #4a4a1c (dark yellow-green, lower lightness)
		const result = deriveCanopyColors('#ff0000');
		expect(result).not.toBeNull();
		expect(result!.canopyLightColor).toBe('#d6d65c');
		expect(result!.canopyDarkColor).toBe('#4a4a1c');
	});
});

describe('deriveCanopyColors — achromatic colors', () => {
	it('returns null for grey (saturation < 5%)', () => {
		const result = deriveCanopyColors('#808080');
		expect(result).toBeNull();
	});

	it('returns null for white', () => {
		const result = deriveCanopyColors('#ffffff');
		expect(result).toBeNull();
	});

	it('returns null for black', () => {
		const result = deriveCanopyColors('#000000');
		expect(result).toBeNull();
	});
});

describe('deriveCanopyColors — green input', () => {
	it('returns canopy colors with green hue for pure green input', () => {
		// Green: h=120, adaptedHue = 120 + (120-120)*0.5 = 120 (stays green)
		// Light: hslToHex(120, 60%, 60%) = #5cd65c (medium green, higher lightness)
		// Dark:  hslToHex(120, 45%, 20%) = #1c4a1c (dark green, lower lightness)
		const result = deriveCanopyColors('#00ff00');
		expect(result).not.toBeNull();
		expect(result!.canopyLightColor).toBe('#5cd65c');
		expect(result!.canopyDarkColor).toBe('#1c4a1c');
		expect(result!.canopyLightColor).not.toBe(result!.canopyDarkColor);
	});
});
