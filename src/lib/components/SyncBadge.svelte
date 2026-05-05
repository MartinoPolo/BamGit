<script lang="ts">
	import * as Tooltip from '$lib/components/ui/tooltip/index.js';

	interface Props {
		behindBaseCount: number;
	}

	let { behindBaseCount }: Props = $props();

	const colorClass = $derived.by(() => {
		if (behindBaseCount <= 0) {
			return 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/40 dark:text-green-300 dark:border-green-700/50';
		}
		if (behindBaseCount <= 5) {
			return 'bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/40 dark:text-yellow-300 dark:border-yellow-700/50';
		}
		return 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/40 dark:text-red-300 dark:border-red-700/50';
	});

	const tooltip = $derived(
		behindBaseCount === 0
			? 'Up to date with base branch'
			: `${behindBaseCount} commit${behindBaseCount === 1 ? '' : 's'} behind base branch`,
	);
</script>

{#if behindBaseCount > 0}
	<Tooltip.Provider>
		<Tooltip.Root>
			<Tooltip.Trigger>
				{#snippet child({ props })}
					<span
						{...props}
						class="inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-[10px] leading-tight {colorClass}"
					>
						<span class="opacity-70">↓</span>
						{behindBaseCount}
					</span>
				{/snippet}
			</Tooltip.Trigger>
			<Tooltip.Content>{tooltip}</Tooltip.Content>
		</Tooltip.Root>
	</Tooltip.Provider>
{/if}
