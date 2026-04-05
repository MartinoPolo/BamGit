<script lang="ts">
	import type { AccentColors } from './types';
	import { compute_oak_canopy_layers, compute_oak_crown_peak_y } from './oak_fullness';
	import StoneNameplate from './StoneNameplate.svelte';

	interface Props {
		completion_ratio: number;
		accent: AccentColors;
		trunk_color: string;
		ground_color: string;
		title: string;
		is_dark: boolean;
	}

	let { completion_ratio, accent, trunk_color, ground_color, title, is_dark }: Props = $props();

	const layer_count = $derived(compute_oak_canopy_layers(completion_ratio));
	const crown_peak_y = $derived(compute_oak_crown_peak_y(completion_ratio));

	// Canopy geometry — wider than sub-issue trees (spread 30) to convey PRD scale
	const CANOPY_BASE_Y = 60;
	const CANOPY_SPREAD_X = 42;
	const CANOPY_CENTER_X = 50;
	const LAYER_BASE_HEIGHT = 18;
	const LAYER_HEIGHT_TAPER = 6;
	const LAYER_WIDTH_TAPER = 0.4;

	const canopy_layers = $derived.by(() => {
		const layers: Array<{
			front: string;
			shadow: string;
			highlight: string;
		}> = [];

		for (let i = 0; i < layer_count; i++) {
			const progress = i / Math.max(1, layer_count - 1);
			const y_top = CANOPY_BASE_Y - progress * (CANOPY_BASE_Y - crown_peak_y);
			const y_bottom = y_top + LAYER_BASE_HEIGHT - progress * LAYER_HEIGHT_TAPER;
			const width = CANOPY_SPREAD_X * (1 - progress * LAYER_WIDTH_TAPER);

			const left = CANOPY_CENTER_X - width;
			const right = CANOPY_CENTER_X + width;
			const height = y_bottom - y_top;

			layers.push({
				front: `${CANOPY_CENTER_X},${y_top} ${left},${y_bottom} ${right},${y_bottom}`,
				shadow: `${CANOPY_CENTER_X},${y_top} ${right},${y_bottom} ${CANOPY_CENTER_X + width * LAYER_WIDTH_TAPER},${y_top + height * 0.5}`,
				highlight: `${CANOPY_CENTER_X},${y_top} ${CANOPY_CENTER_X - width * 0.5},${y_top + height * 0.6} ${CANOPY_CENTER_X},${y_top + height * LAYER_WIDTH_TAPER}`,
			});
		}

		return layers;
	});
</script>

<g data-oak data-completion-ratio={completion_ratio}>
	<!-- Ground shadow (wider than sub-issue trees) -->
	<polygon points="12,120 88,120 82,115 18,115" fill={ground_color} />

	<!-- Trunk (thicker: width 16 vs sub-issue 10, extends to nameplate at y=118) -->
	<rect x="42" y="55" width="16" height="63" fill={trunk_color} />
	<!-- Trunk bark detail lines -->
	<rect x="44" y="60" width="2" height="50" fill={ground_color} opacity="0.3" />
	<rect x="48" y="58" width="2" height="52" fill={ground_color} opacity="0.2" />
	<rect x="53" y="62" width="2" height="48" fill={ground_color} opacity="0.25" />

	<!-- Gnarled trunk knots -->
	<polygon points="42,75 38,72 40,78" fill={trunk_color} />
	<polygon points="58,68 62,65 60,71" fill={trunk_color} />

	<!-- Canopy layers (bottom to top, count varies by completion) -->
	{#each canopy_layers as layer, index (index)}
		<polygon points={layer.front} fill={accent.front} />
		<polygon points={layer.shadow} fill={accent.shadow} />
		{#if index > 0}
			<polygon points={layer.highlight} fill={accent.highlight} />
		{/if}
	{/each}

	<!-- Stone nameplate at base -->
	<StoneNameplate {title} {is_dark} />
</g>
