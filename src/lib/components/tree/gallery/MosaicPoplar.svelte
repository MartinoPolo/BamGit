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

<g data-variant="mosaic-poplar" data-attachment-points={JSON.stringify(attachment_points)}>
	<!-- Ground shadow -->
	<polygon points="22,120 78,120 72,114 28,114" fill={ground_color} />

	<!-- Trunk (slim segmented) -->
	<rect x="46" y="50" width="8" height="60" fill={trunk_color} />
	<rect x="46" y="58" width="8" height="1" fill={ground_color} opacity="0.55" />
	<rect x="46" y="70" width="8" height="1" fill={ground_color} opacity="0.55" />
	<rect x="46" y="82" width="8" height="1" fill={ground_color} opacity="0.55" />
	<rect x="46" y="94" width="8" height="1" fill={ground_color} opacity="0.55" />

	<!-- Canopy: columnar tessellated tall poplar (crown zone y 5-50) -->
	<!-- Row 1: peak (y 5-14) -->
	<polygon points="50,5 46,14 54,14" fill={accent.front} />
	<polygon points="50,5 54,14 52,9" fill={accent.highlight} />
	<polygon points="50,5 46,14 48,9" fill={accent.shadow} />

	<!-- Row 2: y 14-20 -->
	<polygon points="46,14 50,14 48,20" fill={accent.front} />
	<polygon points="50,14 54,14 52,20" fill={accent.highlight} />
	<polygon points="46,14 48,20 44,20" fill={accent.shadow} />
	<polygon points="54,14 56,20 52,20" fill={accent.front} />
	<polygon points="50,14 52,20 48,20" fill={accent.shadow} />

	<!-- Row 3: y 20-26 -->
	<polygon points="44,20 48,20 46,26" fill={accent.front} />
	<polygon points="48,20 52,20 50,26" fill={accent.highlight} />
	<polygon points="52,20 56,20 54,26" fill={accent.front} />
	<polygon points="44,20 46,26 42,26" fill={accent.shadow} />
	<polygon points="56,20 58,26 54,26" fill={accent.front} />
	<polygon points="48,20 50,26 46,26" fill={accent.shadow} />
	<polygon points="52,20 54,26 50,26" fill={accent.shadow} />

	<!-- Row 4: y 26-32 -->
	<polygon points="42,26 46,26 44,32" fill={accent.front} />
	<polygon points="46,26 50,26 48,32" fill={accent.highlight} />
	<polygon points="50,26 54,26 52,32" fill={accent.front} />
	<polygon points="54,26 58,26 56,32" fill={accent.highlight} />
	<polygon points="42,26 44,32 40,32" fill={accent.shadow} />
	<polygon points="58,26 60,32 56,32" fill={accent.front} />
	<polygon points="46,26 48,32 44,32" fill={accent.shadow} />
	<polygon points="50,26 52,32 48,32" fill={accent.shadow} />
	<polygon points="54,26 56,32 52,32" fill={accent.shadow} />

	<!-- Row 5: y 32-38 (widest middle) -->
	<polygon points="40,32 44,32 42,38" fill={accent.front} />
	<polygon points="44,32 48,32 46,38" fill={accent.front} />
	<polygon points="48,32 52,32 50,38" fill={accent.highlight} />
	<polygon points="52,32 56,32 54,38" fill={accent.front} />
	<polygon points="56,32 60,32 58,38" fill={accent.highlight} />
	<polygon points="40,32 42,38 38,38" fill={accent.shadow} />
	<polygon points="60,32 62,38 58,38" fill={accent.front} />
	<polygon points="44,32 46,38 42,38" fill={accent.shadow} />
	<polygon points="48,32 50,38 46,38" fill={accent.shadow} />
	<polygon points="52,32 54,38 50,38" fill={accent.shadow} />
	<polygon points="56,32 58,38 54,38" fill={accent.shadow} />

	<!-- Row 6: y 38-44 -->
	<polygon points="38,38 42,38 40,44" fill={accent.front} />
	<polygon points="42,38 46,38 44,44" fill={accent.highlight} />
	<polygon points="46,38 50,38 48,44" fill={accent.front} />
	<polygon points="50,38 54,38 52,44" fill={accent.highlight} />
	<polygon points="54,38 58,38 56,44" fill={accent.front} />
	<polygon points="58,38 62,38 60,44" fill={accent.front} />
	<polygon points="38,38 40,44 36,44" fill={accent.shadow} />
	<polygon points="62,38 64,44 60,44" fill={accent.shadow} />
	<polygon points="42,38 44,44 40,44" fill={accent.shadow} />
	<polygon points="46,38 48,44 44,44" fill={accent.shadow} />
	<polygon points="50,38 52,44 48,44" fill={accent.shadow} />
	<polygon points="54,38 56,44 52,44" fill={accent.shadow} />
	<polygon points="58,38 60,44 56,44" fill={accent.shadow} />

	<!-- Row 7: y 44-50 (base) -->
	<polygon points="36,44 40,44 38,50" fill={accent.front} />
	<polygon points="40,44 44,44 42,50" fill={accent.front} />
	<polygon points="44,44 48,44 46,50" fill={accent.front} />
	<polygon points="48,44 52,44 50,50" fill={accent.highlight} />
	<polygon points="52,44 56,44 54,50" fill={accent.front} />
	<polygon points="56,44 60,44 58,50" fill={accent.front} />
	<polygon points="60,44 64,44 62,50" fill={accent.front} />
	<polygon points="40,44 42,50 38,50" fill={accent.shadow} />
	<polygon points="44,44 46,50 42,50" fill={accent.shadow} />
	<polygon points="48,44 50,50 46,50" fill={accent.shadow} />
	<polygon points="52,44 54,50 50,50" fill={accent.shadow} />
	<polygon points="56,44 58,50 54,50" fill={accent.shadow} />
	<polygon points="60,44 62,50 58,50" fill={accent.shadow} />
</g>
