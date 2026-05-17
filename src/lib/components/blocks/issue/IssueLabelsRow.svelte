<script lang="ts">
	import { useIssueCard } from '$lib/modules/issue-card/index.js';
	import { Badge } from '$lib/components/shadcn/badge/index.js';
	import { SimpleTooltip } from '$lib/components/shadcn/tooltip/index.js';
	import { computeLabelOverflow, MAX_VISIBLE_LABELS } from './label_overflow.js';

	const ctx = useIssueCard();

	const visibleLabels = $derived(ctx.issue.labels.slice(0, MAX_VISIBLE_LABELS));
	const overflow = $derived(computeLabelOverflow(ctx.issue.labels.length));
	const tintHex = $derived(
		Math.round((ctx.appearanceSettings.labelTint / 100) * 255)
			.toString(16)
			.padStart(2, '0'),
	);
</script>

{#if ctx.issue.labels.length > 0}
	<div class="flex flex-wrap items-center gap-1">
		{#each visibleLabels as label (label.name)}
			<Badge
				size="compact"
				class="rounded-full py-px leading-3"
				style="background-color: {label.color}{tintHex}; color: {label.color}; border-color: {label.color}44;"
			>
				{label.name}
			</Badge>
		{/each}
		{#if overflow.overflowCount > 0}
			<SimpleTooltip
				text={ctx.issue.labels
					.slice(MAX_VISIBLE_LABELS)
					.map((l) => l.name)
					.join(', ')}
			>
				<span
					class="inline-block rounded-full border border-border px-1.5 py-px text-[10px] font-medium leading-3 text-muted-foreground"
				>
					+{overflow.overflowCount}
				</span>
			</SimpleTooltip>
		{/if}
	</div>
{/if}
