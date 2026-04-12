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

<g data-variant="rounded-oak" data-attachment-points={JSON.stringify(attachment_points)}>
	<defs>
		<linearGradient id="rounded-oak-canopy-gradient" x1="0" y1="0" x2="0" y2="1">
			<stop offset="0%" stop-color={accent.highlight} stop-opacity="0.9" />
			<stop offset="55%" stop-color={accent.front} stop-opacity="1" />
			<stop offset="100%" stop-color={accent.shadow} stop-opacity="1" />
		</linearGradient>
	</defs>

	<!-- Ground shadow -->
	<polygon points="18,120 82,120 76,114 24,114" fill={ground_color} />

	<!-- Trunk (thick, ~16 wide) -->
	<polygon points="42,50 58,50 59,108 41,108" fill={trunk_color} />
	<!-- Trunk shadow side -->
	<polygon points="54,50 58,50 59,108 55,108" fill={ground_color} opacity="0.35" />
	<!-- Trunk highlight stripe -->
	<polygon points="44,52 46,52 46,106 44,106" fill={accent.highlight} opacity="0.18" />

	<!-- Trunk knots (3 small dark polygons protruding from sides) -->
	<polygon points="41,62 38,64 39,68 41,67" fill={trunk_color} opacity="0.65" />
	<polygon points="59,76 62,78 61,82 59,81" fill={trunk_color} opacity="0.65" />
	<polygon points="41,90 37,92 38,96 41,95" fill={trunk_color} opacity="0.65" />
	<polygon points="59,54 61,55 60,58 59,58" fill={trunk_color} opacity="0.55" />

	<!-- Canopy background mass (gradient, broad rounded silhouette) -->
	<polygon
		points="50,6 62,7 73,10 82,16 87,24 88,32 85,40 78,46 68,49 56,50 44,50 32,49 22,46 15,40 12,32 13,24 18,16 27,10 38,7"
		fill="url(#rounded-oak-canopy-gradient)"
	/>

	<!-- ═══ PUFF 1: Top-left puff ═══ -->
	<polygon points="26,14 32,9 38,8 42,11 43,18 40,24 33,26 27,24 23,19" fill={accent.front} />
	<polygon points="40,24 43,18 42,11 43,14 42,22" fill={accent.shadow} />
	<polygon points="33,26 40,24 42,22 40,26 34,28" fill={accent.shadow} />
	<polygon points="32,9 38,8 36,11 31,12" fill={accent.highlight} />

	<!-- ═══ PUFF 2: Top-center puff ═══ -->
	<polygon points="42,6 50,4 58,6 62,12 60,19 54,22 46,22 40,19 40,12" fill={accent.front} />
	<polygon points="60,19 62,12 58,6 59,10 61,15" fill={accent.shadow} />
	<polygon points="54,22 60,19 61,15 58,22 52,24" fill={accent.shadow} />
	<polygon points="50,4 58,6 54,7 48,7 44,7" fill={accent.highlight} />

	<!-- ═══ PUFF 3: Top-right puff ═══ -->
	<polygon points="58,11 64,8 70,9 76,14 77,19 73,24 67,26 61,24 57,18" fill={accent.front} />
	<polygon points="73,24 77,19 76,14 78,17 76,22" fill={accent.shadow} />
	<polygon points="67,26 73,24 76,22 73,26 68,28" fill={accent.shadow} />
	<polygon points="64,8 70,9 68,11 63,12" fill={accent.highlight} />

	<!-- ═══ PUFF 4: Left-shoulder puff ═══ -->
	<polygon points="14,22 20,17 26,17 30,22 30,29 26,34 19,34 14,30 12,26" fill={accent.front} />
	<polygon points="30,29 30,22 26,17 29,20 31,26" fill={accent.shadow} />
	<polygon points="26,34 30,29 31,26 29,33 24,35" fill={accent.shadow} />
	<polygon points="20,17 26,17 23,19 18,20" fill={accent.highlight} />

	<!-- ═══ PUFF 5: Right-shoulder puff ═══ -->
	<polygon points="70,22 74,17 80,17 86,22 88,26 86,30 80,34 73,34 69,29" fill={accent.front} />
	<polygon points="86,30 88,26 86,22 87,25 88,29" fill={accent.shadow} />
	<polygon points="80,34 86,30 88,29 84,34 78,35" fill={accent.shadow} />
	<polygon points="74,17 80,17 77,19 72,20" fill={accent.highlight} />

	<!-- ═══ PUFF 6: Center puff (large, dominant) ═══ -->
	<polygon
		points="38,18 46,14 54,14 62,18 64,26 60,34 52,37 44,37 36,33 34,26"
		fill={accent.front}
	/>
	<polygon points="60,34 64,26 62,18 64,22 65,30" fill={accent.shadow} />
	<polygon points="52,37 60,34 65,30 58,37 50,39" fill={accent.shadow} />
	<polygon points="46,14 54,14 50,16 44,16" fill={accent.highlight} />

	<!-- ═══ PUFF 7: Lower-left puff ═══ -->
	<polygon points="20,32 26,28 32,29 37,33 37,40 32,45 24,45 19,41 17,36" fill={accent.front} />
	<polygon points="37,40 37,33 32,29 36,32 38,38" fill={accent.shadow} />
	<polygon points="32,45 37,40 38,38 35,45 29,47" fill={accent.shadow} />
	<polygon points="26,28 32,29 28,31 23,31" fill={accent.highlight} />

	<!-- ═══ PUFF 8: Lower-center puff ═══ -->
	<polygon points="40,32 48,29 56,29 62,33 63,40 58,45 50,47 42,46 38,41" fill={accent.front} />
	<polygon points="58,45 63,40 62,33 64,37 62,44" fill={accent.shadow} />
	<polygon points="50,47 58,45 62,44 56,48 48,49" fill={accent.shadow} />
	<polygon points="48,29 56,29 52,31 46,31" fill={accent.highlight} />

	<!-- ═══ PUFF 9: Lower-right puff ═══ -->
	<polygon points="64,32 70,29 76,30 80,34 81,40 77,45 71,45 65,42 63,37" fill={accent.front} />
	<polygon points="77,45 81,40 80,34 82,38 81,44" fill={accent.shadow} />
	<polygon points="71,45 77,45 81,44 76,47 70,47" fill={accent.shadow} />
	<polygon points="70,29 76,30 72,31 68,31" fill={accent.highlight} />

	<!-- ═══ PUFF 10: Bottom-bridge puff ═══ -->
	<polygon points="32,42 40,39 50,40 60,40 68,42 66,48 56,50 44,50 34,48" fill={accent.front} />
	<polygon points="66,48 68,42 60,40 64,44 66,46" fill={accent.shadow} />
	<polygon points="56,50 66,48 66,46 58,50 50,51" fill={accent.shadow} />
	<polygon points="40,39 50,40 60,40 50,41 42,41" fill={accent.highlight} />
</g>
