<script lang="ts">
	import ArrowDownIcon from '@lucide/svelte/icons/arrow-down';
	import { WithTooltip } from '$lib/components/shadcn/tooltip/index.js';

	interface Props {
		behindBaseCount: number;
	}

	let { behindBaseCount }: Props = $props();

	const colorClass = $derived.by(() => {
		if (behindBaseCount <= 0) {
			return 'bg-[color-mix(in_oklch,var(--status-success)_14%,transparent)] text-status-success border-[color-mix(in_oklch,var(--status-success)_40%,transparent)]';
		}
		if (behindBaseCount <= 5) {
			return 'bg-[color-mix(in_oklch,var(--status-warning)_14%,transparent)] text-status-warning border-[color-mix(in_oklch,var(--status-warning)_40%,transparent)]';
		}
		return 'bg-[color-mix(in_oklch,var(--status-danger)_14%,transparent)] text-status-danger border-[color-mix(in_oklch,var(--status-danger)_40%,transparent)]';
	});

	const tooltip = $derived(
		behindBaseCount === 0
			? 'Up to date with base branch'
			: `${behindBaseCount} commit${behindBaseCount === 1 ? '' : 's'} behind base branch`,
	);
</script>

{#if behindBaseCount > 0}
	<WithTooltip text={tooltip}>
		{#snippet asChild(props)}
			<span
				{...props}
				class="inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-[10px] leading-tight {colorClass}"
			>
				<ArrowDownIcon class="size-2.5 opacity-70" />
				{behindBaseCount}
			</span>
		{/snippet}
	</WithTooltip>
{/if}
