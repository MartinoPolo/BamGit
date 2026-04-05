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

<g data-variant="gnarled-ancient" data-attachment-points={JSON.stringify(attachment_points)}>
	<!-- Ground shadow (asymmetric, extending further right) -->
	<polygon points="14,120 84,120 78,115 22,115" fill={ground_color} />
	<polygon points="16,118 82,118 74,114 26,114" fill={ground_color} opacity="0.6" />

	<!-- Trunk: tapered wide-at-base, narrow-at-top, leans slightly right -->
	<polygon points="42,110 58,110 56,50 48,50" fill={trunk_color} />
	<!-- Trunk shadow side -->
	<polygon points="52,110 58,110 56,50 53,50" fill={ground_color} opacity="0.35" />
	<!-- Trunk highlight side -->
	<polygon points="42,110 45,110 47,55 48,50" fill={trunk_color} opacity="0.7" />

	<!-- Knot protrusions on trunk (asymmetric, 6 knots) -->
	<polygon points="42,92 39,94 40,98 43,97" fill={trunk_color} />
	<polygon points="58,82 62,83 62,87 58,86" fill={trunk_color} />
	<polygon points="42,72 38,73 39,77 43,76" fill={trunk_color} />
	<polygon points="57,65 61,66 61,69 57,68" fill={trunk_color} />
	<polygon points="43,58 40,59 41,62 44,61" fill={trunk_color} />
	<polygon points="57,100 60,101 60,104 57,103" fill={trunk_color} />
	<!-- Knot shadows -->
	<polygon points="40,94 40,98 43,97" fill={ground_color} opacity="0.4" />
	<polygon points="62,83 62,87 58,86" fill={ground_color} opacity="0.4" />
	<polygon points="38,73 39,77 43,76" fill={ground_color} opacity="0.4" />
	<polygon points="61,66 61,69 57,68" fill={ground_color} opacity="0.4" />

	<!-- Branch stubs extending into canopy -->
	<polygon points="48,52 30,44 28,46 47,54" fill={trunk_color} />
	<polygon points="56,50 74,40 76,42 57,52" fill={trunk_color} />
	<polygon points="50,48 46,30 48,30 52,48" fill={trunk_color} />
	<polygon points="54,52 68,52 68,54 54,54" fill={trunk_color} />
	<polygon points="48,55 34,58 34,60 48,57" fill={trunk_color} />
	<polygon points="56,46 64,35 66,36 58,46" fill={trunk_color} />

	<!-- Dark interior core polygons (visible through canopy gaps) -->
	<polygon points="40,40 34,36 32,42 38,44" fill={accent.shadow} />
	<polygon points="60,32 68,28 70,36 62,38" fill={accent.shadow} />
	<polygon points="48,28 44,22 50,20 52,26" fill={accent.shadow} />
	<polygon points="72,44 78,40 80,46 74,48" fill={accent.shadow} />
	<polygon points="28,44 22,42 22,48 30,48" fill={accent.shadow} />
	<polygon points="54,40 48,38 50,44 56,44" fill={accent.shadow} />
	<polygon points="40,30 36,26 42,24 44,30" fill={accent.shadow} />

	<!-- Canopy: asymmetric wide crown (~60 wide, 35 tall), off-center weight -->

	<!-- Cluster 1: Left-upper mass -->
	<polygon points="28,38 18,44 22,50 32,48 30,40" fill={accent.front} />
	<polygon points="32,48 22,50 26,54 34,52" fill={accent.shadow} />
	<polygon points="28,38 22,42 26,45 30,42" fill={accent.highlight} />
	<polygon points="18,44 14,48 18,52 22,50" fill={accent.front} />
	<polygon points="22,50 18,52 20,55 24,54" fill={accent.shadow} />

	<!-- Cluster 2: Right-dominant mass (widest point) -->
	<polygon points="64,26 78,30 82,40 76,48 66,44" fill={accent.front} />
	<polygon points="76,48 82,40 86,44 80,52" fill={accent.shadow} />
	<polygon points="64,26 72,28 70,34 66,32" fill={accent.highlight} />
	<polygon points="78,30 84,34 82,40" fill={accent.front} />
	<polygon points="82,40 86,44 88,48 84,50" fill={accent.shadow} />
	<polygon points="66,44 76,48 72,54 64,52" fill={accent.front} />
	<polygon points="72,54 64,52 66,58 74,56" fill={accent.shadow} />

	<!-- Cluster 3: Top-center mass (slightly left of center) -->
	<polygon points="44,14 56,16 58,26 46,28 40,22" fill={accent.front} />
	<polygon points="56,16 58,26 54,24 56,18" fill={accent.shadow} />
	<polygon points="44,14 52,18 48,22 44,20" fill={accent.highlight} />
	<polygon points="40,22 46,28 42,32 36,30" fill={accent.front} />
	<polygon points="42,32 36,30 38,34 44,34" fill={accent.shadow} />

	<!-- Cluster 4: Lower-right twisted branch mass -->
	<polygon points="58,48 68,50 72,56 64,60 56,56" fill={accent.front} />
	<polygon points="68,50 72,56 74,58 70,52" fill={accent.shadow} />
	<polygon points="58,48 64,52 60,54 56,52" fill={accent.highlight} />
	<polygon points="64,60 56,56 58,62 66,62" fill={accent.shadow} />

	<!-- Connecting foliage between clusters -->
	<polygon points="34,34 44,30 46,38 36,40" fill={accent.front} />
	<polygon points="44,30 46,38 42,36" fill={accent.shadow} />
	<polygon points="56,30 64,26 66,36 58,38" fill={accent.front} />
	<polygon points="64,26 66,36 62,34" fill={accent.shadow} />
	<polygon points="46,42 56,42 54,48 48,48" fill={accent.front} />
	<polygon points="54,48 48,48 50,46 52,46" fill={accent.highlight} />

	<!-- Small twisted outcrops -->
	<polygon points="30,30 36,28 36,34 32,34" fill={accent.front} />
	<polygon points="36,28 36,34 34,32" fill={accent.shadow} />
	<polygon points="70,22 76,24 74,30 68,28" fill={accent.front} />
	<polygon points="76,24 74,30 72,26" fill={accent.shadow} />
	<polygon points="50,10 56,12 54,16 48,14" fill={accent.front} />
	<polygon points="56,12 54,16 52,14" fill={accent.highlight} />

	<!-- Additional dark core peek-throughs at edges -->
	<polygon points="36,46 32,50 36,52 38,48" fill={accent.shadow} />
	<polygon points="70,38 74,36 74,42 70,42" fill={accent.shadow} />
	<polygon points="50,36 54,34 54,38 50,38" fill={accent.shadow} />
</g>
