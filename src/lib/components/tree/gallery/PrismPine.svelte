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

<g data-variant="prism-pine" data-attachment-points={JSON.stringify(attachment_points)}>
	<!-- Ground shadow -->
	<polygon points="18,120 82,120 76,114 24,114" fill={ground_color} />

	<!-- Trunk (straight dark) -->
	<polygon points="45,50 55,50 55,110 45,110" fill={trunk_color} />
	<!-- Trunk bark grain highlights -->
	<polygon points="46.5,53 47.3,53 47.3,108 46.5,108" fill={ground_color} opacity="0.35" />
	<polygon points="49.5,52 50.3,52 50.3,109 49.5,109" fill={ground_color} opacity="0.25" />
	<polygon points="52.6,54 53.4,54 53.4,107 52.6,107" fill={ground_color} opacity="0.35" />

	<!-- Conical canopy - triangular tile facets in 10 horizontal rows -->
	<!-- Row 10 (bottom, widest) y: 45-52, width 36 (x: 14-86) -->
	<polygon points="14,52 23,52 18.5,45" fill={accent.front} />
	<polygon points="23,52 18.5,45 27.5,45" fill={accent.shadow} />
	<polygon points="23,52 32,52 27.5,45" fill={accent.front} />
	<polygon points="32,52 27.5,45 36.5,45" fill={accent.highlight} />
	<polygon points="32,52 41,52 36.5,45" fill={accent.shadow} />
	<polygon points="41,52 36.5,45 45.5,45" fill={accent.front} />
	<polygon points="41,52 50,52 45.5,45" fill={accent.shadow} />
	<polygon points="50,52 45.5,45 54.5,45" fill={accent.front} />
	<polygon points="50,52 59,52 54.5,45" fill={accent.highlight} />
	<polygon points="59,52 54.5,45 63.5,45" fill={accent.shadow} />
	<polygon points="59,52 68,52 63.5,45" fill={accent.front} />
	<polygon points="68,52 63.5,45 72.5,45" fill={accent.shadow} />
	<polygon points="68,52 77,52 72.5,45" fill={accent.front} />
	<polygon points="77,52 72.5,45 81.5,45" fill={accent.shadow} opacity="0.7" />
	<polygon points="77,52 86,52 81.5,45" fill={accent.shadow} />

	<!-- Row 9 y: 38-45, width 32 (x: 18-82) -->
	<polygon points="18,45 26,45 22,38" fill={accent.shadow} />
	<polygon points="26,45 22,38 30,38" fill={accent.front} />
	<polygon points="26,45 34,45 30,38" fill={accent.shadow} />
	<polygon points="34,45 30,38 38,38" fill={accent.highlight} />
	<polygon points="34,45 42,45 38,38" fill={accent.front} />
	<polygon points="42,45 38,38 46,38" fill={accent.shadow} />
	<polygon points="42,45 50,45 46,38" fill={accent.front} />
	<polygon points="50,45 46,38 54,38" fill={accent.shadow} />
	<polygon points="50,45 58,45 54,38" fill={accent.front} />
	<polygon points="58,45 54,38 62,38" fill={accent.highlight} />
	<polygon points="58,45 66,45 62,38" fill={accent.shadow} />
	<polygon points="66,45 62,38 70,38" fill={accent.front} />
	<polygon points="66,45 74,45 70,38" fill={accent.shadow} opacity="0.7" />
	<polygon points="74,45 70,38 78,38" fill={accent.shadow} />
	<polygon points="74,45 82,45 78,38" fill={accent.front} />

	<!-- Row 8 y: 32-38, width 28 (x: 22-78) -->
	<polygon points="22,38 29,38 25.5,32" fill={accent.front} />
	<polygon points="29,38 25.5,32 32.5,32" fill={accent.shadow} />
	<polygon points="29,38 36,38 32.5,32" fill={accent.front} />
	<polygon points="36,38 32.5,32 39.5,32" fill={accent.shadow} />
	<polygon points="36,38 43,38 39.5,32" fill={accent.highlight} />
	<polygon points="43,38 39.5,32 46.5,32" fill={accent.front} />
	<polygon points="43,38 50,38 46.5,32" fill={accent.shadow} />
	<polygon points="50,38 46.5,32 53.5,32" fill={accent.front} />
	<polygon points="50,38 57,38 53.5,32" fill={accent.shadow} />
	<polygon points="57,38 53.5,32 60.5,32" fill={accent.front} />
	<polygon points="57,38 64,38 60.5,32" fill={accent.shadow} opacity="0.7" />
	<polygon points="64,38 60.5,32 67.5,32" fill={accent.highlight} />
	<polygon points="64,38 71,38 67.5,32" fill={accent.shadow} />
	<polygon points="71,38 67.5,32 74.5,32" fill={accent.front} />
	<polygon points="71,38 78,38 74.5,32" fill={accent.shadow} />

	<!-- Row 7 y: 27-32, width 24 (x: 26-74) -->
	<polygon points="26,32 32,32 29,27" fill={accent.shadow} />
	<polygon points="32,32 29,27 35,27" fill={accent.front} />
	<polygon points="32,32 38,32 35,27" fill={accent.shadow} />
	<polygon points="38,32 35,27 41,27" fill={accent.front} />
	<polygon points="38,32 44,32 41,27" fill={accent.highlight} />
	<polygon points="44,32 41,27 47,27" fill={accent.shadow} />
	<polygon points="44,32 50,32 47,27" fill={accent.front} />
	<polygon points="50,32 47,27 53,27" fill={accent.shadow} />
	<polygon points="50,32 56,32 53,27" fill={accent.front} />
	<polygon points="56,32 53,27 59,27" fill={accent.shadow} />
	<polygon points="56,32 62,32 59,27" fill={accent.front} />
	<polygon points="62,32 59,27 65,27" fill={accent.highlight} />
	<polygon points="62,32 68,32 65,27" fill={accent.shadow} opacity="0.7" />
	<polygon points="68,32 65,27 71,27" fill={accent.front} />
	<polygon points="68,32 74,32 71,27" fill={accent.shadow} />

	<!-- Row 6 y: 23-27, width 20 (x: 30-70) -->
	<polygon points="30,27 35,27 32.5,23" fill={accent.front} />
	<polygon points="35,27 32.5,23 37.5,23" fill={accent.shadow} />
	<polygon points="35,27 40,27 37.5,23" fill={accent.front} />
	<polygon points="40,27 37.5,23 42.5,23" fill={accent.highlight} />
	<polygon points="40,27 45,27 42.5,23" fill={accent.shadow} />
	<polygon points="45,27 42.5,23 47.5,23" fill={accent.front} />
	<polygon points="45,27 50,27 47.5,23" fill={accent.shadow} />
	<polygon points="50,27 47.5,23 52.5,23" fill={accent.front} />
	<polygon points="50,27 55,27 52.5,23" fill={accent.shadow} />
	<polygon points="55,27 52.5,23 57.5,23" fill={accent.front} />
	<polygon points="55,27 60,27 57.5,23" fill={accent.highlight} />
	<polygon points="60,27 57.5,23 62.5,23" fill={accent.shadow} />
	<polygon points="60,27 65,27 62.5,23" fill={accent.front} />
	<polygon points="65,27 62.5,23 67.5,23" fill={accent.shadow} />
	<polygon points="65,27 70,27 67.5,23" fill={accent.front} />

	<!-- Row 5 y: 19-23, width 16 (x: 34-66) -->
	<polygon points="34,23 38,23 36,19" fill={accent.shadow} />
	<polygon points="38,23 36,19 40,19" fill={accent.front} />
	<polygon points="38,23 42,23 40,19" fill={accent.shadow} />
	<polygon points="42,23 40,19 44,19" fill={accent.front} />
	<polygon points="42,23 46,23 44,19" fill={accent.highlight} />
	<polygon points="46,23 44,19 48,19" fill={accent.shadow} />
	<polygon points="46,23 50,23 48,19" fill={accent.front} />
	<polygon points="50,23 48,19 52,19" fill={accent.shadow} />
	<polygon points="50,23 54,23 52,19" fill={accent.front} />
	<polygon points="54,23 52,19 56,19" fill={accent.shadow} />
	<polygon points="54,23 58,23 56,19" fill={accent.front} />
	<polygon points="58,23 56,19 60,19" fill={accent.highlight} />
	<polygon points="58,23 62,23 60,19" fill={accent.shadow} />
	<polygon points="62,23 60,19 64,19" fill={accent.front} />
	<polygon points="62,23 66,23 64,19" fill={accent.shadow} />

	<!-- Row 4 y: 15-19, width 12 (x: 38-62) -->
	<polygon points="38,19 41,19 39.5,15" fill={accent.front} />
	<polygon points="41,19 39.5,15 42.5,15" fill={accent.shadow} />
	<polygon points="41,19 44,19 42.5,15" fill={accent.front} />
	<polygon points="44,19 42.5,15 45.5,15" fill={accent.shadow} />
	<polygon points="44,19 47,19 45.5,15" fill={accent.highlight} />
	<polygon points="47,19 45.5,15 48.5,15" fill={accent.shadow} />
	<polygon points="47,19 50,19 48.5,15" fill={accent.front} />
	<polygon points="50,19 48.5,15 51.5,15" fill={accent.shadow} />
	<polygon points="50,19 53,19 51.5,15" fill={accent.front} />
	<polygon points="53,19 51.5,15 54.5,15" fill={accent.shadow} />
	<polygon points="53,19 56,19 54.5,15" fill={accent.front} />
	<polygon points="56,19 54.5,15 57.5,15" fill={accent.shadow} />
	<polygon points="56,19 59,19 57.5,15" fill={accent.highlight} />
	<polygon points="59,19 57.5,15 60.5,15" fill={accent.shadow} />
	<polygon points="59,19 62,19 60.5,15" fill={accent.front} />

	<!-- Row 3 y: 11-15, width 8 (x: 42-58) -->
	<polygon points="42,15 44.5,15 43.25,11" fill={accent.shadow} />
	<polygon points="44.5,15 43.25,11 45.75,11" fill={accent.front} />
	<polygon points="44.5,15 47,15 45.75,11" fill={accent.shadow} />
	<polygon points="47,15 45.75,11 48.25,11" fill={accent.front} />
	<polygon points="47,15 49.5,15 48.25,11" fill={accent.highlight} />
	<polygon points="49.5,15 48.25,11 50.75,11" fill={accent.shadow} />
	<polygon points="49.5,15 52,15 50.75,11" fill={accent.front} />
	<polygon points="52,15 50.75,11 53.25,11" fill={accent.shadow} />
	<polygon points="52,15 54.5,15 53.25,11" fill={accent.front} />
	<polygon points="54.5,15 53.25,11 55.75,11" fill={accent.shadow} />
	<polygon points="54.5,15 57,15 55.75,11" fill={accent.front} />
	<polygon points="57,15 55.75,11 58.25,11" fill={accent.shadow} />

	<!-- Row 2 y: 7-11, width 5 (x: 45-55) -->
	<polygon points="45,11 47,11 46,7" fill={accent.front} />
	<polygon points="47,11 46,7 48,7" fill={accent.shadow} />
	<polygon points="47,11 49,11 48,7" fill={accent.front} />
	<polygon points="49,11 48,7 50,7" fill={accent.highlight} />
	<polygon points="49,11 51,11 50,7" fill={accent.shadow} />
	<polygon points="51,11 50,7 52,7" fill={accent.front} />
	<polygon points="51,11 53,11 52,7" fill={accent.shadow} />
	<polygon points="53,11 52,7 54,7" fill={accent.front} />
	<polygon points="53,11 55,11 54,7" fill={accent.shadow} />

	<!-- Row 1 (peak) y: 3-7, width 3 (x: 47-53) -->
	<polygon points="47,7 48.5,7 47.75,3" fill={accent.shadow} />
	<polygon points="48.5,7 47.75,3 49.25,3" fill={accent.front} />
	<polygon points="48.5,7 50,7 49.25,3" fill={accent.highlight} />
	<polygon points="50,7 49.25,3 50.75,3" fill={accent.shadow} />
	<polygon points="50,7 51.5,7 50.75,3" fill={accent.front} />
	<polygon points="51.5,7 50.75,3 52.25,3" fill={accent.shadow} />
	<polygon points="51.5,7 53,7 52.25,3" fill={accent.front} />
</g>
