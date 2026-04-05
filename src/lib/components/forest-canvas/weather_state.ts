// ─── Weather State Derivation ─────────────────────────────────────────────
// Pure derivation of ambient weather flags from the visible-tree overlay
// descriptors and theme mode. Cheap enough to run on every render.

import type { TreeVisualization } from '$lib/types/tree_visualization';

export interface WeatherState {
	readonly leaves: boolean;
	readonly rain: boolean;
	readonly fireflies: boolean;
}

export function derive_weather(
	visualizations: readonly TreeVisualization[],
	is_dark: boolean,
): WeatherState {
	const rain = visualizations.some((visualization) =>
		visualization.overlays.includes('merge-conflict'),
	);
	return {
		leaves: true,
		rain,
		fireflies: is_dark,
	};
}
