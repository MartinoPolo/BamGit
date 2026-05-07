<script lang="ts" module>
	// eslint-disable-next-line svelte/prefer-svelte-reactivity -- intentionally non-reactive perf cache
	const thumbnailCache = new Map<string, string>();
</script>

<script lang="ts">
	import { LowPolyTree, PottedPlant, DEFAULT_TREE_CONFIG } from 'low-poly-2d-trees';
	import type { TreeConfig } from 'low-poly-2d-trees';
	import type { TreeVisualization } from '$lib/modules/visualization';

	interface Props {
		visualization: TreeVisualization;
	}

	let { visualization }: Props = $props();

	let containerElement = $state<HTMLDivElement | null>(null);
	let imageUrl = $state<string | null>(null);

	function computeCacheKey(vis: TreeVisualization): string {
		if (vis.kind === 'tree') {
			return `tree-${vis.config.seed}-${vis.config.stage}-${vis.config.shape}`;
		}
		if (vis.kind === 'oak') {
			return `oak-${vis.seed}`;
		}
		if (vis.kind === 'potted-plant') {
			return `potted-${vis.stage}-${vis.seed}`;
		}
		return 'unknown';
	}

	const cacheKey = $derived(computeCacheKey(visualization));

	const oakConfig = $derived.by((): TreeConfig | null => {
		if (visualization.kind !== 'oak') {
			return null;
		}
		return {
			...DEFAULT_TREE_CONFIG,
			shape: 'oak',
			stage: 'leafy',
			seed: visualization.seed,
		};
	});

	$effect(() => {
		const cached = thumbnailCache.get(cacheKey);
		if (cached !== undefined) {
			imageUrl = cached;
			return;
		}
		imageUrl = null;
	});

	$effect(() => {
		if (imageUrl !== null || !containerElement) {
			return;
		}
		const svg = containerElement.querySelector('svg');
		if (!svg) {
			return;
		}
		const serializer = new XMLSerializer();
		const svgString = serializer.serializeToString(svg);
		const url = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgString);
		thumbnailCache.set(cacheKey, url);
		imageUrl = url;
	});
</script>

{#if imageUrl}
	<img src={imageUrl} alt="" class="size-full object-contain" />
{:else}
	<div bind:this={containerElement} class="size-full" style:contain="strict">
		{#if visualization.kind === 'tree'}
			<LowPolyTree config={visualization.config} />
		{:else if visualization.kind === 'potted-plant'}
			<PottedPlant stage={visualization.stage} seed={visualization.seed} />
		{:else if visualization.kind === 'oak' && oakConfig}
			<LowPolyTree config={oakConfig} />
		{/if}
	</div>
{/if}
