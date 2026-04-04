<script lang="ts">
	import type { TreeVisualizationTree } from '$lib/types/tree_visualization';
	import { STAGE_TO_GROUP, VIEWBOX_WIDTH, VIEWBOX_HEIGHT } from './types';
	import {
		compute_accent_colors,
		compute_trunk_color,
		compute_ground_color,
	} from './color_utils';
	import SeedSprout from './SeedSprout.svelte';
	import Sapling from './Sapling.svelte';
	import MatureTree from './MatureTree.svelte';
	import DeadTree from './DeadTree.svelte';
	import { fade } from 'svelte/transition';

	interface Props {
		visualization: TreeVisualizationTree;
		accent_color: string;
		is_dark?: boolean;
	}

	let { visualization, accent_color, is_dark = false }: Props = $props();

	const group = $derived(STAGE_TO_GROUP[visualization.stage]);
	const accent = $derived(compute_accent_colors(accent_color));
	const trunk_color = $derived(compute_trunk_color(is_dark));
	const ground_color = $derived(compute_ground_color(is_dark));
</script>

<svg
	viewBox="0 0 {VIEWBOX_WIDTH} {VIEWBOX_HEIGHT}"
	xmlns="http://www.w3.org/2000/svg"
	role="img"
	aria-label="Tree visualization: {visualization.stage} stage"
>
	{#key group}
		<g transition:fade={{ duration: 200 }}>
			{#if group === 'seed-sprout'}
				<SeedSprout
					stage={visualization.stage as 'seed' | 'sprouting'}
					{accent}
					{trunk_color}
					{ground_color}
				/>
			{:else if group === 'sapling'}
				<Sapling
					stage={visualization.stage as 'sapling' | 'growing'}
					{accent}
					{trunk_color}
					{ground_color}
				/>
			{:else if group === 'mature-tree'}
				<MatureTree
					stage={visualization.stage as 'leafy' | 'fruiting' | 'autumn' | 'ready'}
					{accent}
					{trunk_color}
					{ground_color}
					fruit_types={visualization.fruitTypes}
				/>
			{:else if group === 'dead-tree'}
				<DeadTree
					stage={visualization.stage as 'bare' | 'dead' | 'stump'}
					{accent}
					{trunk_color}
					{ground_color}
				/>
			{/if}
		</g>
	{/key}
</svg>
