<script lang="ts">
	import type { TreeVisualization } from '$lib/types/tree_visualization';
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
	import OakTree from './OakTree.svelte';
	import { fade } from 'svelte/transition';

	interface Props {
		visualization?: TreeVisualization;
		accent_color: string;
		is_dark?: boolean;
	}

	let { visualization, accent_color, is_dark = false }: Props = $props();

	const tree_visualization = $derived(visualization?.kind === 'tree' ? visualization : undefined);
	const group = $derived(
		tree_visualization ? STAGE_TO_GROUP[tree_visualization.stage] : undefined,
	);
	const accent = $derived(compute_accent_colors(accent_color));
	const trunk_color = $derived(compute_trunk_color(is_dark));
	const ground_color = $derived(compute_ground_color(is_dark));

	const aria_label = $derived.by(() => {
		if (!visualization) {
			return '';
		}
		if (visualization.kind === 'oak') {
			return `Oak tree: ${visualization.title || 'PRD'}`;
		}
		if (visualization.kind === 'tree') {
			return `Tree visualization: ${visualization.stage} stage`;
		}
		return `Potted plant visualization`;
	});
</script>

{#if visualization}
	<svg
		viewBox="0 0 {VIEWBOX_WIDTH} {VIEWBOX_HEIGHT}"
		xmlns="http://www.w3.org/2000/svg"
		role="img"
		aria-label={aria_label}
	>
		{#if visualization.kind === 'oak'}
			<g transition:fade={{ duration: 200 }}>
				<OakTree
					completion_ratio={visualization.completionRatio}
					{accent}
					{trunk_color}
					{ground_color}
					title={visualization.title}
					{is_dark}
				/>
			</g>
		{:else if tree_visualization}
			{#key group}
				<g transition:fade={{ duration: 200 }}>
					{#if group === 'seed-sprout'}
						<SeedSprout
							stage={tree_visualization.stage as 'seed' | 'sprouting'}
							{accent}
							{trunk_color}
							{ground_color}
						/>
					{:else if group === 'sapling'}
						<Sapling
							stage={tree_visualization.stage as 'sapling' | 'growing'}
							{accent}
							{trunk_color}
							{ground_color}
						/>
					{:else if group === 'mature-tree'}
						<MatureTree
							stage={tree_visualization.stage as
								| 'leafy'
								| 'fruiting'
								| 'autumn'
								| 'ready'}
							{accent}
							{trunk_color}
							{ground_color}
							fruit_types={tree_visualization.fruitTypes}
						/>
					{:else if group === 'dead-tree'}
						<DeadTree
							stage={tree_visualization.stage as 'bare' | 'dead' | 'stump'}
							{accent}
							{trunk_color}
							{ground_color}
						/>
					{/if}
				</g>
			{/key}
		{/if}
	</svg>
{/if}
