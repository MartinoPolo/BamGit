<script lang="ts">
	import type { TreeVisualizationPottedPlant } from '$lib/types/tree_visualization';
	import { POTTED_STAGE_TO_GROUP, POTTED_VIEWBOX_WIDTH, POTTED_VIEWBOX_HEIGHT } from './types';
	import {
		compute_accent_colors,
		compute_trunk_color,
		compute_ground_color,
	} from '../tree/color_utils';
	import PottedSoil from './PottedSoil.svelte';
	import PottedPlant from './PottedPlant.svelte';
	import PottedDried from './PottedDried.svelte';
	import { fade } from 'svelte/transition';

	interface Props {
		visualization?: TreeVisualizationPottedPlant;
		accent_color: string;
		is_dark?: boolean;
	}

	let { visualization, accent_color, is_dark = false }: Props = $props();

	const group = $derived(visualization ? POTTED_STAGE_TO_GROUP[visualization.stage] : undefined);
	const accent = $derived(compute_accent_colors(accent_color));
	const trunk_color = $derived(compute_trunk_color(is_dark));
	const ground_color = $derived(compute_ground_color(is_dark));
</script>

{#if visualization}
	<svg
		viewBox="0 0 {POTTED_VIEWBOX_WIDTH} {POTTED_VIEWBOX_HEIGHT}"
		xmlns="http://www.w3.org/2000/svg"
		role="img"
		aria-label="Potted plant visualization: {visualization.stage} stage"
	>
		{#key group}
			<g transition:fade={{ duration: 200 }}>
				{#if group === 'soil-sprout'}
					<PottedSoil
						stage={visualization.stage as 'pot-with-soil' | 'sprout'}
						{accent}
						{trunk_color}
						{ground_color}
						{is_dark}
					/>
				{:else if group === 'plant'}
					<PottedPlant
						stage={visualization.stage as 'small-plant' | 'flowering'}
						{accent}
						{trunk_color}
						{ground_color}
						{is_dark}
					/>
				{:else if group === 'dried'}
					<PottedDried {accent} {trunk_color} {ground_color} {is_dark} />
				{/if}
			</g>
		{/key}
	</svg>
{/if}
