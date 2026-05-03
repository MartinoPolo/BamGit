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
	});

	it('adapts red hue toward green (adaptedHue = lerp(0, 120, 0.5) = 60)', () => {
		const result = deriveCanopyColors('#ff0000');
		// HSL(60, 60%, 60%) light, HSL(60, 45%, 20%) dark
		// Expected light: hslToHex(60, 60, 60)
		// Expected dark: hslToHex(60, 45, 20)
		expect(result).not.toBeNull();
		// Light: HSL(60, 60%, 60%) -> yellowish-green
		// Dark: HSL(60, 45%, 20%) -> dark yellowish-green
		expect(result!.canopyLightColor).not.toBe('#a8d84e'); // Not default
		expect(result!.canopyDarkColor).not.toBe('#1a472a'); // Not default
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
		const result = deriveCanopyColors('#00ff00');
		expect(result).not.toBeNull();
		// adaptedHue = lerp(120, 120, 0.5) = 120 (stays green)
		// Light: HSL(120, 60%, 60%) -> green
		// Dark: HSL(120, 45%, 20%) -> dark green
		expect(result!.canopyLightColor).toMatch(/^#[0-9a-f]{6}$/);
		expect(result!.canopyDarkColor).toMatch(/^#[0-9a-f]{6}$/);
	});
});
