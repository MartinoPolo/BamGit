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
const CONTRAST_LUMINANCE_THRESHOLD = 0.2126;

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
