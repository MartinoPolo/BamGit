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

<g data-variant="layered-beech" data-attachment-points={JSON.stringify(attachment_points)}>
	<defs>
		<radialGradient id="beech-canopy-glow" cx="50%" cy="55%" r="65%">
			<stop offset="0%" stop-color={accent.highlight} stop-opacity="0.95" />
			<stop offset="55%" stop-color={accent.front} stop-opacity="0.85" />
			<stop offset="100%" stop-color={accent.shadow} stop-opacity="0.7" />
		</radialGradient>
	</defs>

	<!-- Ground shadow -->
	<polygon points="18,122 82,122 76,115 24,115" fill={ground_color} />
	<polygon points="24,115 76,115 72,112 28,112" fill={ground_color} opacity="0.6" />

	<!-- Tapered trunk (wider at base ~14, narrower at top ~9) -->
	<polygon points="43,110 57,110 54.5,50 45.5,50" fill={trunk_color} />
	<!-- Bark detail lines -->
	<polygon points="46,108 47,108 46.5,55 45.5,55" fill={ground_color} opacity="0.35" />
	<polygon points="50,107 50.8,107 50.6,52 49.8,52" fill={ground_color} opacity="0.25" />
	<polygon points="53,109 54,109 53.6,58 52.6,58" fill={ground_color} opacity="0.3" />

	<!-- Canopy base glow layer (radialGradient) -->
	<polygon
		points="50,6 72,10 88,22 92,38 82,50 68,52 50,50 32,52 18,50 8,38 12,22 28,10"
		fill="url(#beech-canopy-glow)"
	/>

	<!-- ═══════════════════════════════════════════════════════════════ -->
	<!-- PUFF 1: Bottom-left cluster (11 facets)                           -->
	<!-- ═══════════════════════════════════════════════════════════════ -->
	<!-- front face A (upper) -->
	<polygon points="24,34 18,40 20,44 26,42 30,40 30,34" fill={accent.front} />
	<!-- front face B (mid) -->
	<polygon points="20,44 16,48 22,50 28,48 30,44 26,42" fill={accent.front} opacity="0.95" />
	<!-- front face C (lower) -->
	<polygon points="16,48 16,52 22,54 28,54 30,50 28,48 22,50" fill={accent.front} opacity="0.9" />
	<!-- front face D (right cheek) -->
	<polygon points="30,40 30,50 36,50 38,44 36,38 30,34" fill={accent.front} opacity="0.92" />
	<!-- shadow-right upper -->
	<polygon points="30,34 36,38 38,44 34,42 32,38" fill={accent.shadow} />
	<!-- shadow-right lower -->
	<polygon points="38,44 36,50 30,50 32,46 34,42" fill={accent.shadow} opacity="0.9" />
	<!-- shadow-right edge -->
	<polygon points="30,50 36,50 34,52 30,54" fill={accent.shadow} opacity="0.7" />
	<!-- shadow-left upper -->
	<polygon points="18,40 14,46 16,48 18,44" fill={accent.shadow} opacity="0.85" />
	<!-- shadow-left lower -->
	<polygon points="14,46 16,52 22,54 20,50 16,48" fill={accent.shadow} opacity="0.8" />
	<!-- highlight-top left -->
	<polygon points="22,38 26,36 26,40 22,42" fill={accent.highlight} />
	<!-- highlight-top right -->
	<polygon points="26,36 30,36 28,40 26,40" fill={accent.highlight} opacity="0.9" />

	<!-- ═══════════════════════════════════════════════════════════════ -->
	<!-- PUFF 2: Bottom-right cluster (11 facets)                          -->
	<!-- ═══════════════════════════════════════════════════════════════ -->
	<!-- front face A (upper-left cheek) -->
	<polygon points="70,34 64,36 62,42 66,44 70,42 72,38" fill={accent.front} />
	<!-- front face B (center) -->
	<polygon points="66,44 62,48 66,52 72,52 74,48 70,42" fill={accent.front} opacity="0.95" />
	<!-- front face C (lower-center) -->
	<polygon points="62,48 66,54 72,56 74,52 72,52 66,52" fill={accent.front} opacity="0.88" />
	<!-- front face D (right center) -->
	<polygon points="70,42 74,48 74,52 80,54 82,48 80,42" fill={accent.front} opacity="0.92" />
	<!-- shadow-right upper -->
	<polygon points="80,34 86,38 88,44 84,42 80,40" fill={accent.shadow} />
	<!-- shadow-right lower -->
	<polygon points="88,44 86,50 80,54 82,48 84,42" fill={accent.shadow} opacity="0.9" />
	<!-- shadow-right edge -->
	<polygon points="80,54 86,50 82,52 76,54" fill={accent.shadow} opacity="0.7" />
	<!-- shadow-left upper -->
	<polygon points="64,36 62,42 62,46 64,40" fill={accent.shadow} opacity="0.85" />
	<!-- shadow-left lower -->
	<polygon points="62,46 62,48 66,54 66,50 64,46" fill={accent.shadow} opacity="0.8" />
	<!-- highlight-top left -->
	<polygon points="68,38 72,36 72,40 68,40" fill={accent.highlight} />
	<!-- highlight-top right -->
	<polygon points="72,36 76,38 74,42 72,40" fill={accent.highlight} opacity="0.9" />

	<!-- ═══════════════════════════════════════════════════════════════ -->
	<!-- PUFF 3: Middle-left cluster (11 facets)                           -->
	<!-- ═══════════════════════════════════════════════════════════════ -->
	<!-- front face A (upper) -->
	<polygon points="30,18 24,22 26,26 32,26 36,24 38,18" fill={accent.front} />
	<!-- front face B (mid) -->
	<polygon points="26,26 22,30 24,34 30,34 34,30 32,26" fill={accent.front} opacity="0.95" />
	<!-- front face C (lower) -->
	<polygon points="22,30 20,34 24,40 30,42 32,38 30,34 24,34" fill={accent.front} opacity="0.9" />
	<!-- front face D (right cheek) -->
	<polygon
		points="36,24 34,30 30,34 32,38 38,40 42,36 44,28"
		fill={accent.front}
		opacity="0.92"
	/>
	<!-- shadow-right upper -->
	<polygon points="38,18 44,22 46,28 42,26 40,22" fill={accent.shadow} />
	<!-- shadow-right lower -->
	<polygon points="46,28 44,36 38,40 42,36 44,28" fill={accent.shadow} opacity="0.9" />
	<!-- shadow-right edge -->
	<polygon points="38,40 44,36 40,39 32,42" fill={accent.shadow} opacity="0.7" />
	<!-- shadow-left upper -->
	<polygon points="24,22 20,28 22,32 24,26" fill={accent.shadow} opacity="0.85" />
	<!-- shadow-left lower -->
	<polygon points="22,32 20,28 20,34 24,40 24,34" fill={accent.shadow} opacity="0.8" />
	<!-- highlight-top left -->
	<polygon points="28,22 32,20 32,24 28,26" fill={accent.highlight} />
	<!-- highlight-top right -->
	<polygon points="32,20 36,22 34,26 32,24" fill={accent.highlight} opacity="0.9" />

	<!-- ═══════════════════════════════════════════════════════════════ -->
	<!-- PUFF 4: Middle-right cluster (11 facets)                          -->
	<!-- ═══════════════════════════════════════════════════════════════ -->
	<!-- front face A (upper-left cheek) -->
	<polygon points="62,18 56,22 58,26 64,26 68,24 70,18" fill={accent.front} />
	<!-- front face B (mid) -->
	<polygon points="58,26 54,28 56,32 62,32 66,30 64,26" fill={accent.front} opacity="0.95" />
	<!-- front face C (lower) -->
	<polygon points="56,32 56,36 60,40 66,42 68,38 66,34 62,32" fill={accent.front} opacity="0.9" />
	<!-- front face D (right cheek) -->
	<polygon
		points="68,24 66,30 66,34 68,38 74,40 78,36 80,28"
		fill={accent.front}
		opacity="0.92"
	/>
	<!-- shadow-right upper -->
	<polygon points="74,18 80,22 82,30 78,28 76,22" fill={accent.shadow} />
	<!-- shadow-right lower -->
	<polygon points="82,30 80,36 74,40 78,36 80,28" fill={accent.shadow} opacity="0.9" />
	<!-- shadow-right edge -->
	<polygon points="74,40 80,36 76,39 68,42" fill={accent.shadow} opacity="0.7" />
	<!-- shadow-left upper -->
	<polygon points="56,22 54,28 56,32 58,26" fill={accent.shadow} opacity="0.85" />
	<!-- shadow-left lower -->
	<polygon points="56,32 54,28 56,36 60,40 58,34" fill={accent.shadow} opacity="0.8" />
	<!-- highlight-top left -->
	<polygon points="60,22 64,20 64,24 60,26" fill={accent.highlight} />
	<!-- highlight-top right -->
	<polygon points="64,20 68,22 66,26 64,24" fill={accent.highlight} opacity="0.9" />

	<!-- ═══════════════════════════════════════════════════════════════ -->
	<!-- PUFF 5: Top-center crown cluster (11 facets)                      -->
	<!-- ═══════════════════════════════════════════════════════════════ -->
	<!-- front face A (upper-left) -->
	<polygon points="50,4 42,8 44,12 50,12 54,10" fill={accent.front} />
	<!-- front face B (mid-left) -->
	<polygon points="44,12 38,14 40,20 46,20 48,16 50,12" fill={accent.front} opacity="0.95" />
	<!-- front face C (lower-center) -->
	<polygon points="40,20 38,22 42,28 50,30 52,24 48,20 46,20" fill={accent.front} opacity="0.9" />
	<!-- front face D (right cheek) -->
	<polygon
		points="54,10 50,12 48,16 52,24 58,24 60,18 58,12"
		fill={accent.front}
		opacity="0.92"
	/>
	<!-- shadow-right upper -->
	<polygon points="54,10 58,8 62,14 60,14 58,12" fill={accent.shadow} />
	<!-- shadow-right lower -->
	<polygon points="62,14 62,22 58,28 58,24 60,18" fill={accent.shadow} opacity="0.9" />
	<!-- shadow-right edge -->
	<polygon points="50,30 58,28 54,29 50,30" fill={accent.shadow} opacity="0.7" />
	<!-- shadow-left upper -->
	<polygon points="42,8 38,14 40,16 42,12" fill={accent.shadow} opacity="0.85" />
	<!-- shadow-left lower -->
	<polygon points="40,16 38,14 38,22 42,28 42,20" fill={accent.shadow} opacity="0.8" />
	<!-- highlight-top left -->
	<polygon points="46,8 50,6 50,10 46,12" fill={accent.highlight} />
	<!-- highlight-top right -->
	<polygon points="50,6 54,8 52,12 50,10" fill={accent.highlight} opacity="0.9" />
</g>
