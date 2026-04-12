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

<g data-variant="bonsai-twist" data-attachment-points={JSON.stringify(attachment_points)}>
	<!-- Ground shadow (compact, bonsai pot-style oval footprint) -->
	<polygon points="28,118 72,118 68,113 32,113" fill={ground_color} />
	<polygon points="30,120 70,120 72,118 28,118" fill={ground_color} opacity="0.6" />

	<!-- ── S-curve trunk: 5 angular tapered segments, base(50,105) → top(58,50) ── -->
	<!-- Segment 1: base curves right -->
	<polygon points="46,105 54,105 56,92 44,92" fill={trunk_color} />
	<polygon points="54,105 56,92 55,92 53,105" fill={ground_color} opacity="0.35" />

	<!-- Segment 2: curves back left (belly of S) -->
	<polygon points="44,92 56,92 50,78 38,80" fill={trunk_color} />
	<polygon points="56,92 50,78 49,78 55,92" fill={ground_color} opacity="0.35" />

	<!-- Segment 3: curves right across middle -->
	<polygon points="38,80 50,78 58,66 46,64" fill={trunk_color} />
	<polygon points="50,78 58,66 57,66 49,78" fill={ground_color} opacity="0.35" />

	<!-- Segment 4: curves left upper -->
	<polygon points="46,64 58,66 54,54 42,54" fill={trunk_color} />
	<polygon points="58,66 54,54 53,54 57,66" fill={ground_color} opacity="0.35" />

	<!-- Segment 5: top taper pushing right (windswept cap) -->
	<polygon points="42,54 54,54 60,48 48,46" fill={trunk_color} />
	<polygon points="54,54 60,48 59,48 53,54" fill={ground_color} opacity="0.35" />

	<!-- ── Branch connectors (windswept right, reaching to canopy pads) ── -->
	<!-- Branch A: lower-right pad (horizontal sweep right) -->
	<polygon points="56,88 72,84 74,86 57,90" fill={trunk_color} />
	<polygon points="72,84 78,82 79,84 74,86" fill={trunk_color} />

	<!-- Branch B: mid pad upper-right -->
	<polygon points="56,68 70,60 72,62 57,70" fill={trunk_color} />
	<polygon points="70,60 80,54 81,56 72,62" fill={trunk_color} />

	<!-- Branch C: left-facing small pad (lone back-branch) -->
	<polygon points="44,74 32,70 31,72 44,76" fill={trunk_color} />
	<polygon points="32,70 24,68 23,70 31,72" fill={trunk_color} />

	<!-- Branch D: upper-right pad (near top of trunk) -->
	<polygon points="58,52 72,44 74,46 59,54" fill={trunk_color} />
	<polygon points="72,44 82,38 83,40 74,46" fill={trunk_color} />

	<!-- Branch E: crown pad (top) -->
	<polygon points="56,48 62,36 64,36 58,50" fill={trunk_color} />

	<!-- ── Canopy pads: 5 asymmetric clusters pushed right (windswept) ── -->

	<!-- Pad 1: lower-right (largest) -->
	<polygon points="78,84 88,82 92,86 90,90 82,92 76,88" fill={accent.front} />
	<polygon points="88,82 92,86 90,90 86,88" fill={accent.shadow} />
	<polygon points="78,84 88,82 86,85 80,86" fill={accent.highlight} />
	<polygon points="76,88 82,92 80,90 77,89" fill={accent.shadow} />
	<polygon points="78,84 76,88 77,89 79,86" fill={accent.front} />

	<!-- Pad 2: mid-right -->
	<polygon points="80,54 90,52 94,56 92,60 84,62 78,58" fill={accent.front} />
	<polygon points="90,52 94,56 92,60 88,58" fill={accent.shadow} />
	<polygon points="80,54 90,52 88,55 82,56" fill={accent.highlight} />
	<polygon points="78,58 84,62 82,60 79,59" fill={accent.shadow} />
	<polygon points="80,54 78,58 79,59 81,56" fill={accent.front} />

	<!-- Pad 3: small back-left pad (lone counter-balance) -->
	<polygon points="23,68 30,66 33,70 31,73 25,74 20,71" fill={accent.front} />
	<polygon points="30,66 33,70 31,73 29,71" fill={accent.shadow} />
	<polygon points="23,68 30,66 28,69 24,70" fill={accent.highlight} />
	<polygon points="20,71 25,74 23,72 21,72" fill={accent.shadow} />

	<!-- Pad 4: upper-right cluster -->
	<polygon points="82,38 92,36 96,40 94,44 86,46 80,42" fill={accent.front} />
	<polygon points="92,36 96,40 94,44 90,42" fill={accent.shadow} />
	<polygon points="82,38 92,36 90,39 84,40" fill={accent.highlight} />
	<polygon points="80,42 86,46 84,44 81,43" fill={accent.shadow} />
	<polygon points="82,38 80,42 81,43 83,40" fill={accent.front} />

	<!-- Pad 5: crown top pad -->
	<polygon points="62,32 70,30 74,34 72,38 66,40 60,36" fill={accent.front} />
	<polygon points="70,30 74,34 72,38 68,36" fill={accent.shadow} />
	<polygon points="62,32 70,30 68,33 64,34" fill={accent.highlight} />
	<polygon points="60,36 66,40 64,38 61,37" fill={accent.shadow} />
	<polygon points="62,32 60,36 61,37 63,34" fill={accent.front} />
</g>
