<script lang="ts">
	import { compute_stone_colors } from './color_utils';

	interface Props {
		title: string;
		is_dark: boolean;
	}

	const TRUNCATE_THRESHOLD = 16;

	let { title, is_dark }: Props = $props();

	const stone = $derived(compute_stone_colors(is_dark));
	const display_title = $derived(
		title.length > TRUNCATE_THRESHOLD ? title.slice(0, TRUNCATE_THRESHOLD - 1) + '…' : title,
	);
</script>

<g data-nameplate>
	<!-- Stone body (angular geometric shape) -->
	<polygon points="25,118 75,118 78,122 78,132 75,136 25,136 22,132 22,122" fill={stone.fill} />
	<!-- Shadow facet (bottom-right depth) -->
	<polygon points="75,118 78,122 78,132 75,136" fill={stone.shadow} />
	<polygon points="25,136 75,136 78,132 22,132" fill={stone.shadow} />
	<!-- Highlight facet (top-left bevel) -->
	<polygon points="25,118 75,118 78,122 22,122" fill={stone.highlight} />
	<polygon points="25,118 22,122 22,132 25,136" fill={stone.highlight} />

	<!-- Title text -->
	{#if title.length > 0}
		<text
			x="50"
			y="129"
			text-anchor="middle"
			font-size="8"
			font-family="Georgia, serif"
			fill={stone.text}
			textLength={display_title.length > 10 ? 50 : undefined}
			lengthAdjust={display_title.length > 10 ? 'spacingAndGlyphs' : undefined}
			data-nameplate-title
		>
			{display_title}
		</text>
	{/if}
</g>
