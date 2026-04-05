<script lang="ts">
	interface Props {
		ground_color: string;
		is_dark: boolean;
	}

	let { ground_color, is_dark }: Props = $props();

	const pot_front = $derived(is_dark ? 'oklch(0.40 0.10 45)' : 'oklch(0.55 0.12 45)');
	const pot_shadow = $derived(is_dark ? 'oklch(0.32 0.08 45)' : 'oklch(0.45 0.10 45)');
	const pot_rim = $derived(is_dark ? 'oklch(0.48 0.10 45)' : 'oklch(0.62 0.12 45)');
</script>

<g data-component="pot-base">
	<!-- Ground shadow ellipse -->
	<ellipse cx="40" cy="97" rx="22" ry="4" fill={ground_color} opacity="0.6" />

	<!-- Pot body: faceted trapezoid (wider at top, narrower at bottom) -->
	<!-- Front face -->
	<polygon points="18,62 62,62 56,95 24,95" fill={pot_front} />
	<!-- Left shadow facet (darker side) -->
	<polygon points="18,62 30,62 26,95 24,95" fill={pot_shadow} />

	<!-- Rim band -->
	<polygon points="16,58 64,58 62,65 18,65" fill={pot_rim} />
	<!-- Rim highlight facet -->
	<polygon points="16,58 40,58 40,62 18,62" fill={pot_front} />

	<!-- Bottom edge -->
	<line x1="24" y1="95" x2="56" y2="95" stroke={pot_shadow} stroke-width="1" />
</g>
