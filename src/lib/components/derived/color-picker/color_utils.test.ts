import { describe, it, expect } from 'vitest';
import {
	isValidHexColor,
	relativeLuminance,
	sortColorsByLuminance,
	getContrastTextColor,
	DEFAULT_COLOR_PALETTE,
} from './color_utils.js';

describe('isValidHexColor', () => {
	it('returns true for valid 6-digit lowercase hex', () => {
		expect(isValidHexColor('#ff0000')).toBe(true);
	});

	it('returns true for valid 6-digit uppercase hex', () => {
		expect(isValidHexColor('#FF00AA')).toBe(true);
	});

	it('returns false for 3-digit shorthand hex', () => {
		expect(isValidHexColor('#fff')).toBe(false);
	});

	it('returns false for hex without hash prefix', () => {
		expect(isValidHexColor('ff0000')).toBe(false);
	});

	it('returns false for invalid hex characters', () => {
		expect(isValidHexColor('#gggggg')).toBe(false);
	});

	it('returns false for empty string', () => {
		expect(isValidHexColor('')).toBe(false);
	});
});

describe('relativeLuminance', () => {
	it('returns 0 for black', () => {
		expect(relativeLuminance('#000000')).toBe(0);
	});

	it('returns 1 for white', () => {
		expect(relativeLuminance('#ffffff')).toBe(1);
	});

	it('returns ~0.2126 for pure red', () => {
		expect(relativeLuminance('#ff0000')).toBeCloseTo(0.2126, 4);
	});

	it('handles uppercase hex', () => {
		expect(relativeLuminance('#FFFFFF')).toBe(1);
	});
});

describe('sortColorsByLuminance', () => {
	it('sorts darker first when darkerFirst is true (dark mode)', () => {
		const result = sortColorsByLuminance(['#ffffff', '#000000', '#808080'], true);
		expect(result).toEqual(['#000000', '#808080', '#ffffff']);
	});

	it('sorts lighter first when darkerFirst is false (light mode)', () => {
		const result = sortColorsByLuminance(['#ffffff', '#000000', '#808080'], false);
		expect(result).toEqual(['#ffffff', '#808080', '#000000']);
	});

	it('does not mutate the original array', () => {
		const original = ['#ffffff', '#000000', '#808080'];
		const originalCopy = [...original];
		sortColorsByLuminance(original, true);
		expect(original).toEqual(originalCopy);
	});
});

describe('getContrastTextColor', () => {
	it('returns dark text on white background', () => {
		expect(getContrastTextColor('#ffffff')).toBe('#000000');
	});

	it('returns light text on black background', () => {
		expect(getContrastTextColor('#000000')).toBe('#ffffff');
	});

	it('returns light text on red background', () => {
		expect(getContrastTextColor('#ff0000')).toBe('#ffffff');
	});

	it('returns dark text on yellow background', () => {
		expect(getContrastTextColor('#ffff00')).toBe('#000000');
	});
});

describe('DEFAULT_COLOR_PALETTE', () => {
	it('has exactly 24 colors', () => {
		expect(DEFAULT_COLOR_PALETTE).toHaveLength(24);
	});

	it('contains only valid hex colors', () => {
		for (const color of DEFAULT_COLOR_PALETTE) {
			expect(isValidHexColor(color), `${color} should be valid hex`).toBe(true);
		}
	});

	it('contains no duplicates', () => {
		const unique = new Set(DEFAULT_COLOR_PALETTE.map((c) => c.toLowerCase()));
		expect(unique.size).toBe(DEFAULT_COLOR_PALETTE.length);
	});
});
