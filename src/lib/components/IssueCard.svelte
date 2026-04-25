<script lang="ts">
	import type { Issue } from '$lib/types/issue';
	import type { Action } from '$lib/types/action';
	import type { GitHubStatusCache } from '$lib/types/github';
	import type { GitStatusCache } from '$lib/types/git_status';
	import type { IssueCardCallbacks } from '$lib/types/issue_card_callbacks';
	import PullRequestBadge from './PullRequestBadge.svelte';
	import GitHubIssueBadge from './GitHubIssueBadge.svelte';
	import SyncStatusIndicator from './SyncStatusIndicator.svelte';
	import GitBadgeGroup from './GitBadgeGroup.svelte';
	import WorktreeProgressIndicator from './WorktreeProgressIndicator.svelte';
	import ActionButtonGroup from './ActionButtonGroup.svelte';

	interface Props extends IssueCardCallbacks {
		issue: Issue;
		actions?: Action[];
		github_cache?: GitHubStatusCache | null;
		gh_available?: boolean;
		git_status?: GitStatusCache | undefined;
		notification_dot_color?: string | null;
		indented?: boolean;
		is_last_child?: boolean;
		child_count?: number;
		force_expanded?: boolean;
		progress_lines?: readonly string[];
	}

	let {
		issue,
		actions = [],
		github_cache = null,
		gh_available = false,
		git_status,
		notification_dot_color = null,
		indented = false,
		is_last_child = false,
		child_count = 0,
		force_expanded,
		progress_lines = [],
		on_archive,
		on_unarchive,
		on_edit,
		on_delete,
		on_setup_worktree,
		on_remove_worktree,
		on_execute_action,
	}: Props = $props();

	let local_expanded = $state(false);
	// Auto-expand when worktree is being set up so progress is visible
	const expanded = $derived(
		force_expanded ?? (issue.worktree_state === 'pending' || local_expanded),
	);
	let show_overflow = $state(false);

	const color = $derived(issue.color ?? '#525252');
	const is_archived = $derived(issue.status === 'archived');

	const worktree_badge = $derived.by(() => {
		switch (issue.worktree_state) {
			case 'pending':
				return { label: 'Setting up...', class: 'bg-yellow-900/40 text-yellow-400' };
			case 'active':
				return { label: 'Worktree', class: 'bg-green-900/40 text-green-400' };
			case 'failed':
				return { label: 'WT Failed', class: 'bg-red-900/40 text-red-400' };
			default:
				return null;
		}
	});

	const priority_border_class = $derived.by(() => {
		switch (issue.priority) {
			case 'top':
				return 'border-l-red-500';
			case 'high':
				return 'border-l-orange-400';
			case 'medium':
				return 'border-l-yellow-400';
			case 'low':
				return 'border-l-blue-400';
			default:
				return 'border-l-transparent';
		}
	});
</script>

<div
	class="group flex rounded border border-l-[3px] border-border transition-colors {priority_border_class} {is_archived
		? 'opacity-50'
		: 'hover:border-input'}"
	class:ml-6={indented}
>
	<!-- Tree connector for nested children -->
	{#if indented}
		<div class="relative -ml-6 w-6 flex-shrink-0">
			<div
				class="absolute top-0 left-3 h-1/2 w-px bg-border"
				class:h-full={!is_last_child}
			></div>
			<div class="absolute top-1/2 left-3 h-px w-3 bg-border"></div>
		</div>
	{/if}

	<!-- Color identity strip -->
	<div class="w-10 flex-shrink-0 rounded-l" style="background-color: {color}">
		<div class="flex h-full items-start justify-center pt-3">
			{#if notification_dot_color}
				<span
					class="h-2.5 w-2.5 animate-pulse rounded-full {notification_dot_color}"
					title="Session needs attention"
				></span>
			{:else}
				<div
					class="h-2 w-2 rounded-full bg-foreground/30"
					title="Session state: idle"
				></div>
			{/if}
		</div>
	</div>

	<!-- Content area -->
	<div class="flex min-w-0 flex-1 flex-col">
		<!-- Header -->
		<div class="flex items-center gap-2 px-3 py-2">
			<button
				onclick={() => (local_expanded = !local_expanded)}
				class="text-xs text-muted-foreground transition-transform {expanded
					? 'rotate-90'
					: ''} hover:text-foreground"
				title={expanded ? 'Collapse' : 'Expand'}
			>
				▸
			</button>

			<span class="min-w-0 flex-1 truncate text-sm font-medium">{issue.name}</span>

			<!-- Child count for parent issues -->
			{#if child_count > 0}
				<span class="rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
					{child_count} child{child_count > 1 ? 'ren' : ''}
				</span>
			{/if}

			<!-- GitHub & git badges -->
			<div class="flex items-center gap-1">
				{#if github_cache?.github_issue_state}
					<GitHubIssueBadge
						state={github_cache.github_issue_state}
						url={issue.github_issue_url}
						issue_number={issue.github_issue_number}
						disabled={!gh_available}
					/>
				{:else if issue.github_issue_number}
					<span class="rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
						#{issue.github_issue_number}
					</span>
				{/if}
				{#if github_cache?.pr_state}
					<PullRequestBadge
						state={github_cache.pr_state}
						url={github_cache.pr_url}
						pr_number={github_cache.pr_number}
						disabled={!gh_available}
					/>
				{/if}
				{#if issue.branch_name}
					<GitBadgeGroup branch_name={issue.branch_name} {git_status} />
				{/if}
				{#if worktree_badge}
					<span
						class="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-xs {worktree_badge.class}"
					>
						{#if issue.worktree_state === 'pending'}
							<span
								class="inline-block h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent"
							></span>
						{/if}
						{worktree_badge.label}
					</span>
				{/if}
			</div>

			<!-- Action buttons -->
			{#if actions.length > 0 && on_execute_action && !is_archived}
				<div class="opacity-0 transition-opacity group-hover:opacity-100">
					<ActionButtonGroup
						{actions}
						on_execute={(action_id) => on_execute_action(action_id, issue.id)}
					/>
				</div>
			{/if}

			<!-- Overflow menu -->
			<div class="relative">
				<button
					onclick={() => (show_overflow = !show_overflow)}
					class="rounded p-1 text-muted-foreground opacity-0 transition-opacity hover:bg-muted hover:text-foreground group-hover:opacity-100"
				>
					⋯
				</button>

				{#if show_overflow}
					<!-- svelte-ignore a11y_no_static_element_interactions -->
					<div
						class="absolute right-0 z-10 mt-1 min-w-[140px] rounded border border-border bg-popover py-1 shadow-lg"
						onmouseleave={() => (show_overflow = false)}
					>
						<button
							onclick={() => {
								on_edit(issue);
								show_overflow = false;
							}}
							class="w-full px-3 py-1.5 text-left text-sm text-popover-foreground hover:bg-accent"
						>
							Edit
						</button>
						{#if on_setup_worktree && issue.branch_name !== null && (issue.worktree_state === 'none' || issue.worktree_state === 'failed')}
							<button
								onclick={() => {
									on_setup_worktree(issue);
									show_overflow = false;
								}}
								class="w-full px-3 py-1.5 text-left text-sm text-green-400 hover:bg-accent"
							>
								{issue.worktree_state === 'failed'
									? 'Retry Worktree'
									: 'Add Worktree'}
							</button>
						{/if}
						{#if on_remove_worktree && issue.worktree_state === 'active'}
							<button
								onclick={() => {
									on_remove_worktree(issue);
									show_overflow = false;
								}}
								class="w-full px-3 py-1.5 text-left text-sm text-orange-400 hover:bg-accent"
							>
								Remove Worktree
							</button>
						{/if}
						{#if is_archived}
							<button
								onclick={() => {
									on_unarchive(issue.id);
									show_overflow = false;
								}}
								class="w-full px-3 py-1.5 text-left text-sm text-popover-foreground hover:bg-accent"
							>
								Unarchive
							</button>
						{:else}
							<button
								onclick={() => {
									on_archive(issue.id);
									show_overflow = false;
								}}
								class="w-full px-3 py-1.5 text-left text-sm text-popover-foreground hover:bg-accent"
							>
								Archive
							</button>
						{/if}
						<button
							onclick={() => {
								on_delete(issue.id);
								show_overflow = false;
							}}
							class="w-full px-3 py-1.5 text-left text-sm text-destructive hover:bg-accent"
						>
							Delete
						</button>
					</div>
				{/if}
			</div>
		</div>

		<!-- Expanded section -->
		{#if expanded}
			<div class="border-t border-border px-3 py-3 text-xs text-muted-foreground">
				<div class="grid grid-cols-2 gap-2">
					<div>
						<span class="text-muted-foreground/60">Status:</span>
						{issue.status}
					</div>
					<div>
						<span class="text-muted-foreground/60">Worktree:</span>
						{issue.worktree_state}
					</div>
					{#if issue.priority}
						<div>
							<span class="text-muted-foreground/60">Priority:</span>
							{issue.priority}
						</div>
					{/if}
					{#if issue.created_at}
						<div>
							<span class="text-muted-foreground/60">Created:</span>
							{new Date(issue.created_at).toLocaleDateString()}
						</div>
					{/if}
					{#if github_cache}
						<div>
							<span class="text-muted-foreground/60">Synced:</span>
							<SyncStatusIndicator fetched_at={github_cache.fetched_at} />
						</div>
					{/if}
				</div>
				{#if issue.worktree_state === 'pending' && progress_lines.length > 0}
					<WorktreeProgressIndicator lines={progress_lines} />
				{/if}
			</div>
		{/if}
	</div>
</div>
