<script lang="ts">
	import type { AccentColors } from '../tree/types';
	import { compute_potted_plant_attachment_points } from './attachment_points';
	import PotBase from './PotBase.svelte';

	interface Props {
		accent: AccentColors;
		trunk_color: string;
		ground_color: string;
		is_dark: boolean;
	}

	let { accent, trunk_color, ground_color, is_dark }: Props = $props();

	const attachment_points = $derived(compute_potted_plant_attachment_points('dried'));
</script>

<g data-stage="dried" data-attachment-points={JSON.stringify(attachment_points)}>
	<PotBase {ground_color} {is_dark} />

	<!-- Cracked dry soil surface -->
	<polygon points="20,62 60,62 58,66 22,66" fill={ground_color} />
	<!-- Soil crack lines -->
	<line x1="30" y1="62" x2="34" y2="66" stroke={trunk_color} stroke-width="0.5" opacity="0.5" />
	<line x1="46" y1="62" x2="50" y2="66" stroke={trunk_color} stroke-width="0.5" opacity="0.5" />

	<!-- Dead stem (tilted, broken) -->
	<polygon points="38,40 42,38 43,64 39,64" fill={trunk_color} />
	<!-- Break point -->
	<polygon points="38,40 42,38 44,42 40,44" fill={ground_color} />

	<!-- Remaining branch stubs -->
	<line x1="39" y1="48" x2="30" y2="42" stroke={trunk_color} stroke-width="1.5" />
	<line x1="42" y1="52" x2="50" y2="46" stroke={trunk_color} stroke-width="1.2" />

	<!-- Single dried leaf on ground near pot -->
	<polygon points="52,92 58,88 56,93" fill={accent.shadow} opacity="0.4" />
</g>
