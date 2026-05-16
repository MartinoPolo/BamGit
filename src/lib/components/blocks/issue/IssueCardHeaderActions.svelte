<script lang="ts">
	import { useIssueCard } from '$lib/modules/issue-card/index.js';
	import IssueStateChip from '$lib/components/derived/issue-state-chip/IssueStateChip.svelte';
	import { SimpleTooltip } from '$lib/components/shadcn/tooltip/index.js';
	import { PRIORITY_BADGE_CLASSES } from './issue_card_utils.js';
	import QuickActionButtons from './QuickActionButtons.svelte';

	const ctx = useIssueCard();

	const priorityBadgeClass = $derived(
		ctx.issue.priority !== null ? (PRIORITY_BADGE_CLASSES[ctx.issue.priority] ?? null) : null,
	);

	const priorityChipClass = $derived(
		ctx.isLightHeader ? 'bg-white/22 text-black/80' : 'bg-black/18 text-inherit',
	);
</script>

<div class="flex shrink-0 items-center gap-1.5">
	{#if ctx.chipState}
		<IssueStateChip label={ctx.chipState.label} colorVariable={ctx.chipState.colorVariable} />
	{/if}

	{#if priorityBadgeClass && ctx.prioritiesEnabled && ctx.issue.priority !== 'medium'}
		<SimpleTooltip text="Change priority">
			<button
				class="inline-flex h-4.5 cursor-pointer items-center gap-1 rounded border-none bg-transparent px-1.5 font-mono text-[9px] font-bold uppercase leading-none tracking-wide {priorityChipClass}"
				onclick={(event: MouseEvent) => {
					event.stopPropagation();
					if (ctx.onPriorityClick) {
						ctx.onPriorityClick();
					}
				}}
			>
				{ctx.issue.priority}
			</button>
		</SimpleTooltip>
	{/if}

	<QuickActionButtons />
</div>
