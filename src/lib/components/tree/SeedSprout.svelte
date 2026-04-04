<script lang="ts">
	import type { TreeStage } from '$lib/types/tree_visualization';
	import type { AccentColors, AttachmentPoints } from './types';
	import { compute_attachment_points } from './attachment_points';

	interface Props {
		stage: Extract<TreeStage, 'seed' | 'sprouting'>;
		accent: AccentColors;
		trunk_color: string;
		ground_color: string;
	}

	let { stage, accent, trunk_color, ground_color }: Props = $props();

	const attachment_points: AttachmentPoints = $derived(compute_attachment_points(stage));
</script>

<g data-stage={stage} data-attachment-points={JSON.stringify(attachment_points)}>
	<!-- Ground shadow -->
	<polygon points="30,120 70,120 65,115 35,115" fill={ground_color} />

	{#if stage === 'seed'}
		<!-- Seed: angular pentagon at ground level -->
		<polygon points="50,100 58,105 56,114 44,114 42,105" fill={accent.front} />
		<polygon points="50,100 42,105 44,114 50,107" fill={accent.shadow} />
		<!-- Seed highlight facet -->
		<polygon points="50,100 58,105 54,103" fill={accent.highlight} />
	{:else}
		<!-- Sprouting: seed body + angular leaves emerging -->
		<!-- Seed body (slightly open) -->
		<polygon points="50,105 58,110 56,118 44,118 42,110" fill={accent.shadow} />
		<polygon points="50,105 42,110 44,118 48,112" fill={ground_color} />

		<!-- Stem -->
		<rect x="48" y="85" width="4" height="20" fill={trunk_color} />

		<!-- Left leaf (angular) -->
		<polygon points="48,90 38,82 42,88" fill={accent.front} />
		<polygon points="48,90 38,82 40,85" fill={accent.highlight} />

		<!-- Right leaf (angular) -->
		<polygon points="52,86 62,78 58,84" fill={accent.front} />
		<polygon points="52,86 62,78 60,81" fill={accent.shadow} />
	{/if}
</g>
