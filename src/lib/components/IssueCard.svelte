<script lang="ts">
	import * as m from '$lib/paraglide/messages.js';
	import type { Issue, IssuePriority } from '$lib/modules/issues';
	import type { Action, GitStatusCache } from '$lib/types/generated';
	import type { IssueCardCallbacks } from '$lib/modules/issues';
	import PullRequestBadge from './PullRequestBadge.svelte';
	import GitHubIssueBadge from './GitHubIssueBadge.svelte';
	import SyncStatusIndicator from './SyncStatusIndicator.svelte';
	import GitBadgeGroup from './GitBadgeGroup.svelte';
	import WorktreeProgressIndicator from './WorktreeProgressIndicator.svelte';
	import ActionButtonGroup from './ActionButtonGroup.svelte';
	import { clickOutside } from '$lib/actions/click_outside';

	const PRIORITY_OPTIONS: { value: IssuePriority | null; label: () => string }[] = [
		{ value: 'top', label: () => m.priority_top() },
		{ value: 'high', label: () => m.priority_high() },
		{ value: 'medium', label: () => m.priority_medium() },
		{ value: 'low', label: () => m.priority_low() },
		{ value: 'lowest', label: () => m.priority_lowest() },
		{ value: null, label: () => m.priority_none() },
	];

	const PRIORITY_BORDER_CLASSES = {
		top: 'border-l-red-500',
		high: 'border-l-orange-400',
		medium: 'border-l-yellow-400',
		low: 'border-l-blue-400',
		lowest: 'border-l-gray-400',
	} as const satisfies Record<IssuePriority, string>;

	const PRIORITY_BADGE_CLASSES: Partial<Record<IssuePriority, string>> = {
		top: 'bg-red-900/40 text-red-400',
		high: 'bg-orange-900/40 text-orange-400',
		low: 'bg-blue-900/40 text-blue-400',
		lowest: 'bg-gray-800/40 text-gray-400',
	};

	interface Props extends IssueCardCallbacks {
		issue: Issue;
		actions?: Action[];
		cache?: GitStatusCache | null;
		ghAvailable?: boolean;
		notificationDotColor?: string | null;
		indented?: boolean;
		isLastChild?: boolean;
		childCount?: number;
		forceExpanded?: boolean;
		progressLines?: readonly string[];
	}

	let {
		issue,
		actions = [],
		cache = null,
		ghAvailable = false,
		notificationDotColor = null,
		indented = false,
		isLastChild = false,
		childCount = 0,
		forceExpanded,
		progressLines = [],
		onArchive,
		onUnarchive,
		onEdit,
		onDelete,
		onChangePriority,
		onRename,
		onSetupWorktree,
		onRemoveWorktree,
		onExecuteAction,
	}: Props = $props();

	let localExpanded = $state(false);
	const expanded = $derived(
		forceExpanded ?? (issue.worktree_state === 'pending' || localExpanded),
	);
	let showOverflow = $state(false);
	let showPrioritySubmenu = $state(false);

	const color = $derived(issue.color ?? '#525252');
	const isArchived = $derived(issue.status === 'archived');
	const isStandalone = $derived(issue.github_issue_url === null);

	const worktreeBadge = $derived.by(() => {
		switch (issue.worktree_state) {
			case 'pending':
				return {
					label: m.issue_card_setting_up(),
					class: 'bg-yellow-900/40 text-yellow-400',
				};
			case 'active':
				return { label: m.issue_card_worktree(), class: 'bg-green-900/40 text-green-400' };
			case 'failed':
				return { label: m.issue_card_wt_failed(), class: 'bg-red-900/40 text-red-400' };
			default:
				return null;
		}
	});

	const priorityBorderClass = $derived(
		issue.priority !== null ? PRIORITY_BORDER_CLASSES[issue.priority] : 'border-l-transparent',
	);

	const priorityBadgeClass = $derived(
		issue.priority !== null ? (PRIORITY_BADGE_CLASSES[issue.priority] ?? null) : null,
	);

	function closeOverflow() {
		showOverflow = false;
		showPrioritySubmenu = false;
	}
</script>

<div
	class="group flex rounded border border-l-[3px] border-border transition-colors {priorityBorderClass} {isArchived
		? ''
		: 'hover:border-input'}"
	style={isArchived ? 'filter: grayscale(0.8) opacity(0.7)' : undefined}
	class:ml-6={indented}
>
	{#if indented}
		<div class="relative -ml-6 w-6 shrink-0">
			<div
				class="absolute top-0 left-3 h-1/2 w-px bg-border"
				class:h-full={!isLastChild}
			></div>
			<div class="absolute top-1/2 left-3 h-px w-3 bg-border"></div>
		</div>
	{/if}

	<div class="w-10 shrink-0 rounded-l" style="background-color: {color}">
		<div class="flex h-full items-start justify-center pt-3">
			{#if notificationDotColor}
				<span
					class="h-2.5 w-2.5 animate-pulse rounded-full {notificationDotColor}"
					title={m.issue_card_session_needs_attention()}
				></span>
			{:else}
				<div
					class="h-2 w-2 rounded-full bg-foreground/30"
					title={m.issue_card_session_idle()}
				></div>
			{/if}
		</div>
	</div>

	<div class="flex min-w-0 flex-1 flex-col">
		<div class="flex items-center gap-2 px-3 py-2">
			<button
				onclick={() => (localExpanded = !localExpanded)}
				class="text-xs text-muted-foreground transition-transform {expanded
					? 'rotate-90'
					: ''} hover:text-foreground"
				title={expanded ? 'Collapse' : 'Expand'}
			>
				▸
			</button>

			<div class="min-w-0 flex-1">
				<div class="flex items-center gap-1.5">
					<span class="truncate text-sm font-medium">{issue.name}</span>
					{#if priorityBadgeClass}
						<span
							class="shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium leading-3 {priorityBadgeClass}"
						>
							{issue.priority}
						</span>
					{/if}
				</div>
				{#if issue.labels.length > 0}
					<div class="mt-0.5 flex flex-wrap gap-1">
						{#each issue.labels as label (label.name)}
							<span
								class="inline-block rounded-full px-1.5 py-px text-[10px] font-medium leading-3"
								style="background-color: {label.color}33; color: {label.color}; border: 1px solid {label.color}44;"
								title={label.name}
							>
								{label.name}
							</span>
						{/each}
					</div>
				{/if}
			</div>

			{#if childCount > 0}
				<span class="rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
					{childCount > 1
						? m.issue_card_children_count({ count: childCount })
						: m.issue_card_child_count({ count: childCount })}
				</span>
			{/if}

			<div class="flex items-center gap-1">
				{#if cache?.github_issue_state}
					<GitHubIssueBadge
						state={cache.github_issue_state}
						url={issue.github_issue_url}
						issueNumber={issue.github_issue_number}
						disabled={!ghAvailable}
					/>
				{:else if issue.github_issue_number}
					<span class="rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
						#{issue.github_issue_number}
					</span>
				{/if}
				{#if cache?.pr_state}
					<PullRequestBadge
						state={cache.pr_state}
						url={cache.pr_url}
						prNumber={cache.pr_number}
						disabled={!ghAvailable}
					/>
				{/if}
				{#if issue.branch_name}
					<GitBadgeGroup branchName={issue.branch_name} gitStatus={cache ?? undefined} />
				{/if}
				{#if worktreeBadge}
					<span
						class="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-xs {worktreeBadge.class}"
					>
						{#if issue.worktree_state === 'pending'}
							<span
								class="inline-block h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent"
							></span>
						{/if}
						{worktreeBadge.label}
					</span>
				{/if}
			</div>

			{#if actions.length > 0 && onExecuteAction && !isArchived}
				<div class="opacity-0 transition-opacity group-hover:opacity-100">
					<ActionButtonGroup
						{actions}
						onExecute={(actionId) => onExecuteAction(actionId, issue.id)}
					/>
				</div>
			{/if}

			<!-- Overflow menu -->
			<div class="relative">
				<button
					onclick={() => (showOverflow = !showOverflow)}
					class="rounded p-1 text-muted-foreground opacity-0 transition-opacity hover:bg-muted hover:text-foreground group-hover:opacity-100"
				>
					⋯
				</button>

				{#if showOverflow}
					<div
						class="absolute right-0 z-[var(--z-dropdown)] mt-1 min-w-35 rounded border border-border bg-popover py-1 shadow-lg"
						use:clickOutside={closeOverflow}
					>
						<button
							onclick={() => {
								onEdit(issue);
								closeOverflow();
							}}
							class="w-full px-3 py-1.5 text-left text-sm text-popover-foreground hover:bg-accent"
						>
							{m.issue_card_edit()}
						</button>
						{#if isStandalone && onRename}
							<button
								onclick={() => {
									onRename(issue);
									closeOverflow();
								}}
								class="w-full px-3 py-1.5 text-left text-sm text-popover-foreground hover:bg-accent"
							>
								{m.issue_card_rename()}
							</button>
						{/if}

						<!-- Priority submenu -->
						{#if !isArchived}
							<div class="relative">
								<button
									onclick={() => (showPrioritySubmenu = !showPrioritySubmenu)}
									class="flex w-full items-center justify-between px-3 py-1.5 text-left text-sm text-popover-foreground hover:bg-accent"
								>
									{m.issue_card_priority()}
									<span class="text-xs text-muted-foreground">▸</span>
								</button>
								{#if showPrioritySubmenu}
									<div
										class="absolute top-0 left-full z-[var(--z-dropdown)] ml-1 min-w-28 rounded border border-border bg-popover py-1 shadow-lg"
									>
										{#each PRIORITY_OPTIONS as option (option.value)}
											<button
												onclick={() => {
													onChangePriority(issue.id, option.value);
													closeOverflow();
												}}
												class="w-full px-3 py-1.5 text-left text-sm hover:bg-accent {issue.priority ===
												option.value
													? 'text-foreground font-medium'
													: 'text-popover-foreground'}"
											>
												{option.label()}
											</button>
										{/each}
									</div>
								{/if}
							</div>
						{/if}

						{#if onSetupWorktree && issue.branch_name !== null && (issue.worktree_state === 'none' || issue.worktree_state === 'failed')}
							<button
								onclick={() => {
									onSetupWorktree(issue);
									closeOverflow();
								}}
								class="w-full px-3 py-1.5 text-left text-sm text-green-400 hover:bg-accent"
							>
								{issue.worktree_state === 'failed'
									? m.issue_card_retry_worktree()
									: m.issue_card_add_worktree()}
							</button>
						{/if}
						{#if onRemoveWorktree && issue.worktree_state === 'active'}
							<button
								onclick={() => {
									onRemoveWorktree(issue);
									closeOverflow();
								}}
								class="w-full px-3 py-1.5 text-left text-sm text-orange-400 hover:bg-accent"
							>
								{m.issue_card_remove_worktree()}
							</button>
						{/if}
						{#if isArchived}
							<button
								onclick={() => {
									onUnarchive(issue.id);
									closeOverflow();
								}}
								class="w-full px-3 py-1.5 text-left text-sm text-popover-foreground hover:bg-accent"
							>
								{m.issue_card_unarchive()}
							</button>
						{:else}
							<button
								onclick={() => {
									onArchive(issue);
									closeOverflow();
								}}
								class="w-full px-3 py-1.5 text-left text-sm text-popover-foreground hover:bg-accent"
							>
								{m.issue_card_archive()}
							</button>
						{/if}
						<button
							onclick={() => {
								onDelete(issue);
								closeOverflow();
							}}
							class="w-full px-3 py-1.5 text-left text-sm text-destructive hover:bg-accent"
						>
							{m.issue_card_delete()}
						</button>
					</div>
				{/if}
			</div>
		</div>

		{#if expanded}
			<div class="border-t border-border px-3 py-3 text-xs text-muted-foreground">
				<div class="grid grid-cols-2 gap-2">
					<div>
						<span class="text-muted-foreground/60">{m.issue_card_status()}</span>
						{issue.status}
					</div>
					<div>
						<span class="text-muted-foreground/60">{m.issue_card_worktree_label()}</span
						>
						{issue.worktree_state}
					</div>
					{#if issue.priority}
						<div>
							<span class="text-muted-foreground/60"
								>{m.issue_card_priority_label()}</span
							>
							{issue.priority}
						</div>
					{/if}
					{#if issue.created_at}
						<div>
							<span class="text-muted-foreground/60">{m.issue_card_created()}</span>
							{new Date(issue.created_at).toLocaleDateString()}
						</div>
					{/if}
					{#if cache}
						<div>
							<span class="text-muted-foreground/60">{m.issue_card_synced()}</span>
							<SyncStatusIndicator fetchedAt={cache.fetched_at} />
						</div>
					{/if}
				</div>
				{#if issue.worktree_state === 'pending' && progressLines.length > 0}
					<WorktreeProgressIndicator lines={progressLines} />
				{/if}
			</div>
		{/if}
	</div>
</div>
