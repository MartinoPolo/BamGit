<script lang="ts">
	interface Props {
		percent: number;
		height?: number;
		color?: string;
		class?: string;
	}

	let {
		percent,
		height = 4,
		color = 'var(--status-success)',
		class: className = '',
	}: Props = $props();

	const clampedPercent = $derived(Math.max(0, Math.min(100, percent)));
</script>

<div class="overflow-hidden rounded-0.75 bg-surface-3 {className}" style="height: {height}px">
	<div
		class="h-full rounded-0.75 transition-[width] duration-300"
		style="width: {clampedPercent}%; background: {color}"
	></div>
</div>
