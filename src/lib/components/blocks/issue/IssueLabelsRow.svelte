<script lang="ts">
	import { useIssueCard } from '$lib/modules/issue-card/index.js';
	import { Badge } from '$lib/components/shadcn/badge/index.js';
	import { SimpleTooltip } from '$lib/components/shadcn/tooltip/index.js';

	const ctx = useIssueCard();

	const MAX_VISIBLE_LABELS = 3;

	const visibleLabels = $derived(ctx.issue.labels.slice(0, MAX_VISIBLE_LABELS));
	const overflowCount = $derived(ctx.issue.labels.length - MAX_VISIBLE_LABELS);
</script>

{#if ctx.issue.labels.length > 0}
	<div class="flex flex-wrap items-center gap-1">
		{#each visibleLabels as label (label.name)}
			<Badge
				size="compact"
				class="rounded-full py-px leading-3"
				style="background-color: {label.color}33; color: {label.color}; border-color: {label.color}44;"
			>
				{label.name}
			</Badge>
		{/each}
		{#if overflowCount > 0}
			<SimpleTooltip
				text={ctx.issue.labels
					.slice(MAX_VISIBLE_LABELS)
					.map((l) => l.name)
					.join(', ')}
			>
				<span
					class="inline-block rounded-full border border-border px-1.5 py-px text-[10px] font-medium leading-3 text-muted-foreground"
				>
					+{overflowCount}
				</span>
			</SimpleTooltip>
		{/if}
	</div>
{/if}
