<script lang="ts">
	import * as m from '$lib/paraglide/messages.js';
	import type { Issue } from '$lib/modules/issues';
	import type { Action, GitStatusCache } from '$lib/types/generated';
	import { getContrastTextColor } from '$lib/components/color-picker/color_utils.js';
	import PullRequestBadge from './PullRequestBadge.svelte';
	import GitHubIssueBadge from './GitHubIssueBadge.svelte';
	import SyncStatusIndicator from './SyncStatusIndicator.svelte';
	import GitBadgeGroup from './GitBadgeGroup.svelte';
	import WorktreeProgressIndicator from './WorktreeProgressIndicator.svelte';
	import ActionButtonGroup from './ActionButtonGroup.svelte';
	import WorktreeStateIcon from './WorktreeStateIcon.svelte';
	import IssueCardTooltip from './IssueCardTooltip.svelte';
	import FolderOpenIcon from '@lucide/svelte/icons/folder-open';
	import TerminalIcon from '@lucide/svelte/icons/terminal';
	import CodeIcon from '@lucide/svelte/icons/code';
	import MoreHorizontalIcon from '@lucide/svelte/icons/more-horizontal';
	import LayersIcon from '@lucide/svelte/icons/layers';
	import GitBranchIcon from '@lucide/svelte/icons/git-branch';
	import { CARD_STATE_CLASSES } from './batch_selection_utils.js';
	import { PRIORITY_BADGE_CLASSES, issueExpandedStates } from './issue_card_utils.js';

	interface Props {
		issue: Issue;
		actions?: Action[];
		cache?: GitStatusCache | null;
		ghAvailable?: boolean;
		notificationDotColor?: string | null;
		childCount?: number;
		forceExpanded?: boolean;
		progressLines?: readonly string[];
		prioritiesEnabled?: boolean;
		isActive?: boolean;
		isBatchSelected?: boolean;
		isSelectionReady?: boolean;
		onOverflowClick?: () => void;
		onCardClick?: (event: MouseEvent) => void;
		onExecuteAction?: (actionId: string, issueId: string) => void;
	}

	let {
		issue,
		actions = [],
		cache = null,
		ghAvailable = false,
		notificationDotColor = null,
		childCount = 0,
		forceExpanded,
		progressLines = [],
		prioritiesEnabled = true,
		isActive = false,
		isBatchSelected = false,
		isSelectionReady = false,
		onOverflowClick,
		onCardClick,
		onExecuteAction,
	}: Props = $props();

	const color = $derived(issue.color ?? '#525252');
	const headerTextColor = $derived(getContrastTextColor(color));
	const isLightHeader = $derived(headerTextColor === '#000000');
	const isArchived = $derived(issue.status === 'archived');
	const hasWorktree = $derived(
		issue.worktree_state === 'active' || issue.worktree_state === 'pending',
	);

	const persistedExpanded = $derived(issueExpandedStates.current[issue.id] ?? false);
	const expanded = $derived(
		forceExpanded ?? (issue.worktree_state === 'pending' || persistedExpanded),
	);

	let badgeContainerWidth = $state(0);
	const compactBadges = $derived(badgeContainerWidth < 240);

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

	const priorityBadgeClass = $derived(
		issue.priority !== null ? (PRIORITY_BADGE_CLASSES[issue.priority] ?? null) : null,
	);

	const cardStateClass = $derived.by(() => {
		if (isArchived) {
			return CARD_STATE_CLASSES.archived;
		}
		if (isBatchSelected) {
			return CARD_STATE_CLASSES.selected;
		}
		if (isActive) {
			return CARD_STATE_CLASSES.active;
		}
		if (isSelectionReady) {
			return CARD_STATE_CLASSES.selectionReady;
		}
		return '';
	});

	const quickActionButtonClass = $derived(
		isLightHeader
			? 'hover:bg-black/10 text-black/60 hover:text-black/90'
			: 'hover:bg-white/12 text-white/60 hover:text-white/90',
	);

	const priorityChipClass = $derived(
		isLightHeader ? 'bg-white/22 text-black/80' : 'bg-black/18 text-inherit',
	);

	function handleCardClick(event: MouseEvent) {
		if (onCardClick) {
			onCardClick(event);
		}
	}

	function handleQuickAction(event: MouseEvent, action: string) {
		event.stopPropagation();
		if (!hasWorktree) {
			return;
		}
		if (onExecuteAction) {
			onExecuteAction(action, issue.id);
		}
	}
</script>

<IssueCardTooltip {issue}>
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div
		class="group relative overflow-hidden rounded-lg border border-border shadow-sm transition-all duration-150 {cardStateClass} {isArchived
			? ''
			: 'hover:border-[color-mix(in_oklch,var(--ic)_35%,var(--border-strong))] hover:shadow-md hover:bg-[color-mix(in_oklch,var(--ic)_6%,var(--surface))]'}"
		style="

--ic: {color};

 background: var(--surface);"
		onclick={handleCardClick}
	>
		<!-- Header band -->
		<div
			class="flex min-h-8 items-center justify-between gap-2.5 px-3 py-1.5"
			style="background-color: {color}; color: {headerTextColor};"
		>
			<div class="flex min-w-0 flex-1 items-baseline gap-1.5">
				<span class="shrink-0 font-mono text-[11px] font-semibold opacity-72">
					#{issue.github_issue_number ?? '—'}
				</span>
				{#if issue.github_issue_url}
					<!-- eslint-disable svelte/no-navigation-without-resolve -- external GitHub link -->
					<a
						href={issue.github_issue_url}
						target="_blank"
						rel="noopener noreferrer"
						class="min-w-0 truncate text-[13.5px] font-semibold leading-snug hover:underline hover:underline-offset-2"
						style="color: inherit;"
						onclick={(event) => event.stopPropagation()}
					>
						{issue.name}
					</a>
					<!-- eslint-enable svelte/no-navigation-without-resolve -->
				{:else}
					<span class="min-w-0 truncate text-[13.5px] font-semibold leading-snug">
						{issue.name}
					</span>
				{/if}
			</div>

			<div class="flex shrink-0 items-center gap-1.5">
				{#if childCount > 0}
					<span class="flex items-center gap-1 font-mono text-[10px] opacity-72">
						<LayersIcon size={10} />
						{childCount}
					</span>
				{/if}

				{#if priorityBadgeClass && prioritiesEnabled && issue.priority !== 'medium'}
					<span
						class="inline-flex items-center gap-1 rounded px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase leading-none tracking-wide {priorityChipClass}"
					>
						{issue.priority}
					</span>
				{/if}

				<!-- Quick-action buttons -->
				<div class="ml-0.5 flex items-center gap-0.5">
					<button
						class="inline-flex size-5 items-center justify-center rounded border-none bg-transparent p-0 transition-all {quickActionButtonClass}"
						style:opacity={hasWorktree ? 0.6 : 0.35}
						style:pointer-events={hasWorktree ? 'auto' : 'none'}
						title="Open Folder"
						onclick={(event) => handleQuickAction(event, 'open-folder')}
					>
						<FolderOpenIcon size={12} />
					</button>
					<button
						class="inline-flex size-5 items-center justify-center rounded border-none bg-transparent p-0 transition-all {quickActionButtonClass}"
						style:opacity={hasWorktree ? 0.6 : 0.35}
						style:pointer-events={hasWorktree ? 'auto' : 'none'}
						title="Open Terminal"
						onclick={(event) => handleQuickAction(event, 'open-terminal')}
					>
						<TerminalIcon size={12} />
					</button>
					<button
						class="inline-flex size-5 items-center justify-center rounded border-none bg-transparent p-0 transition-all {quickActionButtonClass}"
						style:opacity={hasWorktree ? 0.6 : 0.35}
						style:pointer-events={hasWorktree ? 'auto' : 'none'}
						title="Open Editor"
						onclick={(event) => handleQuickAction(event, 'open-editor')}
					>
						<CodeIcon size={12} />
					</button>
				</div>
			</div>
		</div>

		<!-- Body: tree thumbnail | info -->
		<div class="grid items-start gap-2.5 p-2.5 pr-3" style="grid-template-columns: 72px 1fr;">
			<!-- Tree thumbnail placeholder -->
			<div
				class="relative flex size-[72px] shrink-0 items-end justify-center overflow-hidden rounded-[7px] border"
				style="background: linear-gradient(180deg, color-mix(in oklch, {color} 18%, var(--surface-2, hsl(0 0% 12%))) 0%, color-mix(in oklch, {color} 5%, var(--surface-3, hsl(0 0% 10%))) 100%); border-color: color-mix(in oklch, {color} 20%, var(--border));"
			>
				{#if notificationDotColor}
					<span
						class="absolute top-1.5 right-1.5 size-[7px] animate-pulse rounded-full {notificationDotColor}"
						title={m.issue_card_session_needs_attention()}
					></span>
				{/if}
				<div class="mb-4 size-6 rounded-full bg-foreground/20"></div>
			</div>

			<!-- Info rows -->
			<div class="flex min-w-0 flex-col gap-1">
				<!-- Branch row -->
				<div
					class="flex min-w-0 items-center gap-1.5 font-mono text-[11px] text-muted-foreground"
				>
					<GitBranchIcon size={10} class="shrink-0" />
					{#if issue.branch_name}
						<span class="min-w-0 flex-1 truncate text-foreground/60">
							{issue.branch_name}
						</span>
					{:else}
						<span class="text-foreground/35">no worktree</span>
					{/if}
					<WorktreeStateIcon worktreeState={issue.worktree_state} />
				</div>

				<!-- Status badges row -->
				<div
					class="flex flex-wrap items-center gap-1"
					bind:clientWidth={badgeContainerWidth}
				>
					{#if cache?.github_issue_state}
						<GitHubIssueBadge
							state={cache.github_issue_state}
							url={issue.github_issue_url}
							issueNumber={issue.github_issue_number}
							disabled={!ghAvailable}
						/>
					{/if}
					{#if cache?.pr_state}
						<PullRequestBadge
							state={cache.pr_state}
							url={cache.pr_url}
							prNumber={cache.pr_number}
							disabled={!ghAvailable}
						/>
					{/if}
					{#if issue.branch_name !== null && !compactBadges}
						<GitBadgeGroup
							branchName={issue.branch_name}
							gitStatus={cache ?? undefined}
						/>
					{/if}
					{#if worktreeBadge}
						<span
							class="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-xs {worktreeBadge.class}"
						>
							{#if issue.worktree_state === 'pending'}
								<span
									class="inline-block size-3 animate-spin rounded-full border-2 border-current border-t-transparent"
								></span>
							{/if}
							{worktreeBadge.label}
						</span>
					{/if}
				</div>

				<!-- Labels row -->
				{#if issue.labels.length > 0}
					<div class="flex flex-wrap items-center gap-1">
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
		</div>

		<!-- Expanded detail section -->
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

		<!-- Hover actions (bottom-right corner) -->
		{#if actions.length > 0 && onExecuteAction && !isArchived}
			<div
				class="pointer-events-none absolute bottom-2 right-2.5 flex items-center gap-1 opacity-0 transition-opacity group-hover:pointer-events-auto group-hover:opacity-100"
			>
				<ActionButtonGroup
					{actions}
					onExecute={(actionId) => onExecuteAction(actionId, issue.id)}
				/>
				{#if onOverflowClick}
					<button
						onclick={(event) => {
							event.stopPropagation();
							onOverflowClick();
						}}
						class="inline-flex size-[22px] items-center justify-center rounded-[5px] border border-border bg-[var(--surface-2,hsl(0_0%_12%))] text-muted-foreground transition-colors hover:bg-[var(--surface-3,hsl(0_0%_14%))] hover:border-[var(--border-strong)]"
					>
						<MoreHorizontalIcon size={10} />
					</button>
				{/if}
			</div>
		{/if}
	</div>
</IssueCardTooltip>
