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

<g data-variant="cluster-birch" data-attachment-points={JSON.stringify(attachment_points)}>
	<!-- Ground shadow -->
	<polygon points="18,120 82,120 76,114 24,114" fill={ground_color} />

	<!-- Trunk 1 (left, x=38) -->
	<rect x="36" y="54" width="4" height="56" fill={trunk_color} />
	<rect x="36" y="58" width="4" height="1.2" fill={ground_color} opacity="0.85" />
	<rect x="36" y="68" width="4" height="1" fill={ground_color} opacity="0.85" />
	<rect x="36" y="80" width="4" height="1.3" fill={ground_color} opacity="0.85" />
	<rect x="36" y="92" width="4" height="1" fill={ground_color} opacity="0.85" />
	<rect x="36" y="102" width="4" height="1.2" fill={ground_color} opacity="0.85" />

	<!-- Trunk 2 (center, x=50) -->
	<rect x="48" y="50" width="4.5" height="60" fill={trunk_color} />
	<rect x="48" y="55" width="4.5" height="1.3" fill={ground_color} opacity="0.85" />
	<rect x="48" y="64" width="4.5" height="1" fill={ground_color} opacity="0.85" />
	<rect x="48" y="74" width="4.5" height="1.2" fill={ground_color} opacity="0.85" />
	<rect x="48" y="86" width="4.5" height="1" fill={ground_color} opacity="0.85" />
	<rect x="48" y="97" width="4.5" height="1.3" fill={ground_color} opacity="0.85" />

	<!-- Trunk 3 (right, x=62) -->
	<rect x="60" y="56" width="4" height="54" fill={trunk_color} />
	<rect x="60" y="60" width="4" height="1.2" fill={ground_color} opacity="0.85" />
	<rect x="60" y="70" width="4" height="1" fill={ground_color} opacity="0.85" />
	<rect x="60" y="82" width="4" height="1.3" fill={ground_color} opacity="0.85" />
	<rect x="60" y="95" width="4" height="1" fill={ground_color} opacity="0.85" />

	<!-- Airy scattered canopy: leaf clusters (diamonds/rhombus) -->

	<!-- Cluster 1: top-left high -->
	<polygon points="28,18 32,22 28,26 24,22" fill={accent.front} />
	<polygon points="28,18 32,22 28,22" fill={accent.shadow} />

	<!-- Cluster 2: top-center -->
	<polygon points="50,10 54,14 50,18 46,14" fill={accent.front} />
	<polygon points="50,10 54,14 50,14" fill={accent.shadow} />
	<polygon points="50,10 52,12 50,13 48,12" fill={accent.highlight} />

	<!-- Cluster 3: top-right high -->
	<polygon points="70,14 74,18 70,22 66,18" fill={accent.front} />
	<polygon points="70,14 74,18 70,18" fill={accent.shadow} />

	<!-- Cluster 4: upper-left -->
	<polygon points="22,28 26,32 22,36 18,32" fill={accent.front} />
	<polygon points="22,28 26,32 22,32" fill={accent.shadow} />

	<!-- Cluster 5: upper-mid-left -->
	<polygon points="38,22 42,26 38,30 34,26" fill={accent.front} />
	<polygon points="38,22 42,26 38,26" fill={accent.shadow} />

	<!-- Cluster 6: upper-mid-right -->
	<polygon points="60,24 64,28 60,32 56,28" fill={accent.front} />
	<polygon points="60,24 64,28 60,28" fill={accent.shadow} />
	<polygon points="60,24 62,26 60,27 58,26" fill={accent.highlight} />

	<!-- Cluster 7: upper-right -->
	<polygon points="78,26 82,30 78,34 74,30" fill={accent.front} />
	<polygon points="78,26 82,30 78,30" fill={accent.shadow} />

	<!-- Cluster 8: mid-left -->
	<polygon points="15,38 19,42 15,46 11,42" fill={accent.front} />
	<polygon points="15,38 19,42 15,42" fill={accent.shadow} />

	<!-- Cluster 9: center-mid -->
	<polygon points="48,32 52,36 48,40 44,36" fill={accent.front} />
	<polygon points="48,32 52,36 48,36" fill={accent.shadow} />

	<!-- Cluster 10: mid-right -->
	<polygon points="84,40 88,44 84,48 80,44" fill={accent.front} />
	<polygon points="84,40 88,44 84,44" fill={accent.shadow} />

	<!-- Cluster 11: mid-center-left -->
	<polygon points="30,42 34,46 30,50 26,46" fill={accent.front} />
	<polygon points="30,42 34,46 30,46" fill={accent.shadow} />
	<polygon points="30,42 32,44 30,45 28,44" fill={accent.highlight} />

	<!-- Cluster 12: mid-center-right -->
	<polygon points="70,38 74,42 70,46 66,42" fill={accent.front} />
	<polygon points="70,38 74,42 70,42" fill={accent.shadow} />

	<!-- Cluster 13: lower-left -->
	<polygon points="20,48 24,52 20,56 16,52" fill={accent.front} />
	<polygon points="20,48 24,52 20,52" fill={accent.shadow} />

	<!-- Cluster 14: lower-mid -->
	<polygon points="42,44 46,48 42,52 38,48" fill={accent.front} />
	<polygon points="42,44 46,48 42,48" fill={accent.shadow} />

	<!-- Cluster 15: lower-right -->
	<polygon points="76,48 80,52 76,56 72,52" fill={accent.front} />
	<polygon points="76,48 80,52 76,52" fill={accent.shadow} />
	<polygon points="76,48 78,50 76,51 74,50" fill={accent.highlight} />

	<!-- Cluster 16: center-low -->
	<polygon points="56,46 60,50 56,54 52,50" fill={accent.front} />
	<polygon points="56,46 60,50 56,50" fill={accent.shadow} />
</g>
