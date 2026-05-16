<script lang="ts">
	import { useIssueCard } from '$lib/modules/issue-card/index.js';
	import SyncBadge from '$lib/components/derived/sync-badge/SyncBadge.svelte';
	import MergeConflictBadge from '$lib/components/derived/merge-conflict-badge/MergeConflictBadge.svelte';
	import { Badge } from '$lib/components/shadcn/badge/index.js';
	import GitBranchIcon from '@lucide/svelte/icons/git-branch';

	const ctx = useIssueCard();
</script>

<div class="flex min-w-0 flex-wrap items-center gap-1.5">
	<div
		class="flex min-w-0 flex-1 items-center gap-1.5 font-mono text-[11px] text-muted-foreground"
	>
		<GitBranchIcon size={10} class="shrink-0" />
		{#if ctx.issue.branch_name}
			<span class="min-w-0 truncate text-foreground/60">
				{ctx.issue.branch_name}
			</span>
		{:else}
			<span class="text-foreground/35">no worktree</span>
		{/if}
	</div>
	<div class="flex shrink-0 items-center gap-1">
		{#if ctx.worktreeBadge}
			<Badge tone={ctx.worktreeBadge.tone} size="compact">
				{#if ctx.issue.worktree_state === 'pending'}
					<span
						class="inline-block size-3 animate-spin rounded-full border-2 border-current border-t-transparent"
					></span>
				{/if}
				{ctx.worktreeBadge.label}
			</Badge>
		{/if}
		{#if ctx.cache?.behind_base_count != null}
			<SyncBadge behindBaseCount={ctx.cache.behind_base_count} />
		{/if}
		{#if ctx.cache?.merge_conflict === true}
			<MergeConflictBadge />
		{/if}
	</div>
</div>
