/**
 * 24-color palette organized as 6 hue columns x 4 rows.
 * Row 1: normal hues (red, orange, yellow, green, blue, purple)
 * Row 2: darker variants
 * Row 3: lighter variants
 * Row 4: specials (black, white, gray, teal, pink, brown)
 */
export const DEFAULT_COLOR_PALETTE: string[] = [
	// Row 1: normal hues
	'#e53e3e',
	'#dd6b20',
	'#d69e2e',
	'#38a169',
	'#3182ce',
	'#805ad5',
	// Row 2: darker variants
	'#9b2c2c',
	'#9c4221',
	'#975a16',
	'#276749',
	'#2c5282',
	'#553c9a',
	// Row 3: lighter variants
	'#fc8181',
	'#f6ad55',
	'#f6e05e',
	'#68d391',
	'#63b3ed',
	'#b794f4',
	// Row 4: specials (black, white, gray, teal, pink, brown)
	'#1a202c',
	'#ffffff',
	'#a0aec0',
	'#319795',
	'#ed64a6',
	'#8b5e3c',
];

/**
 * 12 workspace accent colors derived from OKLCH 500 token values.
 * Grid order: 2 rows × 6 columns matching the design spec.
 */
export const WORKSPACE_ACCENT_PALETTE: string[] = [
	// Row 1: moss, amber, gold, coral, rose, fuchsia
	'#62874b',
	'#e77a16',
	'#af8a00',
	'#d35b4b',
	'#d95e6d',
	'#bb4d87',
	// Row 2: sage, teal, azure, indigo, plum, bark
	'#4f906f',
	'#009a9b',
	'#0082b8',
	'#5864bf',
	'#9a53aa',
	'#845738',
];

const HEX_COLOR_PATTERN = /^#[0-9a-f]{6}$/i;

/**
 * Validates that a string is a 6-digit hex color with # prefix.
 * Shorthand (3-digit) hex is not accepted.
 */
export function isValidHexColor(value: string): boolean {
	return HEX_COLOR_PATTERN.test(value);
}

/**
 * Linearizes an sRGB channel value (0-255) to linear RGB.
 */
function linearizeSrgbChannel(channelValue: number): number {
	const normalized = channelValue / 255;
	if (normalized <= 0.04045) {
		return normalized / 12.92;
	}
	return Math.pow((normalized + 0.055) / 1.055, 2.4);
}

/**
 * Calculates WCAG 2.0 relative luminance from a 6-digit hex color.
 * Formula: L = 0.2126 * R + 0.7152 * G + 0.0722 * B
 */
export function relativeLuminance(hex: string): number {
	const red = parseInt(hex.slice(1, 3), 16);
	const green = parseInt(hex.slice(3, 5), 16);
	const blue = parseInt(hex.slice(5, 7), 16);

	return (
		0.2126 * linearizeSrgbChannel(red) +
		0.7152 * linearizeSrgbChannel(green) +
		0.0722 * linearizeSrgbChannel(blue)
	);
}

/**
 * Sorts hex colors by perceived brightness (luminance).
 * @param darkerFirst - true for dark mode (darker at top), false for light mode (lighter at top)
 * Returns a new array; does not mutate the input.
 */
export function sortColorsByLuminance(colors: readonly string[], darkerFirst: boolean): string[] {
	return [...colors].sort((colorA, colorB) => {
		const luminanceA = relativeLuminance(colorA);
		const luminanceB = relativeLuminance(colorB);
		if (darkerFirst) {
			return luminanceA - luminanceB;
		}
		return luminanceB - luminanceA;
	});
}

/**
 * Luminance threshold for text color selection.
 * Colors with luminance above this get dark text; at or below get light text.
 * Set above pure red (0.2126) so saturated colors like red get white text for visual clarity.
 */
export const CONTRAST_LUMINANCE_THRESHOLD = 0.2126;

/**
 * Returns '#000000' or '#ffffff' for best text readability on the given background color.
 * Uses a luminance threshold tuned for visual clarity on saturated colors.
 */
export function getContrastTextColor(backgroundHex: string): string {
	if (relativeLuminance(backgroundHex) > CONTRAST_LUMINANCE_THRESHOLD) {
		return '#000000';
	}
	return '#ffffff';
}
