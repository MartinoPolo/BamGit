<script lang="ts">
	import type { Issue } from '$lib/modules/issues';
	import type { GitStatusCache } from '$lib/types/generated';
	import type { TreeVisualization } from '$lib/modules/visualization';
	import {
		deriveContextualActions,
		type ActionId,
		type ContextualActionInput,
	} from '$lib/modules/contextual-actions';
	import { useSelection } from '$lib/modules/board';
	import {
		setIssueCardContext,
		type SessionStateProp,
		ISSUE_CARD_SETTING_DEFAULTS,
		type IssueCardAppearanceSettings,
	} from './index.js';
	import { getHoveredPrdNumber } from './prd_hover_store.svelte.js';
	import {
		ADOPT_ACTION_VALUES,
		ADOPT_SPLIT_BUTTON_OPTIONS,
		ADOPT_SETTINGS_KEY,
	} from './ghost_card_utils.js';
	import SplitButton from '$lib/components/derived/split-button/SplitButton.svelte';
	import IssueCardHeader from './IssueCardHeader.svelte';
	import IssueCardPreview from './IssueCardPreview.svelte';
	import WorktreeRow from './WorktreeRow.svelte';
	import GitHubStatusRow from './GitHubStatusRow.svelte';
	import IssueLabelsRow from './IssueLabelsRow.svelte';
	import CommandResultsRow from './CommandResultsRow.svelte';
	import ContextualActionButtons from './ContextualActionButtons.svelte';

	interface PrdParent {
		number: number | null;
		url: string | null;
	}

	interface Props {
		issue: Issue;
		cache?: GitStatusCache | null;
		ghAvailable?: boolean;
		isGhost?: boolean;
		notificationDotColor?: string | null;
		prdParent?: PrdParent | null;
		prioritiesEnabled?: boolean;
		sessionState?: SessionStateProp;
		visualization?: TreeVisualization | undefined;
		appearanceSettings?: IssueCardAppearanceSettings;
		onExecuteAction?: (actionId: string, issueId: string) => void;
		onPriorityClick?: () => void;
		onQuickActionAssignFolder?: (issueId: string) => void;
		onAdoptNoWorktree?: (issueId: string) => void;
		onAdoptWithWorktree?: (issueId: string) => void;
	}

	let {
		issue,
		cache = null,
		ghAvailable = false,
		isGhost = false,
		notificationDotColor = null,
		prdParent = null,
		prioritiesEnabled = true,
		sessionState = null,
		visualization,
		appearanceSettings = { ...ISSUE_CARD_SETTING_DEFAULTS },
		onExecuteAction,
		onPriorityClick,
		onQuickActionAssignFolder,
		onAdoptNoWorktree,
		onAdoptWithWorktree,
	}: Props = $props();

	const selection = useSelection();

	const ctx = setIssueCardContext(() => ({
		issue,
		cache,
		ghAvailable,
		isGhost,
		notificationDotColor,
		prdParent,
		prioritiesEnabled,
		sessionState,
		visualization,
		appearanceSettings,
		isActive: selection.activeIssueId === issue.id,
		isHovered: selection.hoveredIssueId === issue.id,
		isBatchSelected: selection.batchSelectedIssueIds.has(issue.id),
		isModifierHeld: selection.isModifierHeld,
		onTitleClick: () => selection.activateIssue(issue.id),
		onExecuteAction,
		onPriorityClick,
		onQuickActionAssignFolder,
	}));

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

	function handleAdoptSelect(value: string) {
		if (value === ADOPT_ACTION_VALUES.WITH_WORKTREE && onAdoptWithWorktree) {
			onAdoptWithWorktree(issue.id);
		} else if (value === ADOPT_ACTION_VALUES.NO_WORKTREE && onAdoptNoWorktree) {
			onAdoptNoWorktree(issue.id);
		}
	}

	const isPrdHighlighted = $derived.by(() => {
		const hovered = getHoveredPrdNumber();
		return hovered !== null && ctx.prdParent?.number === hovered;
	});
</script>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
	data-testid="issue-card"
	data-card-state={ctx.cardState}
	data-session-overlay={ctx.sessionOverlay}
	class="{ctx.slotClasses.card} {isPrdHighlighted ? 'ring-2 ring-offset-2 ring-primary/25' : ''}"
	style={ctx.cardStyleString}
	onclick={(event) => selection.handleCardClick(issue.id, event)}
	onmouseenter={() => selection.hoverIssue(issue.id)}
	onmouseleave={() => selection.unhover()}
>
	{#if ctx.cardState === 'selected' || ctx.cardState === 'selectionHover' || ctx.cardState === 'active'}
		<div
			class="pointer-events-none absolute inset-0 z-1 rounded-lg"
			style="background: color-mix(in oklch, {ctx.color} {ctx.cardState === 'active'
				? '10'
				: '8'}%, transparent);"
		></div>
	{/if}

	{#if ctx.sessionOverlay}
		<div
			class="pointer-events-none absolute inset-0 z-1 rounded-lg"
			style="background: color-mix(in oklch, var(--ic-session-tint, transparent) 8%, transparent);"
		></div>
	{/if}

	<IssueCardHeader />

	<!-- Body: tree thumbnail | info -->
	<div class="grid items-start gap-2.5 p-2.5 pr-3" style="grid-template-columns: 100px 1fr;">
		<IssueCardPreview />

		<div class="flex min-w-0 flex-col gap-1">
			<WorktreeRow />
			<GitHubStatusRow />
			<IssueLabelsRow />
			<CommandResultsRow />
		</div>
	</div>

	<!-- Contextual action buttons -->
	{#if !ctx.isArchived && !ctx.isGhost && onExecuteAction}
		<div class="absolute bottom-2 right-2.5 flex items-center gap-1">
			<ContextualActionButtons
				derivedActions={contextualActions}
				onExecute={handleContextualAction}
			/>
		</div>
	{/if}

	<!-- Ghost card adopt split-button -->
	{#if ctx.isGhost && (onAdoptNoWorktree || onAdoptWithWorktree)}
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<div class="absolute bottom-2 right-2.5" onclick={(event) => event.stopPropagation()}>
			<SplitButton
				options={ADOPT_SPLIT_BUTTON_OPTIONS}
				defaultValue={ADOPT_ACTION_VALUES.WITH_WORKTREE}
				settingsKey={ADOPT_SETTINGS_KEY}
				size="sm"
				onselect={handleAdoptSelect}
			/>
		</div>
	{/if}
</div>
