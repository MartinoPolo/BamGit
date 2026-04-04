<script lang="ts">
	import type { TreeStage } from '$lib/types/tree_visualization';
	import type { AccentColors, AttachmentPoints } from './types';
	import { compute_attachment_points } from './attachment_points';

	interface Props {
		stage: Extract<TreeStage, 'bare' | 'dead' | 'stump'>;
		accent: AccentColors;
		trunk_color: string;
		ground_color: string;
	}

	let { stage, accent, trunk_color, ground_color }: Props = $props();

	const attachment_points: AttachmentPoints = $derived(compute_attachment_points(stage));

	const muted_fill = $derived(stage === 'bare' ? accent.shadow : ground_color);
</script>

<g data-stage={stage} data-attachment-points={JSON.stringify(attachment_points)}>
	<!-- Ground shadow -->
	<polygon points="25,120 75,120 70,115 30,115" fill={ground_color} />

	{#if stage === 'stump'}
		<!-- Stump: short truncated trunk polygon -->
		<polygon points="40,100 60,100 62,118 38,118" fill={trunk_color} />
		<!-- Top face -->
		<polygon points="40,100 60,100 58,103 42,103" fill={muted_fill} />
		<!-- Ring detail -->
		<ellipse cx="50" cy="102" rx="6" ry="1.5" fill={ground_color} opacity="0.4" />
	{:else if stage === 'dead'}
		<!-- Dead: tilted/broken trunk + few fallen branches -->
		<!-- Main trunk (tilted) -->
		<polygon points="46,45 54,42 56,110 44,110" fill={trunk_color} />
		<!-- Break point -->
		<polygon points="46,45 54,42 58,50 48,52" fill={muted_fill} />

		<!-- Remaining branch stubs -->
		<line x1="48" y1="60" x2="32" y2="50" stroke={trunk_color} stroke-width="2.5" />
		<line x1="54" y1="70" x2="68" y2="62" stroke={trunk_color} stroke-width="2" />

		<!-- Fallen branch on ground -->
		<line x1="25" y1="116" x2="45" y2="114" stroke={trunk_color} stroke-width="2" />
		<line x1="60" y1="118" x2="78" y2="115" stroke={trunk_color} stroke-width="1.5" />
	{:else}
		<!-- Bare: trunk + angular bare branches radiating from top -->
		<!-- Trunk -->
		<rect x="46" y="50" width="8" height="60" fill={trunk_color} />

		<!-- Bare branches (line-like polygons, no canopy fill) -->
		<!-- Main left branch -->
		<line x1="47" y1="55" x2="22" y2="30" stroke={trunk_color} stroke-width="2.5" />
		<!-- Left sub-branch -->
		<line x1="32" y1="40" x2="20" y2="25" stroke={trunk_color} stroke-width="1.5" />
		<!-- Main right branch -->
		<line x1="53" y1="55" x2="78" y2="28" stroke={trunk_color} stroke-width="2.5" />
		<!-- Right sub-branch -->
		<line x1="68" y1="38" x2="80" y2="22" stroke={trunk_color} stroke-width="1.5" />
		<!-- Center top branch -->
		<line x1="50" y1="50" x2="50" y2="20" stroke={trunk_color} stroke-width="2" />
		<!-- Top sub-branches -->
		<line x1="50" y1="25" x2="40" y2="15" stroke={trunk_color} stroke-width="1.5" />
		<line x1="50" y1="28" x2="62" y2="18" stroke={trunk_color} stroke-width="1.5" />
	{/if}
</g>
