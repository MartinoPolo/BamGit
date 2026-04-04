<script lang="ts">
	import type { TreeStage, FruitType } from '$lib/types/tree_visualization';
	import type { AccentColors, AttachmentPoints } from './types';
	import { compute_attachment_points } from './attachment_points';

	interface Props {
		stage: Extract<TreeStage, 'leafy' | 'fruiting' | 'autumn' | 'ready'>;
		accent: AccentColors;
		trunk_color: string;
		ground_color: string;
		fruit_types: readonly FruitType[];
	}

	let { stage, accent, trunk_color, ground_color, fruit_types }: Props = $props();

	const attachment_points: AttachmentPoints = $derived(compute_attachment_points(stage));

	const FRUIT_COLORS: Record<FruitType, string> = {
		apple: 'oklch(0.58 0.22 28)',
		pear: 'oklch(0.78 0.15 110)',
		orange: 'oklch(0.72 0.18 60)',
		cherry: 'oklch(0.45 0.25 15)',
		plum: 'oklch(0.45 0.2 310)',
	};

	// Deterministic fruit positions within canopy
	const FRUIT_POSITIONS = [
		{ x: 38, y: 35 },
		{ x: 62, y: 32 },
		{ x: 30, y: 45 },
		{ x: 55, y: 25 },
		{ x: 70, y: 42 },
		{ x: 42, y: 22 },
		{ x: 58, y: 48 },
	];

	// Autumn: warm hue shift for "falling leaves"
	const AUTUMN_LEAF_POSITIONS = [
		{ x: 25, y: 65, rotation: 30 },
		{ x: 72, y: 70, rotation: -20 },
		{ x: 35, y: 75, rotation: 45 },
	];
</script>

<g data-stage={stage} data-attachment-points={JSON.stringify(attachment_points)}>
	{#if stage === 'ready'}
		<!-- Glow filter for ready stage -->
		<defs>
			<filter id="ready-glow" x="-20%" y="-20%" width="140%" height="140%">
				<feGaussianBlur in="SourceGraphic" stdDeviation="3" result="blur" />
				<feMerge>
					<feMergeNode in="blur" />
					<feMergeNode in="SourceGraphic" />
				</feMerge>
			</filter>
		</defs>
	{/if}

	<!-- Ground shadow -->
	<polygon points="20,120 80,120 75,115 25,115" fill={ground_color} />

	<!-- Trunk -->
	<rect x="45" y="50" width="10" height="60" fill={trunk_color} />
	<!-- Trunk detail -->
	<rect x="47" y="55" width="2" height="50" fill={ground_color} opacity="0.3" />

	<!-- Canopy group (with glow filter on ready stage) -->
	<g filter={stage === 'ready' ? 'url(#ready-glow)' : undefined}>
		<!-- Layer 1: bottom wide -->
		<polygon points="50,48 20,58 80,58" fill={accent.front} />
		<polygon points="50,48 80,58 65,53" fill={accent.shadow} />

		<!-- Layer 2: middle -->
		<polygon points="50,32 25,48 75,48" fill={accent.front} />
		<polygon points="50,32 75,48 60,40" fill={accent.shadow} />
		<polygon points="50,32 35,42 50,39" fill={accent.highlight} />

		<!-- Layer 3: top -->
		<polygon points="50,15 30,35 70,35" fill={accent.front} />
		<polygon points="50,15 70,35 58,25" fill={accent.shadow} />
		<polygon points="50,15 40,26 50,23" fill={accent.highlight} />

		<!-- Layer 4: peak -->
		<polygon points="50,8 38,22 62,22" fill={accent.front} />
		<polygon points="50,8 62,22 55,15" fill={accent.shadow} />
	</g>

	{#if stage === 'fruiting'}
		<!-- Fruit elements -->
		{#each fruit_types as fruit, index (index)}
			{@const position = FRUIT_POSITIONS[index % FRUIT_POSITIONS.length]}
			<circle
				cx={position.x}
				cy={position.y}
				r="3"
				fill={FRUIT_COLORS[fruit]}
				data-fruit={fruit}
			/>
		{/each}
	{/if}

	{#if stage === 'autumn'}
		<!-- Falling leaf polygons -->
		{#each AUTUMN_LEAF_POSITIONS as leaf, index (index)}
			<polygon
				points="{leaf.x},{leaf.y} {leaf.x + 5},{leaf.y - 3} {leaf.x + 8},{leaf.y +
					2} {leaf.x + 3},{leaf.y + 4}"
				fill={accent.front}
				opacity="0.7"
				transform="rotate({leaf.rotation} {leaf.x + 4} {leaf.y})"
				data-falling-leaf="true"
			/>
		{/each}
	{/if}
</g>
