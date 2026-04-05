const MIN_LAYERS = 2;
const MAX_LAYERS = 6;
const CROWN_Y_SPARSE = 30;
const CROWN_Y_FULL = 5;

function clamp_ratio(ratio: number): number {
	return Math.min(1, Math.max(0, ratio));
}

/** Maps completion ratio (0–1) to canopy polygon layer count (2–6). */
export function compute_oak_canopy_layers(ratio: number): number {
	const clamped = clamp_ratio(ratio);
	return Math.round(MIN_LAYERS + clamped * (MAX_LAYERS - MIN_LAYERS));
}

/** Maps completion ratio (0–1) to crown peak Y coordinate (30→5, lower = taller). */
export function compute_oak_crown_peak_y(ratio: number): number {
	const clamped = clamp_ratio(ratio);
	return CROWN_Y_SPARSE - clamped * (CROWN_Y_SPARSE - CROWN_Y_FULL);
}
