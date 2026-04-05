<script lang="ts">
	import type { PottedPlantStage } from '$lib/types/tree_visualization';
	import type { AccentColors } from '../tree/types';
	import { compute_potted_plant_attachment_points } from './attachment_points';
	import PotBase from './PotBase.svelte';

	interface Props {
		stage: Extract<PottedPlantStage, 'small-plant' | 'flowering'>;
		accent: AccentColors;
		trunk_color: string;
		ground_color: string;
		is_dark: boolean;
	}

	let { stage, accent, trunk_color, ground_color, is_dark }: Props = $props();

	const attachment_points = $derived(compute_potted_plant_attachment_points(stage));
</script>

<g data-stage={stage} data-attachment-points={JSON.stringify(attachment_points)}>
	<PotBase {ground_color} {is_dark} />

	<!-- Stem -->
	<rect x="38" y="32" width="4" height="32" fill={trunk_color} />

	<!-- Small angular canopy — layered triangles -->
	<!-- Back layer (shadow) -->
	<polygon points="40,22 26,48 54,48" fill={accent.shadow} />
	<!-- Front layer -->
	<polygon points="40,26 30,48 50,48" fill={accent.front} />
	<!-- Highlight facet -->
	<polygon points="40,26 46,38 40,38" fill={accent.highlight} />

	{#if stage === 'small-plant'}
		<!-- Extra small side leaves -->
		<polygon points="30,42 22,36 28,44" fill={accent.front} />
		<polygon points="50,42 58,36 52,44" fill={accent.front} />
	{:else}
		<!-- Flowering: additional canopy volume -->
		<polygon points="40,18 22,46 58,46" fill={accent.shadow} opacity="0.5" />

		<!-- Angular flowers at crown (accent.highlight colored) -->
		<!-- Center flower -->
		<polygon points="40,18 37,24 43,24" fill={accent.highlight} />
		<circle cx="40" cy="21" r="2" fill={accent.highlight} />

		<!-- Left flower -->
		<polygon points="28,30 25,36 31,36" fill={accent.highlight} />
		<circle cx="28" cy="33" r="1.5" fill={accent.highlight} />

		<!-- Right flower -->
		<polygon points="52,30 49,36 55,36" fill={accent.highlight} />
		<circle cx="52" cy="33" r="1.5" fill={accent.highlight} />
	{/if}
</g>
