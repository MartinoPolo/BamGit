<script lang="ts">
	interface Props {
		state: 'executing' | 'hitl' | 'review' | 'error' | 'paused' | 'done';
		isLightHeader?: boolean;
	}

	let { state, isLightHeader = false }: Props = $props();

	const chipClass = $derived(
		isLightHeader ? 'bg-white/22 text-black/80' : 'bg-black/18 text-inherit',
	);
</script>

<span
	class="inline-flex items-center gap-1 rounded px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase leading-none tracking-wide {chipClass}"
>
	{state}
</span>
