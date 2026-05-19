<script lang="ts">
	import type { StageCounts } from '$lib/modules/board';

	interface Props {
		title: string;
		completionRatio: number;
		issueCount: number;
		stageCounts: StageCounts;
	}

	let { title, completionRatio, issueCount, stageCounts }: Props = $props();

	const completionPercent = $derived(Math.round(completionRatio * 100));
	const stageEntries = $derived(Object.entries(stageCounts).filter(([, count]) => count > 0));
</script>

<div class="flex flex-col gap-4 p-4">
	<div class="flex flex-col gap-1">
		<h2 class="text-lg font-semibold text-foreground">{title}</h2>
		<p class="text-sm text-muted-foreground">
			{issueCount}
			{issueCount === 1 ? 'issue' : 'issues'} · {completionPercent}% complete
		</p>
	</div>

	<div class="flex flex-col gap-1.5">
		<div class="flex items-center justify-between text-xs text-muted-foreground">
			<span>Progress</span>
			<span>{completionPercent}%</span>
		</div>
		<div class="h-2 w-full overflow-hidden rounded-full bg-muted">
			<div
				class="h-full rounded-full bg-primary transition-all duration-5"
				style:width="{completionPercent}%"
			></div>
		</div>
	</div>

	{#if stageEntries.length > 0}
		<div class="flex flex-col gap-2">
			<h3 class="text-xs font-medium text-muted-foreground">Stages</h3>
			<div class="flex flex-wrap gap-1.5">
				{#each stageEntries as [stage, count] (stage)}
					<span
						class="inline-flex items-center gap-1 rounded-md bg-surface-2 px-2 py-0.5 text-xs text-foreground"
					>
						{stage}
						<span class="text-muted-foreground">({count})</span>
					</span>
				{/each}
			</div>
		</div>
	{/if}
</div>
