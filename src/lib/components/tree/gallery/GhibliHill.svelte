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

<g data-variant="ghibli-hill" data-attachment-points={JSON.stringify(attachment_points)}>
	<!-- Ground shadow -->
	<polygon points="18,120 82,120 76,114 24,114" fill={ground_color} />

	<!-- Stubby short trunk (width 12, height 25) -->
	<rect x="44" y="80" width="12" height="25" fill={trunk_color} />
	<rect x="46" y="84" width="2" height="20" fill={ground_color} opacity="0.35" />

	<!-- ============================================================ -->
	<!-- Canopy: 6 cloud-puffs, each subdivided into ~9-10 facets      -->
	<!-- Layered mound: 3 bottom, 2 middle, 1 top                      -->
	<!-- Per puff: 4-5 front facets, 2-3 shadow facets, 2 highlights   -->
	<!-- ============================================================ -->

	<!-- ─── Puff 1: bottom-left ──────────────────────────────────── -->
	<!-- Shadow facets (right/bottom arc) -->
	<polygon points="25,50 32,50 38,56 30,58" fill={accent.shadow} />
	<polygon points="30,58 38,56 38,64 34,66" fill={accent.shadow} />
	<polygon points="34,66 38,64 36,70 30,76 25,72" fill={accent.shadow} />
	<!-- Front facets (core) -->
	<polygon points="22,50 25,50 30,58 25,60 20,58" fill={accent.front} />
	<polygon points="20,58 25,60 25,72 22,72 18,68" fill={accent.front} />
	<polygon points="18,68 22,72 25,72 22,76 18,72 14,66" fill={accent.front} />
	<polygon points="13,60 16,54 22,50 20,58 18,62 14,64" fill={accent.front} />
	<polygon points="25,60 30,58 34,66 30,70 25,72" fill={accent.front} />
	<!-- Highlight facets (top-left arc) -->
	<polygon points="16,54 22,50 22,54 18,56" fill={accent.highlight} />
	<polygon points="22,50 28,48 26,52 22,54" fill={accent.highlight} />

	<!-- ─── Puff 2: bottom-center ────────────────────────────────── -->
	<!-- Shadow facets (right/bottom arc) -->
	<polygon points="48,46 58,46 56,52 50,52" fill={accent.shadow} />
	<polygon points="56,52 64,52 62,58 56,60" fill={accent.shadow} />
	<polygon points="56,60 62,58 66,60 64,70 58,70" fill={accent.shadow} />
	<polygon points="58,70 64,70 56,78 46,80 44,72" fill={accent.shadow} />
	<!-- Front facets (core) -->
	<polygon points="40,46 48,46 50,52 44,54 38,50" fill={accent.front} />
	<polygon points="38,50 44,54 44,62 36,60 32,52" fill={accent.front} />
	<polygon points="36,60 44,62 44,72 38,74 32,68 28,60" fill={accent.front} />
	<polygon points="32,68 38,74 46,80 38,78 32,74 28,68" fill={accent.front} />
	<polygon points="44,54 50,52 56,52 56,60 50,62 44,62" fill={accent.front} />
	<polygon points="44,62 50,62 56,60 58,70 50,72 44,72" fill={accent.front} />
	<!-- Highlight facets (top-left arc) -->
	<polygon points="32,52 40,46 38,50 34,54" fill={accent.highlight} />
	<polygon points="40,46 48,46 44,50 38,52" fill={accent.highlight} />

	<!-- ─── Puff 3: bottom-right ─────────────────────────────────── -->
	<!-- Shadow facets (right/bottom arc) -->
	<polygon points="76,46 82,50 78,54 72,54" fill={accent.shadow} />
	<polygon points="78,54 86,56 85,62 78,62" fill={accent.shadow} />
	<polygon points="78,62 85,62 85,68 80,74 74,70" fill={accent.shadow} />
	<!-- Front facets (core) -->
	<polygon points="68,46 76,46 72,54 66,52 62,50" fill={accent.front} />
	<polygon points="62,50 66,52 68,58 60,60 58,56" fill={accent.front} />
	<polygon points="58,56 60,60 64,66 58,68 56,64" fill={accent.front} />
	<polygon points="56,64 64,66 66,72 62,76 58,70" fill={accent.front} />
	<polygon points="66,52 72,54 78,54 78,62 72,64 68,58" fill={accent.front} />
	<polygon points="68,58 72,64 78,62 74,70 66,72 64,66" fill={accent.front} />
	<!-- Highlight facets (top-left arc) -->
	<polygon points="58,56 62,50 62,54 60,56" fill={accent.highlight} />
	<polygon points="62,50 68,46 66,50 62,54" fill={accent.highlight} />

	<!-- ─── Puff 4: middle-left ──────────────────────────────────── -->
	<!-- Shadow facets (right/bottom arc) -->
	<polygon points="36,26 44,30 40,34 34,32" fill={accent.shadow} />
	<polygon points="40,34 46,36 44,42 38,42" fill={accent.shadow} />
	<polygon points="38,42 44,42 38,48 30,50 30,44" fill={accent.shadow} />
	<!-- Front facets (core) -->
	<polygon points="30,26 36,26 34,32 28,30 24,30" fill={accent.front} />
	<polygon points="24,30 28,30 30,38 22,38 20,36" fill={accent.front} />
	<polygon points="22,38 30,38 30,44 24,48 20,42" fill={accent.front} />
	<polygon points="24,48 30,44 30,50 24,48" fill={accent.front} />
	<polygon points="28,30 34,32 38,42 30,44 30,38" fill={accent.front} />
	<!-- Highlight facets (top-left arc) -->
	<polygon points="24,30 30,26 28,30 26,32" fill={accent.highlight} />
	<polygon points="30,26 36,26 34,28 30,30" fill={accent.highlight} />

	<!-- ─── Puff 5: middle-right ─────────────────────────────────── -->
	<!-- Shadow facets (right/bottom arc) -->
	<polygon points="66,24 74,28 70,32 64,30" fill={accent.shadow} />
	<polygon points="70,32 78,34 78,40 70,40" fill={accent.shadow} />
	<polygon points="70,40 78,40 74,46 66,50 62,44" fill={accent.shadow} />
	<!-- Front facets (core) -->
	<polygon points="58,24 66,24 64,30 58,28 52,28" fill={accent.front} />
	<polygon points="52,28 58,28 60,36 52,36 48,34" fill={accent.front} />
	<polygon points="52,36 60,36 62,44 56,46 52,48 48,42" fill={accent.front} />
	<polygon points="56,46 62,44 66,50 58,50 54,48" fill={accent.front} />
	<polygon points="58,28 64,30 70,40 62,44 60,36" fill={accent.front} />
	<!-- Highlight facets (top-left arc) -->
	<polygon points="52,28 58,24 56,28 54,30" fill={accent.highlight} />
	<polygon points="58,24 66,24 62,26 58,28" fill={accent.highlight} />

	<!-- ─── Puff 6: top peak ─────────────────────────────────────── -->
	<!-- Shadow facets (right/bottom arc) -->
	<polygon points="52,8 58,10 54,14 48,12" fill={accent.shadow} />
	<polygon points="54,14 62,14 62,20 56,20" fill={accent.shadow} />
	<polygon points="56,20 62,20 58,26 50,28 48,22" fill={accent.shadow} />
	<!-- Front facets (core) -->
	<polygon points="44,8 52,8 48,12 42,12 38,10" fill={accent.front} />
	<polygon points="38,10 42,12 44,18 36,18 34,14" fill={accent.front} />
	<polygon points="36,18 44,18 48,22 42,24 38,24 34,20" fill={accent.front} />
	<polygon points="42,24 48,22 50,28 42,28" fill={accent.front} />
	<polygon points="42,12 48,12 54,14 56,20 48,22 44,18" fill={accent.front} />
	<!-- Highlight facets (top-left arc) -->
	<polygon points="38,10 44,8 42,12 40,14" fill={accent.highlight} />
	<polygon points="44,8 52,8 48,10 44,12" fill={accent.highlight} />
</g>
