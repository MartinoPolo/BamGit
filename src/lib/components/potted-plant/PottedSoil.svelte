<script lang="ts">
	import type { PottedPlantStage } from '$lib/types/tree_visualization';
	import type { AccentColors } from '../tree/types';
	import { compute_potted_plant_attachment_points } from './attachment_points';
	import PotBase from './PotBase.svelte';

	interface Props {
		stage: Extract<PottedPlantStage, 'pot-with-soil' | 'sprout'>;
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

	<!-- Soil surface inside pot -->
	<polygon points="20,62 60,62 58,66 22,66" fill={ground_color} />

	{#if stage === 'sprout'}
		<!-- Thin stem rising from soil -->
		<rect x="38" y="48" width="4" height="16" fill={trunk_color} />

		<!-- Left cotyledon leaf (angular) -->
		<polygon points="38,52 28,44 32,50" fill={accent.front} />
		<polygon points="38,52 28,44 30,47" fill={accent.highlight} />

		<!-- Right cotyledon leaf (angular) -->
		<polygon points="42,50 52,42 48,48" fill={accent.front} />
		<polygon points="42,50 52,42 50,45" fill={accent.shadow} />
	{/if}
</g>
