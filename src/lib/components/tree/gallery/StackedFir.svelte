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
</script>

<g data-variant="stacked-fir" data-attachment-points={JSON.stringify(attachment_points)}>
	<!-- Ground shadow -->
	<polygon points="18,120 82,120 76,114 24,114" fill={ground_color} />

	<!-- Trunk -->
	<rect x="45" y="48" width="10" height="62" fill={trunk_color} />
	<!-- Trunk bark lines -->
	<rect x="47" y="52" width="1" height="54" fill={ground_color} opacity="0.45" />
	<rect x="52" y="54" width="1" height="52" fill={ground_color} opacity="0.45" />

	<!-- Layer 1 (bottom, widest) y: 40-50 -->
	<polygon points="50,40 18,50 82,50" fill={accent.front} />
	<polygon points="50,40 82,50 68,47" fill={accent.shadow} />
	<polygon points="50,40 32,47 18,50" fill={accent.shadow} opacity="0.75" />
	<polygon points="50,40 40,45 50,44" fill={accent.highlight} />
	<polygon points="50,40 68,47 82,50" fill={accent.shadow} />
	<polygon points="50,50 62,48 72,50" fill={accent.highlight} opacity="0.35" />
	<polygon points="28,50 38,49 50,50" fill={accent.front} opacity="0.7" />

	<!-- Layer 2 y: 34-43 -->
	<polygon points="50,34 22,43 78,43" fill={accent.front} />
	<polygon points="50,34 78,43 66,40" fill={accent.shadow} />
	<polygon points="50,34 34,40 22,43" fill={accent.shadow} opacity="0.75" />
	<polygon points="50,34 42,38 50,37" fill={accent.highlight} />
	<polygon points="50,43 60,41 68,43" fill={accent.highlight} opacity="0.35" />
	<polygon points="32,43 40,42 50,43" fill={accent.front} opacity="0.7" />

	<!-- Layer 3 y: 28-37 -->
	<polygon points="50,28 26,37 74,37" fill={accent.front} />
	<polygon points="50,28 74,37 62,34" fill={accent.shadow} />
	<polygon points="50,28 36,34 26,37" fill={accent.shadow} opacity="0.75" />
	<polygon points="50,28 42,32 50,31" fill={accent.highlight} />
	<polygon points="50,37 58,35 64,37" fill={accent.highlight} opacity="0.35" />
	<polygon points="36,37 42,36 50,37" fill={accent.front} opacity="0.7" />

	<!-- Layer 4 y: 22-31 -->
	<polygon points="50,22 30,31 70,31" fill={accent.front} />
	<polygon points="50,22 70,31 60,28" fill={accent.shadow} />
	<polygon points="50,22 38,28 30,31" fill={accent.shadow} opacity="0.75" />
	<polygon points="50,22 43,26 50,25" fill={accent.highlight} />
	<polygon points="50,31 56,29 62,31" fill={accent.highlight} opacity="0.35" />
	<polygon points="38,31 44,30 50,31" fill={accent.front} opacity="0.7" />

	<!-- Layer 5 y: 16-25 -->
	<polygon points="50,16 34,25 66,25" fill={accent.front} />
	<polygon points="50,16 66,25 58,23" fill={accent.shadow} />
	<polygon points="50,16 42,23 34,25" fill={accent.shadow} opacity="0.75" />
	<polygon points="50,16 44,21 50,20" fill={accent.highlight} />
	<polygon points="50,25 55,24 60,25" fill={accent.highlight} opacity="0.35" />

	<!-- Layer 6 y: 10-19 -->
	<polygon points="50,10 38,19 62,19" fill={accent.front} />
	<polygon points="50,10 62,19 55,17" fill={accent.shadow} />
	<polygon points="50,10 45,17 38,19" fill={accent.shadow} opacity="0.75" />
	<polygon points="50,10 46,15 50,15" fill={accent.highlight} />
	<polygon points="50,19 54,18 58,19" fill={accent.highlight} opacity="0.35" />

	<!-- Layer 7 (peak) y: 4-13 -->
	<polygon points="50,4 42,13 58,13" fill={accent.front} />
	<polygon points="50,4 58,13 53,11" fill={accent.shadow} />
	<polygon points="50,4 47,11 42,13" fill={accent.shadow} opacity="0.75" />
	<polygon points="50,4 47,9 50,9" fill={accent.highlight} />
	<polygon points="50,13 53,12 56,13" fill={accent.highlight} opacity="0.35" />
</g>
