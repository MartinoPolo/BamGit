import { createContext } from 'svelte';
import type { Issue } from '$lib/modules/issues/index.js';
import type { GitStatusCache } from '$lib/types/generated';
import type { TreeVisualization } from '$lib/modules/visualization/types.js';
import type { IssueStateChipResult, WorktreeBadgeResult } from './types.js';
import { deriveIssueStateChipLabel } from './derive_issue_state_chip.js';
import { deriveWorktreeBadge } from './derive_worktree_badge.js';
import { getContrastTextColor } from '$lib/components/derived/color-picker/color_utils.js';
import type { AggregateSessionState } from '$lib/modules/visualization/types.js';
import type { ForestPullRequestState, ForestSyncStatus } from '$lib/modules/visualization/types.js';
import type { SessionOverlay } from './types.js';
import {
	computeVariantSlotStyles,
	styleMapToString,
	type VariantSlotStyles,
} from './issue_card_variant_css.js';
import type { IssueCardAppearanceSettings, IssueCardVariant } from './issue_card_settings.js';
import {
	deriveCardState,
	ISSUE_CARD_CLASSES,
	type IssueCardState,
	type IssueCardSlotClasses,
} from './issue_card_variants.js';

const DEFAULT_ISSUE_COLOR = '#525252';

type IssueCardContext = ReturnType<typeof createIssueCardContext>;

const [useIssueCard, setIssueCardInternal] = createContext<IssueCardContext>();
export { useIssueCard };

export type SessionStateProp = 'executing' | 'hitl' | 'review' | 'error' | 'paused' | 'done' | null;

export interface IssueCardContextProps {
	issue: Issue;
	cache: GitStatusCache | null;
	ghAvailable: boolean;
	notificationDotColor: string | null;
	prdParent: { number: number | null; url: string | null } | null;
	prioritiesEnabled: boolean;
	sessionState: SessionStateProp;
	visualization: TreeVisualization | undefined;
	appearanceSettings: IssueCardAppearanceSettings;
	isGhost?: boolean;
	isActive: boolean;
	isHovered: boolean;
	isBatchSelected: boolean;
	isModifierHeld: boolean;
	onTitleClick?: (event: MouseEvent) => void;
	onExecuteAction?: (actionId: string, issueId: string) => void;
	onPriorityClick?: () => void;
	onQuickActionAssignFolder?: (issueId: string) => void;
}

export function setIssueCardContext(getProps: () => IssueCardContextProps) {
	const ctx = createIssueCardContext(getProps);
	setIssueCardInternal(ctx);
	return ctx;
}

/** @internal - exported only for testing */
export function deriveSessionOverlay(sessionState: SessionStateProp): SessionOverlay {
	if (sessionState === 'error') {
		return 'error';
	}
	if (sessionState === 'hitl') {
		return 'needs-input';
	}
	return null;
}

function mapSessionStateToAggregate(sessionState: SessionStateProp): AggregateSessionState {
	if (sessionState === null) {
		return 'no-session';
	}
	const mapping: Record<NonNullable<SessionStateProp>, AggregateSessionState> = {
		executing: 'running',
		hitl: 'needs-input',
		review: 'needs-review',
		error: 'errored',
		paused: 'paused',
		done: 'finished',
	};
	return mapping[sessionState];
}

function mapCacheToSyncStatus(cache: GitStatusCache | null): ForestSyncStatus {
	if (!cache) {
		return { type: 'up-to-date' };
	}
	if (cache.merge_conflict === true) {
		return { type: 'merge-conflict' };
	}
	if (cache.behind_base_count != null && cache.behind_base_count > 0) {
		return { type: 'behind-base', count: cache.behind_base_count };
	}
	return { type: 'up-to-date' };
}

function mapCacheToPrState(cache: GitStatusCache | null): ForestPullRequestState {
	if (!cache?.pr_state) {
		return 'no-pr';
	}
	return cache.pr_state as ForestPullRequestState;
}

/** @internal - exported only for testing */
export function createIssueCardContext(getProps: () => IssueCardContextProps) {
	const isDone = $derived.by(() => {
		const props = getProps();
		return props.cache?.github_issue_state === 'closed' && props.cache?.pr_state === 'merged';
	});

	const cardState = $derived.by(() => {
		const props = getProps();
		return deriveCardState({
			isGhost: props.isGhost ?? false,
			isArchived: props.issue.status === 'archived',
			isDone,
			isBatchSelected: props.isBatchSelected,
			isActive: props.isActive,
			isHovered: props.isHovered,
			isModifierHeld: props.isModifierHeld,
			worktreeState: props.issue.worktree_state,
		});
	});

	const sessionOverlay = $derived.by(() => deriveSessionOverlay(getProps().sessionState));

	const variantSlotStyles = $derived.by(() => {
		const props = getProps();
		return computeVariantSlotStyles({
			variant: props.appearanceSettings.variant,
			settings: props.appearanceSettings,
			issueColor: props.issue.color ?? DEFAULT_ISSUE_COLOR,
			state: cardState,
			isHovered: props.isHovered,
			isDone,
			sessionOverlay,
			labels: props.issue.labels,
		});
	});

	return {
		// Passthrough inputs
		get issue(): Issue {
			return getProps().issue;
		},
		get cache(): GitStatusCache | null {
			return getProps().cache;
		},
		get ghAvailable(): boolean {
			return getProps().ghAvailable;
		},
		get prdParent(): { number: number | null; url: string | null } | null {
			return getProps().prdParent;
		},
		get prioritiesEnabled(): boolean {
			return getProps().prioritiesEnabled;
		},
		get sessionState(): IssueCardContextProps['sessionState'] {
			return getProps().sessionState;
		},
		get sessionOverlay(): SessionOverlay {
			return sessionOverlay;
		},
		get visualization(): TreeVisualization | undefined {
			return getProps().visualization;
		},
		get isGhost(): boolean {
			return cardState === 'ghost';
		},
		get isActive(): boolean {
			return getProps().isActive;
		},
		get isHovered(): boolean {
			return getProps().isHovered;
		},
		get isBatchSelected(): boolean {
			return getProps().isBatchSelected;
		},
		get isModifierHeld(): boolean {
			return getProps().isModifierHeld;
		},

		// Derived values
		get color(): string {
			return getProps().issue.color ?? DEFAULT_ISSUE_COLOR;
		},
		get headerTextColor(): string {
			return getContrastTextColor(getProps().issue.color ?? DEFAULT_ISSUE_COLOR);
		},
		get isLightHeader(): boolean {
			return (
				getContrastTextColor(getProps().issue.color ?? DEFAULT_ISSUE_COLOR) === '#000000'
			);
		},
		get isArchived(): boolean {
			return getProps().issue.status === 'archived';
		},
		get isDone(): boolean {
			return isDone;
		},
		get hasWorktree(): boolean {
			const worktreeState = getProps().issue.worktree_state;
			return worktreeState === 'active' || worktreeState === 'pending';
		},
		get worktreeBadge(): WorktreeBadgeResult | null {
			return deriveWorktreeBadge(getProps().issue.worktree_state);
		},
		get cardState(): IssueCardState {
			return cardState;
		},
		get slotClasses(): IssueCardSlotClasses {
			return ISSUE_CARD_CLASSES;
		},
		get chipState(): IssueStateChipResult | null {
			const props = getProps();
			return deriveIssueStateChipLabel({
				aggregateSessionState: mapSessionStateToAggregate(props.sessionState),
				syncStatus: mapCacheToSyncStatus(props.cache),
				worktreeState: props.issue.worktree_state,
				pullRequestState: mapCacheToPrState(props.cache),
				githubIssueState: (props.cache?.github_issue_state as 'open' | 'closed') ?? 'open',
				// executionPhase, activeCheckCommandCount, activeTestCommandCount, prCiStatus
				// omitted — will be wired when workspace commands backend (PRD #255) is available
			});
		},
		get notificationDotColor(): string | null {
			return getProps().notificationDotColor;
		},
		get variant(): IssueCardVariant {
			return getProps().appearanceSettings.variant;
		},
		get appearanceSettings(): IssueCardAppearanceSettings {
			return getProps().appearanceSettings;
		},
		get variantSlotStyles(): VariantSlotStyles {
			return variantSlotStyles;
		},
		get cardStyleString(): string {
			return styleMapToString(variantSlotStyles.card);
		},
		get headerStyleString(): string {
			return styleMapToString(variantSlotStyles.header);
		},
		get previewStyleString(): string {
			return styleMapToString(variantSlotStyles.preview);
		},

		// Callbacks
		get onTitleClick(): ((event: MouseEvent) => void) | undefined {
			return getProps().onTitleClick;
		},
		get onExecuteAction(): ((actionId: string, issueId: string) => void) | undefined {
			return getProps().onExecuteAction;
		},
		get onPriorityClick(): (() => void) | undefined {
			return getProps().onPriorityClick;
		},
		get onQuickActionAssignFolder(): ((issueId: string) => void) | undefined {
			return getProps().onQuickActionAssignFolder;
		},
	};
}
