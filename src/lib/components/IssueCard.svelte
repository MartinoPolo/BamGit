<script lang="ts">
	import * as m from '$lib/paraglide/messages.js';
	import type { Issue } from '$lib/modules/issues';
	import type { Action, GitStatusCache } from '$lib/types/generated';
	import { getContrastTextColor } from '$lib/components/color-picker/color_utils.js';
	import GitHubBadge from './GitHubBadge.svelte';
	import SyncStatusIndicator from './SyncStatusIndicator.svelte';
	import SyncBadge from './SyncBadge.svelte';
	import MergeConflictBadge from './MergeConflictBadge.svelte';
	import WorktreeProgressIndicator from './WorktreeProgressIndicator.svelte';
	import ActionButtonGroup from './ActionButtonGroup.svelte';
	import WorktreeStateIcon from './WorktreeStateIcon.svelte';
	import SessionStateChip from './SessionStateChip.svelte';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { SimpleTooltip } from '$lib/components/ui/tooltip/index.js';
	import FolderOpenIcon from '@lucide/svelte/icons/folder-open';
	import TerminalIcon from '@lucide/svelte/icons/terminal';
	import VscodeIcon from './icons/VscodeIcon.svelte';
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
		sessionState?: 'executing' | 'hitl' | 'review' | 'error' | 'paused' | 'done' | null;
		isActive?: boolean;
		isBatchSelected?: boolean;
		onOverflowClick?: () => void;
		onCardClick?: (event: MouseEvent) => void;
		onExecuteAction?: (actionId: string, issueId: string) => void;
		onPriorityClick?: () => void;
		onQuickActionAssignFolder?: (issueId: string) => void;
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
		sessionState = null,
		isActive = false,
		isBatchSelected = false,
		onOverflowClick,
		onCardClick,
		onExecuteAction,
		onPriorityClick,
		onQuickActionAssignFolder,
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

	const worktreeBadge = $derived.by(() => {
		switch (issue.worktree_state) {
			case 'pending':
				return { label: m.issue_card_setting_up(), variant: 'warning' as const };
			case 'active':
				return { label: m.issue_card_worktree(), variant: 'success' as const };
			case 'failed':
				return { label: m.issue_card_wt_failed(), variant: 'danger' as const };
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
		return '';
	});

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
			if (onQuickActionAssignFolder) {
				onQuickActionAssignFolder(issue.id);
			}
			return;
		}
		if (onExecuteAction) {
			onExecuteAction(action, issue.id);
		}
	}

	function handleQuickActionContextMenu(event: MouseEvent) {
		event.preventDefault();
		event.stopPropagation();
		if (onQuickActionAssignFolder) {
			onQuickActionAssignFolder(issue.id);
		}
	}
</script>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
	class="group relative overflow-hidden rounded-lg border border-border shadow-sm outline-none transition-all duration-150 focus:outline-none focus-visible:outline-none {cardStateClass} {isArchived ||
	isActive ||
	isBatchSelected
		? ''
		: 'hover:ring-2 hover:ring-ring-hover active:ring-2 active:ring-ring-active'}"
	style:--ic={color}
	style="background: var(--surface);"
	onclick={handleCardClick}
>
	<!-- Header band -->
	<div
		class="flex min-h-8 items-center justify-between gap-2.5 px-3 py-1.5"
		style="background-color: {color}; color: {headerTextColor};"
	>
		<div class="flex min-w-0 flex-1 items-baseline gap-1.5">
			{#if issue.github_issue_url}
				<!-- eslint-disable svelte/no-navigation-without-resolve -- external GitHub link -->
				<a
					href={issue.github_issue_url}
					target="_blank"
					rel="noopener noreferrer"
					class="shrink-0 font-mono text-[11px] font-semibold opacity-72 hover:opacity-100"
					style="color: inherit;"
					onclick={(event) => event.stopPropagation()}
				>
					#{issue.github_issue_number ?? '—'}
				</a>
				<!-- eslint-enable svelte/no-navigation-without-resolve -->
			{:else}
				<span class="shrink-0 font-mono text-[11px] font-semibold opacity-72">
					#{issue.github_issue_number ?? '—'}
				</span>
			{/if}
			<span class="min-w-0 truncate text-[13.5px] font-semibold leading-snug">
				{issue.name}
			</span>
		</div>

		<div class="flex shrink-0 items-center gap-1.5">
			{#if childCount > 0}
				<span class="flex items-center gap-1 font-mono text-[10px] opacity-72">
					<LayersIcon size={10} />
					{childCount}
				</span>
			{/if}

			{#if sessionState}
				<SessionStateChip state={sessionState} {isLightHeader} />
			{/if}

			{#if priorityBadgeClass && prioritiesEnabled && issue.priority !== 'medium'}
				<SimpleTooltip text="Change priority">
					<button
						class="inline-flex cursor-pointer items-center gap-1 rounded border-none bg-transparent px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase leading-none tracking-wide {priorityChipClass}"
						onclick={(event) => {
							event.stopPropagation();
							if (onPriorityClick) {
								onPriorityClick();
							}
						}}
					>
						{issue.priority}
					</button>
				</SimpleTooltip>
			{/if}

			<!-- Quick-action buttons -->
			<div class="ml-0.5 flex items-center gap-0.5">
				<SimpleTooltip
					text={hasWorktree ? `Open ${issue.branch_name ?? 'folder'}` : 'Assign folder'}
				>
					<Button
						variant="ghost-overlay"
						size="icon-sm"
						class="size-5"
						style="opacity: {hasWorktree ? 0.6 : 0.35}"
						onclick={(event: MouseEvent) => handleQuickAction(event, 'open-folder')}
						oncontextmenu={handleQuickActionContextMenu}
					>
						<FolderOpenIcon size={12} />
					</Button>
				</SimpleTooltip>
				<SimpleTooltip text={hasWorktree ? 'Open Terminal' : 'Assign folder'}>
					<Button
						variant="ghost-overlay"
						size="icon-sm"
						class="size-5"
						style="opacity: {hasWorktree ? 0.6 : 0.35}"
						onclick={(event: MouseEvent) => handleQuickAction(event, 'open-terminal')}
						oncontextmenu={handleQuickActionContextMenu}
					>
						<TerminalIcon size={12} />
					</Button>
				</SimpleTooltip>
				<SimpleTooltip text={hasWorktree ? 'Open Editor' : 'Assign folder'}>
					<Button
						variant="ghost-overlay"
						size="icon-sm"
						class="size-5"
						style="opacity: {hasWorktree ? 0.6 : 0.35}"
						onclick={(event: MouseEvent) => handleQuickAction(event, 'open-editor')}
						oncontextmenu={handleQuickActionContextMenu}
					>
						<VscodeIcon size={12} />
					</Button>
				</SimpleTooltip>
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
			{#if notificationDotColor !== null && sessionState === null}
				<SimpleTooltip text={m.issue_card_session_needs_attention()}>
					<span
						class="absolute top-1.5 right-1.5 size-[7px] animate-pulse rounded-full {notificationDotColor}"
					></span>
				</SimpleTooltip>
			{/if}
			<div class="mb-4 size-6 rounded-full bg-foreground/20"></div>
		</div>

		<!-- Info rows -->
		<div class="flex min-w-0 flex-col gap-1">
			<!-- Row 1: Branch name + worktree state + sync info -->
			<div class="flex min-w-0 flex-wrap items-center gap-1.5">
				<div
					class="flex min-w-0 flex-1 items-center gap-1.5 font-mono text-[11px] text-muted-foreground"
				>
					<GitBranchIcon size={10} class="shrink-0" />
					{#if issue.branch_name}
						<span class="min-w-0 truncate text-foreground/60">
							{issue.branch_name}
						</span>
					{:else}
						<span class="text-foreground/35">no worktree</span>
					{/if}
					<WorktreeStateIcon worktreeState={issue.worktree_state} />
				</div>
				<div class="flex shrink-0 items-center gap-1">
					{#if worktreeBadge}
						<Badge variant={worktreeBadge.variant} size="compact">
							{#if issue.worktree_state === 'pending'}
								<span
									class="inline-block size-3 animate-spin rounded-full border-2 border-current border-t-transparent"
								></span>
							{/if}
							{worktreeBadge.label}
						</Badge>
					{/if}
					{#if cache?.behind_base_count != null}
						<SyncBadge behindBaseCount={cache.behind_base_count} />
					{/if}
					{#if cache?.merge_conflict === true}
						<MergeConflictBadge />
					{/if}
				</div>
			</div>

			<!-- Row 2: GitHub issue badge + PR badge -->
			{#if cache?.github_issue_state != null || cache?.pr_state != null}
				<div class="flex flex-wrap items-center gap-1">
					{#if cache?.github_issue_state}
						<GitHubBadge
							type="issue"
							state={cache.github_issue_state}
							url={issue.github_issue_url}
							number={issue.github_issue_number}
							disabled={!ghAvailable}
						/>
					{/if}
					{#if cache?.pr_state}
						<GitHubBadge
							type="pr"
							state={cache.pr_state}
							url={cache.pr_url}
							number={cache.pr_number}
							disabled={!ghAvailable}
						/>
					{/if}
				</div>
			{/if}

			<!-- Row 3: GitHub issue labels -->
			{#if issue.labels.length > 0}
				<div class="flex flex-wrap items-center gap-1">
					{#each issue.labels as label (label.name)}
						<SimpleTooltip text={label.name}>
							<span
								class="inline-block rounded-full px-1.5 py-px text-[10px] font-medium leading-3"
								style="background-color: {label.color}33; color: {label.color}; border: 1px solid {label.color}44;"
							>
								{label.name}
							</span>
						</SimpleTooltip>
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
					<span class="text-muted-foreground/60">{m.issue_card_worktree_label()}</span>
					{issue.worktree_state}
				</div>
				{#if issue.priority}
					<div>
						<span class="text-muted-foreground/60">{m.issue_card_priority_label()}</span
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

	<!-- Action buttons (always visible, bottom-right) -->
	{#if actions.length > 0 && onExecuteAction && !isArchived}
		<div class="absolute bottom-2 right-2.5 flex items-center gap-1">
			<ActionButtonGroup
				{actions}
				onExecute={(actionId) => onExecuteAction(actionId, issue.id)}
			/>
			{#if onOverflowClick}
				<SimpleTooltip text="More actions">
					<Button
						variant="secondary"
						size="icon-sm"
						class="h-[22px] w-auto px-1.5"
						onclick={(event: MouseEvent) => {
							event.stopPropagation();
							onOverflowClick();
						}}
					>
						<MoreHorizontalIcon size={10} />
					</Button>
				</SimpleTooltip>
			{/if}
		</div>
	{/if}
</div>
