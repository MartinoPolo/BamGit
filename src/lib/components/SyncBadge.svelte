<script lang="ts">
	interface Props {
		behindBaseCount: number;
	}

	let { behindBaseCount }: Props = $props();

	const colorClass = $derived.by(() => {
		if (behindBaseCount <= 0) {
			return 'bg-green-900/60 text-green-300';
		}
		if (behindBaseCount <= 5) {
			return 'bg-yellow-900/60 text-yellow-300';
		}
		return 'bg-red-900/60 text-red-300';
	});

	const tooltip = $derived(
		behindBaseCount === 0
			? 'Up to date with base branch'
			: `${behindBaseCount} commit${behindBaseCount === 1 ? '' : 's'} behind base branch`,
	);
</script>

{#if behindBaseCount > 0}
	<span
		class="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] leading-tight {colorClass}"
		title={tooltip}
	>
		<span class="opacity-70">↓</span>
		{behindBaseCount}
	</span>
{/if}
