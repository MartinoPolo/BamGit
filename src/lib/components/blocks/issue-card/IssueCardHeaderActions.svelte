<script lang="ts">
	import { useIssueCard } from './index.js';
	import IssueStateChip from '$lib/components/derived/issue-state-chip/IssueStateChip.svelte';
	import { PriorityBadge } from '$lib/components/derived/priority-badge/index.js';
	import type { DisplayPriority } from '$lib/components/derived/priority-badge/priority_badge_types.js';
	import QuickActionButtons from './QuickActionButtons.svelte';

	const ctx = useIssueCard();

	const displayPriority = $derived(
		ctx.issue.priority !== null && ctx.issue.priority !== 'medium'
			? (ctx.issue.priority as DisplayPriority)
			: null,
	);
</script>

<div class="flex shrink-0 items-center gap-1.5">
	{#if ctx.chipState}
		<IssueStateChip label={ctx.chipState.label} colorVariable={ctx.chipState.colorVariable} />
	{/if}

	{#if displayPriority !== null && ctx.prioritiesEnabled}
		<PriorityBadge
			priority={displayPriority}
			position={ctx.appearanceSettings.priorityPosition}
			badgeStyle={ctx.appearanceSettings.badgeStyle}
			onclick={(event) => {
				event.stopPropagation();
				ctx.onPriorityClick?.();
			}}
		/>
	{/if}

	<QuickActionButtons />
</div>
