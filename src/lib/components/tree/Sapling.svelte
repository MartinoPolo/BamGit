<script lang="ts">
	import type { TreeStage } from '$lib/types/tree_visualization';
	import type { AccentColors, AttachmentPoints } from './types';
	import { compute_attachment_points } from './attachment_points';

	interface Props {
		stage: Extract<TreeStage, 'sapling' | 'growing'>;
		accent: AccentColors;
		trunk_color: string;
		ground_color: string;
	}

	let { stage, accent, trunk_color, ground_color }: Props = $props();

	const attachment_points: AttachmentPoints = $derived(compute_attachment_points(stage));
</script>

<g data-stage={stage} data-attachment-points={JSON.stringify(attachment_points)}>
	<!-- Ground shadow -->
	<polygon points="25,120 75,120 70,115 30,115" fill={ground_color} />

	<!-- Trunk -->
	<rect x="47" y="55" width="6" height="55" fill={trunk_color} />

	{#if stage === 'sapling'}
		<!-- Sapling: small triangular canopy (3–4 facets) -->
		<!-- Front face -->
		<polygon points="50,25 30,55 50,50" fill={accent.front} />
		<!-- Right face -->
		<polygon points="50,25 70,55 50,50" fill={accent.shadow} />
		<!-- Highlight facet -->
		<polygon points="50,25 38,42 50,38" fill={accent.highlight} />
		<!-- Lower front -->
		<polygon points="30,55 50,50 35,58" fill={accent.front} />
	{:else}
		<!-- Growing: larger canopy (5–6 facets) + support stakes -->
		<!-- Main front face -->
		<polygon points="50,18 25,55 50,48" fill={accent.front} />
		<!-- Right face -->
		<polygon points="50,18 75,55 50,48" fill={accent.shadow} />
		<!-- Top highlight -->
		<polygon points="50,18 35,38 50,33" fill={accent.highlight} />
		<!-- Lower left face -->
		<polygon points="25,55 50,48 30,60" fill={accent.front} />
		<!-- Lower right face -->
		<polygon points="75,55 50,48 70,60" fill={accent.shadow} />
		<!-- Mid highlight -->
		<polygon points="50,33 40,48 50,45" fill={accent.highlight} />

		<!-- Support stakes -->
		<line
			x1="35"
			y1="108"
			x2="45"
			y2="70"
			stroke={trunk_color}
			stroke-width="2"
			data-support="left"
		/>
		<line
			x1="65"
			y1="108"
			x2="55"
			y2="70"
			stroke={trunk_color}
			stroke-width="2"
			data-support="right"
		/>
	{/if}
</g>
