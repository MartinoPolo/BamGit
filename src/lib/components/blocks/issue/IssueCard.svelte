<script lang="ts">
	import * as m from '$lib/paraglide/messages.js';
	import { useIssues, type Issue } from '$lib/modules/issues';
	import type { GitStatusCache } from '$lib/types/generated';
	import {
		deriveContextualActions,
		type ActionId,
		type ContextualActionInput,
	} from '$lib/modules/contextual-actions';
	import { getContrastTextColor } from '$lib/components/derived/color-picker/color_utils.js';
	import GitHubBadge from '$lib/components/derived/github-badge/GitHubBadge.svelte';
	import SyncBadge from '$lib/components/derived/sync-badge/SyncBadge.svelte';
	import MergeConflictBadge from '$lib/components/derived/merge-conflict-badge/MergeConflictBadge.svelte';
	import ContextualActionButtons from './ContextualActionButtons.svelte';
	import SessionStateChip from '$lib/components/derived/session-state-chip/SessionStateChip.svelte';
	import { Badge } from '$lib/components/shadcn/badge/index.js';
	import { Button } from '$lib/components/shadcn/button/index.js';
	import { WithTooltip } from '$lib/components/shadcn/tooltip/index.js';
	import FolderIcon from '@lucide/svelte/icons/folder';
	import TerminalIcon from '@lucide/svelte/icons/terminal';
	import VscodeIcon from '$lib/components/derived/icons/VscodeIcon.svelte';
	import LayersIcon from '@lucide/svelte/icons/layers';
	import GitBranchIcon from '@lucide/svelte/icons/git-branch';
	import Volume2Icon from '@lucide/svelte/icons/volume-2';
	import VolumeXIcon from '@lucide/svelte/icons/volume-x';
	import { invoke } from '$lib/tauri.js';
	import { CARD_STATE_CLASSES } from './batch_selection_utils.js';
	import { PRIORITY_BADGE_CLASSES } from './issue_card_utils.js';
	import type { TreeVisualization } from '$lib/modules/visualization';
	import TreeThumbnailImage from '$lib/components/blocks/forest/TreeThumbnailImage.svelte';

	interface PrdParent {
		number: number | null;
		url: string | null;
	}

	interface Props {
		issue: Issue;
		cache?: GitStatusCache | null;
		ghAvailable?: boolean;
		notificationDotColor?: string | null;
		childCount?: number;
		prdParent?: PrdParent | null;
		prioritiesEnabled?: boolean;
		sessionState?: 'executing' | 'hitl' | 'review' | 'error' | 'paused' | 'done' | null;
		visualization?: TreeVisualization | undefined;
		isActive?: boolean;
		isHovered?: boolean;
		isBatchSelected?: boolean;
		isModifierHeld?: boolean;
		onCardClick?: (event: MouseEvent) => void;
		onTitleClick?: (event: MouseEvent) => void;
		onMouseEnter?: () => void;
		onMouseLeave?: () => void;
		onExecuteAction?: (actionId: string, issueId: string) => void;
		onPriorityClick?: () => void;
		onQuickActionAssignFolder?: (issueId: string) => void;
	}

	let {
		issue,
		cache = null,
		ghAvailable = false,
		notificationDotColor = null,
		childCount = 0,
		prdParent = null,
		prioritiesEnabled = true,
		sessionState = null,
		visualization,
		isActive = false,
		isHovered = false,
		isBatchSelected = false,
		isModifierHeld = false,
		onCardClick,
		onTitleClick,
		onMouseEnter,
		onMouseLeave,
		onExecuteAction,
		onPriorityClick,
		onQuickActionAssignFolder,
	}: Props = $props();

	const issuesStore = useIssues();

	const color = $derived(issue.color ?? '#525252');
	const headerTextColor = $derived(getContrastTextColor(color));
	const isLightHeader = $derived(headerTextColor === '#000000');
	const isArchived = $derived(issue.status === 'archived');
	const hasWorktree = $derived(
		issue.worktree_state === 'active' || issue.worktree_state === 'pending',
	);

	const hasPrdLabel = $derived(prdParent !== null && prdParent.number !== null);

	const worktreeBadge = $derived.by(() => {
		switch (issue.worktree_state) {
			case 'pending':
				return { label: m.issue_card_setting_up(), tone: 'warning' as const };
			case 'active':
				return { label: m.issue_card_worktree(), tone: 'success' as const };
			case 'failed':
				return { label: m.issue_card_wt_failed(), tone: 'danger' as const };
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
		if (isHovered) {
			return isModifierHeld ? CARD_STATE_CLASSES.selectionHover : CARD_STATE_CLASSES.hovered;
		}
		return '';
	});

	const priorityChipClass = $derived(
		isLightHeader ? 'bg-white/22 text-black/80' : 'bg-black/18 text-inherit',
	);

	// fallow-ignore-next-line complexity
	const contextualActions = $derived.by(() => {
		const input: ContextualActionInput = {
			worktreeState: issue.worktree_state,
			sessionState,
			prState: cache?.pr_state ?? null,
			hasLocalChanges: cache?.has_local_changes ?? false,
			aheadRemoteCount: cache?.ahead_remote_count ?? 0,
			behindBaseCount: cache?.behind_base_count ?? 0,
			mergeConflict: cache?.merge_conflict ?? false,
			labels: issue.labels,
		};
		return deriveContextualActions(input);
	});

	function handleContextualAction(actionId: ActionId) {
		if (onExecuteAction) {
			onExecuteAction(actionId, issue.id);
		}
	}

	function handleCardClick(event: MouseEvent) {
		if (onCardClick) {
			onCardClick(event);
		}
	}

	function handleTitleClick(event: MouseEvent) {
		event.stopPropagation();
		if (onTitleClick) {
			onTitleClick(event);
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

	async function handleToggleMute(event: MouseEvent) {
		event.stopPropagation();
		try {
			await invoke('toggle_issue_sound_mute', { issueId: issue.id });
			issuesStore.patchIssueLocal(issue.id, { is_sound_muted: !issue.is_sound_muted });
		} catch (error) {
			console.error('Failed to toggle mute:', error);
		}
	}
</script>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
	class="group relative overflow-hidden rounded-lg border border-border bg-surface shadow-sm outline-none transition-shadow duration-150 focus:outline-none focus-visible:outline-none {cardStateClass} {isArchived ||
	isActive ||
	isHovered ||
	isBatchSelected
		? ''
		: 'card-ic-interactive'}"
	style:--ic={color}
	onclick={handleCardClick}
	onmouseenter={onMouseEnter}
	onmouseleave={onMouseLeave}
>
	<!-- Header band -->
	<div
		class="flex min-h-8 items-center justify-between gap-2.5 px-3 py-1.5"
		style="background-color: {color}; color: {headerTextColor}; filter: saturate(var(--header-saturate, 1));"
	>
		<div class="flex min-w-0 flex-1 items-baseline gap-1.5">
			<span class="shrink-0 font-mono text-[11px] font-semibold opacity-72">
				{#if hasPrdLabel && prdParent?.url}
					<!-- eslint-disable svelte/no-navigation-without-resolve -- external GitHub link -->
					<a
						href={prdParent.url}
						target="_blank"
						rel="noopener noreferrer"
						class="hover:opacity-100"
						style="color: inherit;"
						onclick={(event) => event.stopPropagation()}>PRD#{prdParent.number}</a
					>
					<!-- eslint-enable svelte/no-navigation-without-resolve -->
					<span class="opacity-50">/</span>
				{:else if hasPrdLabel && prdParent}
					PRD#{prdParent.number}
					<span class="opacity-50">/</span>
				{/if}
				{#if issue.github_issue_url}
					<!-- eslint-disable svelte/no-navigation-without-resolve -- external GitHub link -->
					<a
						href={issue.github_issue_url}
						target="_blank"
						rel="noopener noreferrer"
						class="hover:opacity-100"
						style="color: inherit;"
						onclick={(event) => event.stopPropagation()}
						>#{issue.github_issue_number ?? '—'}</a
					>
					<!-- eslint-enable svelte/no-navigation-without-resolve -->
				{:else}
					#{issue.github_issue_number ?? '—'}
				{/if}
			</span>
			<!-- svelte-ignore a11y_click_events_have_key_events -->
			<!-- svelte-ignore a11y_no_static_element_interactions -->
			<span
				class="min-w-0 truncate text-[13.5px] font-semibold leading-snug {onTitleClick
					? 'cursor-pointer hover:underline'
					: ''}"
				onclick={handleTitleClick}
			>
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
				<WithTooltip text="Change priority">
					<button
						class="inline-flex h-4.5 cursor-pointer items-center gap-1 rounded border-none bg-transparent px-1.5 font-mono text-[9px] font-bold uppercase leading-none tracking-wide {priorityChipClass}"
						onclick={(event) => {
							event.stopPropagation();
							if (onPriorityClick) {
								onPriorityClick();
							}
						}}
					>
						{issue.priority}
					</button>
				</WithTooltip>
			{/if}

			<!-- Quick-action buttons -->
			<div class="ml-0.5 flex items-center gap-0.5">
				<WithTooltip
					text={hasWorktree ? `Open ${issue.branch_name ?? 'folder'}` : 'Assign folder'}
				>
					<Button
						intent="ghost-overlay"
						size="icon-sm"
						style="opacity: {hasWorktree ? 0.6 : 0.35}"
						onclick={(event: MouseEvent) => handleQuickAction(event, 'open-folder')}
						oncontextmenu={handleQuickActionContextMenu}
					>
						<FolderIcon strokeWidth={1.7} data-icon="inline-end" />
					</Button>
				</WithTooltip>
				<WithTooltip text={hasWorktree ? 'Open Terminal' : 'Assign folder'}>
					<Button
						intent="ghost-overlay"
						size="icon-sm"
						style="opacity: {hasWorktree ? 0.6 : 0.35}"
						onclick={(event: MouseEvent) => handleQuickAction(event, 'open-terminal')}
						oncontextmenu={handleQuickActionContextMenu}
					>
						<TerminalIcon strokeWidth={1.7} data-icon="inline-end" />
					</Button>
				</WithTooltip>
				<WithTooltip text={hasWorktree ? 'Open Editor' : 'Assign folder'}>
					<Button
						intent="ghost-overlay"
						size="icon-sm"
						style="opacity: {hasWorktree ? 0.6 : 0.35}"
						onclick={(event: MouseEvent) => handleQuickAction(event, 'open-editor')}
						oncontextmenu={handleQuickActionContextMenu}
					>
						<VscodeIcon data-icon="inline-end" />
					</Button>
				</WithTooltip>

				<!-- Character mute toggle -->
				<WithTooltip
					text={issue.is_sound_muted
						? 'Unmute sounds for this issue'
						: 'Mute sounds for this issue'}
				>
					<Button
						intent="ghost-overlay"
						size="icon-sm"
						style="opacity: {issue.is_sound_muted ? 0.35 : 0.6}"
						onclick={handleToggleMute}
					>
						{#if issue.is_sound_muted}
							<VolumeXIcon strokeWidth={1.7} data-icon="inline-start" />
						{:else}
							<Volume2Icon strokeWidth={1.7} data-icon="inline-start" />
						{/if}
					</Button>
				</WithTooltip>
			</div>
		</div>
	</div>

	<!-- Body: tree thumbnail | info -->
	<div class="grid items-start gap-2.5 p-2.5 pr-3" style="grid-template-columns: 100px 1fr;">
		<!-- Tree thumbnail -->
		<div
			class="relative flex size-25 shrink-0 items-end justify-center overflow-hidden rounded-1.75 border"
			style="background: linear-gradient(180deg, color-mix(in oklch, {color} var(--tree-bg-mix), var(--surface-2, hsl(0 0% 12%))) 0%, color-mix(in oklch, {color} 5%, var(--surface-3, hsl(0 0% 10%))) 100%); border-color: color-mix(in oklch, {color} 20%, var(--border));"
		>
			{#if notificationDotColor !== null && sessionState === null}
				<WithTooltip text={m.issue_card_session_needs_attention()}>
					<span
						class="absolute top-1.5 right-1.5 z-10 size-1.75 animate-pulse rounded-full {notificationDotColor}"
					></span>
				</WithTooltip>
			{/if}
			{#if visualization}
				<div
					class="absolute inset-0"
					style="transform: scale(1.4); transform-origin: bottom center;"
				>
					<TreeThumbnailImage {visualization} />
				</div>
			{:else}
				<div class="mb-4 size-6 rounded-full bg-foreground/20"></div>
			{/if}
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
				</div>
				<div class="flex shrink-0 items-center gap-1">
					{#if worktreeBadge}
						<Badge tone={worktreeBadge.tone} size="compact">
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
			<div class="flex min-h-5.5 flex-wrap items-center gap-1">
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

			<!-- Row 3: GitHub issue labels (compacted: show first 3 + overflow count) -->
			{#if issue.labels.length > 0}
				{@const maxVisible = 3}
				{@const visibleLabels = issue.labels.slice(0, maxVisible)}
				{@const overflowCount = issue.labels.length - maxVisible}
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
						<WithTooltip
							text={issue.labels
								.slice(maxVisible)
								.map((l) => l.name)
								.join(', ')}
						>
							<span
								class="inline-block rounded-full border border-border px-1.5 py-px text-[10px] font-medium leading-3 text-muted-foreground"
							>
								+{overflowCount}
							</span>
						</WithTooltip>
					{/if}
				</div>
			{/if}
		</div>
	</div>

	<!-- Contextual action buttons (always visible, bottom-right) -->
	{#if !isArchived && onExecuteAction}
		<div class="absolute bottom-2 right-2.5 flex items-center gap-1">
			<ContextualActionButtons
				derivedActions={contextualActions}
				onExecute={handleContextualAction}
			/>
		</div>
	{/if}
</div>

<style>
	/* stylelint-disable selector-pseudo-class-no-unknown */
	:global(.card-ic-interactive):hover,
	:global(.card-state-hovered-ic) {
		box-shadow:
			inset 0 0 0 2px color-mix(in oklch, var(--ic) 40%, transparent),
			var(--shadow-md);
	}

	:global(.card-state-selection-hover) {
		box-shadow: var(--shadow-md);
		background: color-mix(in srgb, var(--selection) 10%, var(--surface));
	}

	:global(.card-state-selection-hover)::after {
		content: '';
		position: absolute;
		inset: 0;
		border-radius: inherit;
		border: 2px solid color-mix(in oklch, var(--ic) 45%, transparent);
		pointer-events: none;
		z-index: 10;
	}

	:global(.card-state-active-ic) {
		box-shadow:
			0 0 0 3px var(--surface),
			0 0 0 5px color-mix(in oklch, var(--ic) 50%, transparent),
			0 0 18px color-mix(in oklch, var(--ic) 25%, transparent);
		background: color-mix(in oklch, oklch(0.55 0.08 55) 10%, var(--surface));
	}

	:global(.card-state-active-ic)::after {
		content: '';
		position: absolute;
		inset: 0;
		border-radius: inherit;
		border: 3px solid color-mix(in oklch, var(--ic) 65%, transparent);
		pointer-events: none;
		z-index: 10;
	}

	:global(.card-state-selected-primary) {
		box-shadow: 0 0 18px color-mix(in oklch, var(--ic) 25%, transparent);
		background: color-mix(in srgb, var(--selection) 18%, var(--surface));
	}

	:global(.card-state-selected-primary)::after {
		content: '';
		position: absolute;
		inset: 0;
		border-radius: inherit;
		border: 3px solid color-mix(in oklch, var(--ic) 65%, transparent);
		pointer-events: none;
		z-index: 10;
	}
</style>
