<script lang="ts">
	import { useIssueCard } from './index.js';
	import SyncBadge from '$lib/components/derived/sync-badge/SyncBadge.svelte';
	import MergeConflictBadge from '$lib/components/derived/merge-conflict-badge/MergeConflictBadge.svelte';
	import { Badge } from '$lib/components/shadcn/badge/index.js';
	import TreePineIcon from '@lucide/svelte/icons/tree-pine';
	import GitBranchIcon from '@lucide/svelte/icons/git-branch';

	const ctx = useIssueCard();

	const worktreeFolderName = $derived.by(() => {
		const folder = ctx.issue.worktree_folder;
		if (!folder) {
			return null;
		}
		const normalized = folder.replace(/\\/g, '/').replace(/\/+$/, '');
		const lastSlash = normalized.lastIndexOf('/');
		return lastSlash >= 0 ? normalized.slice(lastSlash + 1) : normalized;
	});

	const strippedBranchName = $derived.by(() => {
		const branch = ctx.issue.branch_name;
		if (!branch) {
			return null;
		}
		return branch.replace(/^(feat|fix|refactor|chore)\//, '');
	});
</script>

<div class="flex min-w-0 flex-wrap items-center gap-1.5">
	<div class="flex min-w-0 flex-1 items-center gap-1 font-mono text-[11px] text-muted-foreground">
		{#if ctx.hasWorktree && worktreeFolderName}
			<TreePineIcon size={10} class="shrink-0" />
			<span class="min-w-0 truncate text-foreground/60">{worktreeFolderName}/</span>
			<GitBranchIcon size={10} class="shrink-0 ml-0.5" />
			<span class="min-w-0 truncate text-foreground/60">{strippedBranchName}</span>
		{:else if ctx.issue.branch_name}
			<GitBranchIcon size={10} class="shrink-0" />
			<span class="min-w-0 truncate text-foreground/60">{strippedBranchName}</span>
		{:else}
			<GitBranchIcon size={10} class="shrink-0" />
			<span class="text-foreground/35">no worktree</span>
		{/if}
	</div>
	<div class="flex shrink-0 items-center gap-1">
		{#if ctx.worktreeBadge && ctx.issue.worktree_state !== 'active'}
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
