<script lang="ts">
	import type { Issue } from '$lib/modules/issues';
	import type { GitStatusCache } from '$lib/types/generated';
	import type { TreeVisualization } from '$lib/modules/visualization';
	import {
		deriveContextualActions,
		type ActionId,
		type ContextualActionInput,
	} from '$lib/modules/contextual-actions';
	import {
		setIssueCardContext,
		type SessionStateProp,
		ISSUE_CARD_SETTING_DEFAULTS,
		type IssueCardAppearanceSettings,
	} from '$lib/modules/issue-card/index.js';
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
		notificationDotColor?: string | null;
		prdParent?: PrdParent | null;
		prioritiesEnabled?: boolean;
		sessionState?: SessionStateProp;
		visualization?: TreeVisualization | undefined;
		appearanceSettings?: IssueCardAppearanceSettings;
		theme?: 'dark' | 'light';
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
		prdParent = null,
		prioritiesEnabled = true,
		sessionState = null,
		visualization,
		appearanceSettings = { ...ISSUE_CARD_SETTING_DEFAULTS },
		theme = 'dark',
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

	const ctx = setIssueCardContext(() => ({
		issue,
		cache,
		ghAvailable,
		notificationDotColor,
		prdParent,
		prioritiesEnabled,
		sessionState,
		visualization,
		appearanceSettings,
		theme,
		isActive,
		isHovered,
		isBatchSelected,
		isModifierHeld,
		onCardClick,
		onTitleClick,
		onMouseEnter,
		onMouseLeave,
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

	function handleCardClick(event: MouseEvent) {
		if (onCardClick) {
			onCardClick(event);
		}
	}

	const variantStyleString = $derived.by(() => {
		const props = ctx.variantCssProperties;
		return Object.entries(props)
			.map(([key, value]) => `${key}: ${value}`)
			.join('; ');
	});
</script>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
	class="group relative overflow-hidden rounded-lg border border-border shadow-sm outline-none transition-shadow duration-150 focus:outline-none focus-visible:outline-none {ctx.cardStateClass} {ctx.isArchived ||
	ctx.isActive ||
	ctx.isHovered ||
	ctx.isBatchSelected
		? ''
		: 'card-ic-interactive'}"
	data-variant={ctx.variant}
	style={variantStyleString}
	onclick={handleCardClick}
	onmouseenter={onMouseEnter}
	onmouseleave={onMouseLeave}
>
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
	{#if !ctx.isArchived && onExecuteAction}
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
