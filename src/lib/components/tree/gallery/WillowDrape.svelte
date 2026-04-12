<script lang="ts">
	import type { AccentColors, AttachmentPoints } from '../types';

	interface Props {
		accent: AccentColors;
		trunk_color: string;
		ground_color: string;
	}

	let { accent, trunk_color, ground_color }: Props = $props();

	const attachment_points: AttachmentPoints = {
		crown: { x: 50, y: 18 },
		trunkBase: { x: 50, y: 105 },
		roots: { x: 50, y: 118 },
	};

	// Hanging strands: top_x, bottom_y (longest in center, shorter at edges)
	// Strands originate from crown cap y~22, hang down to varying depths
	const strands: ReadonlyArray<{
		top_x: number;
		top_width: number;
		mid_width: number;
		bottom_y: number;
		sway: number;
	}> = [
		{ top_x: 30, top_width: 1.2, mid_width: 2.0, bottom_y: 52, sway: -1.5 },
		{ top_x: 33, top_width: 1.2, mid_width: 2.2, bottom_y: 58, sway: -1.2 },
		{ top_x: 36, top_width: 1.3, mid_width: 2.3, bottom_y: 64, sway: -0.8 },
		{ top_x: 39, top_width: 1.4, mid_width: 2.4, bottom_y: 70, sway: -0.5 },
		{ top_x: 42, top_width: 1.4, mid_width: 2.5, bottom_y: 74, sway: -0.3 },
		{ top_x: 44, top_width: 1.5, mid_width: 2.6, bottom_y: 76, sway: 0 },
		{ top_x: 46, top_width: 1.5, mid_width: 2.7, bottom_y: 78, sway: 0.2 },
		{ top_x: 48, top_width: 1.5, mid_width: 2.7, bottom_y: 80, sway: 0 },
		{ top_x: 50, top_width: 1.5, mid_width: 2.8, bottom_y: 82, sway: 0.3 },
		{ top_x: 52, top_width: 1.5, mid_width: 2.7, bottom_y: 80, sway: 0.5 },
		{ top_x: 54, top_width: 1.5, mid_width: 2.7, bottom_y: 78, sway: 0.7 },
		{ top_x: 56, top_width: 1.5, mid_width: 2.6, bottom_y: 76, sway: 0.4 },
		{ top_x: 58, top_width: 1.4, mid_width: 2.5, bottom_y: 74, sway: 0.8 },
		{ top_x: 61, top_width: 1.4, mid_width: 2.4, bottom_y: 70, sway: 1.0 },
		{ top_x: 64, top_width: 1.3, mid_width: 2.3, bottom_y: 64, sway: 1.2 },
		{ top_x: 67, top_width: 1.2, mid_width: 2.2, bottom_y: 58, sway: 1.5 },
		{ top_x: 70, top_width: 1.2, mid_width: 2.0, bottom_y: 52, sway: 1.8 },
	];

	const strand_top_y = 22;
</script>

<g data-variant="willow-drape" data-attachment-points={JSON.stringify(attachment_points)}>
	<defs>
		<linearGradient id="willow-strand-grad" x1="0" y1="0" x2="0" y2="1">
			<stop offset="0%" stop-color={accent.highlight} />
			<stop offset="55%" stop-color={accent.front} />
			<stop offset="100%" stop-color={accent.shadow} />
		</linearGradient>
		<linearGradient id="willow-trunk-grad" x1="0" y1="0" x2="1" y2="0">
			<stop offset="0%" stop-color={trunk_color} stop-opacity="0.85" />
			<stop offset="100%" stop-color={trunk_color} />
		</linearGradient>
	</defs>

	<!-- Ground shadow -->
	<polygon points="22,122 78,122 72,116 28,116" fill={ground_color} />
	<polygon points="28,116 72,116 68,114 32,114" fill={ground_color} opacity="0.6" />

	<!-- Thin curved trunk (4 angled polygon segments, narrow ~width 6) -->
	<!-- Segment 1: base, leans slightly right -->
	<polygon points="47,115 53,115 54,98 48,98" fill={trunk_color} />
	<!-- Segment 2: mid-lower, curving left -->
	<polygon points="48,98 54,98 55,82 49,82" fill="url(#willow-trunk-grad)" />
	<!-- Segment 3: mid-upper, curving back right -->
	<polygon points="49,82 55,82 54,62 48,62" fill={trunk_color} />
	<!-- Segment 4: top, narrowing into crown -->
	<polygon points="48,62 54,62 52,42 49,42" fill="url(#willow-trunk-grad)" />

	<!-- Trunk shading accents -->
	<polygon points="48,98 50,98 51,82 49,82" fill={ground_color} opacity="0.2" />
	<polygon points="49,62 51,62 50,42 49,42" fill={ground_color} opacity="0.2" />

	<!-- Crown cap at top (4 polygons from which strands hang) -->
	<polygon points="50,10 38,22 62,22" fill={accent.shadow} />
	<polygon points="50,12 40,22 60,22" fill={accent.front} />
	<polygon points="50,14 44,22 56,22" fill={accent.highlight} />
	<polygon points="50,16 46,22 54,22" fill={accent.front} />
	<polygon points="42,20 58,20 56,23 44,23" fill={accent.shadow} />

	<!-- Hanging strands: each = elongated tapered polygon (thin top, wider mid, pointed bottom) -->
	{#each strands as strand, index (index)}
		{@const top_left_x = strand.top_x - strand.top_width}
		{@const top_right_x = strand.top_x + strand.top_width}
		{@const mid_y = (strand_top_y + strand.bottom_y) / 2}
		{@const mid_left_x = strand.top_x - strand.mid_width + strand.sway * 0.3}
		{@const mid_right_x = strand.top_x + strand.mid_width + strand.sway * 0.3}
		{@const bottom_x = strand.top_x + strand.sway}
		<polygon
			points="{top_left_x},{strand_top_y} {top_right_x},{strand_top_y} {mid_right_x},{mid_y} {bottom_x},{strand.bottom_y} {mid_left_x},{mid_y}"
			fill="url(#willow-strand-grad)"
		/>
	{/each}

	<!-- Shadow-side strand overlays (depth) every 3rd strand -->
	{#each strands as strand, index (index)}
		{#if index % 3 === 0}
			{@const mid_y = (strand_top_y + strand.bottom_y) / 2}
			{@const bottom_x = strand.top_x + strand.sway}
			<polygon
				points="{strand.top_x},{strand_top_y} {strand.top_x +
					strand.mid_width * 0.6 +
					strand.sway * 0.3},{mid_y} {bottom_x},{strand.bottom_y}"
				fill={accent.shadow}
				opacity="0.5"
			/>
		{/if}
	{/each}

	<!-- Highlight tips on front-center strands -->
	{#each strands as strand, index (index)}
		{#if index >= 6 && index <= 10}
			<polygon
				points="{strand.top_x - strand.top_width},{strand_top_y} {strand.top_x +
					strand.top_width},{strand_top_y} {strand.top_x},{strand_top_y + 8}"
				fill={accent.highlight}
				opacity="0.7"
			/>
		{/if}
	{/each}
</g>
