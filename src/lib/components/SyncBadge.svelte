<script lang="ts">
	interface Props {
		behind_base_count: number;
	}

	let { behind_base_count }: Props = $props();

	const color_class = $derived.by(() => {
		if (behind_base_count <= 0) {
			return 'bg-green-900/60 text-green-300';
		}
		if (behind_base_count <= 5) {
			return 'bg-yellow-900/60 text-yellow-300';
		}
		return 'bg-red-900/60 text-red-300';
	});

	const tooltip = $derived(
		behind_base_count === 0
			? 'Up to date with base branch'
			: `${behind_base_count} commit${behind_base_count === 1 ? '' : 's'} behind base branch`,
	);
</script>

{#if behind_base_count > 0}
	<span
		class="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] leading-tight {color_class}"
		title={tooltip}
	>
		<span class="opacity-70">↓</span>
		{behind_base_count}
	</span>
{/if}
