import { createContext } from 'svelte';
import type { Issue } from '$lib/modules/issues/index.js';
import type { GitStatusCache } from '$lib/types/generated';
import type { TreeVisualization } from '$lib/modules/visualization/types.js';
import type { IssueStateChipResult, WorktreeBadgeResult } from './types.js';
import { deriveCardStateClass } from './derive_card_state_class.js';
import { deriveIssueStateChipLabel } from './derive_issue_state_chip.js';
import { deriveWorktreeBadge } from './derive_worktree_badge.js';
import { getContrastTextColor } from '$lib/components/derived/color-picker/color_utils.js';
import type { AggregateSessionState } from '$lib/modules/visualization/types.js';
import type { ForestPullRequestState, ForestSyncStatus } from '$lib/modules/visualization/types.js';

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
	isActive: boolean;
	isHovered: boolean;
	isBatchSelected: boolean;
	isModifierHeld: boolean;
	onCardClick?: (event: MouseEvent) => void;
	onTitleClick?: (event: MouseEvent) => void;
	onMouseEnter?: () => void;
	onMouseLeave?: () => void;
	onExecuteAction?: (actionId: string, issueId: string) => void;
	onPriorityClick?: () => void;
	onQuickActionAssignFolder?: (issueId: string) => void;
}

export function setIssueCardContext(getProps: () => IssueCardContextProps) {
	const ctx = createIssueCardContext(getProps);
	setIssueCardInternal(ctx);
	return ctx;
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

export function createIssueCardContext(getProps: () => IssueCardContextProps) {
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
		get visualization(): TreeVisualization | undefined {
			return getProps().visualization;
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
		get hasWorktree(): boolean {
			const worktreeState = getProps().issue.worktree_state;
			return worktreeState === 'active' || worktreeState === 'pending';
		},
		get worktreeBadge(): WorktreeBadgeResult | null {
			return deriveWorktreeBadge(getProps().issue.worktree_state);
		},
		get cardStateClass(): string {
			const props = getProps();
			return deriveCardStateClass({
				isArchived: props.issue.status === 'archived',
				isBatchSelected: props.isBatchSelected,
				isActive: props.isActive,
				isHovered: props.isHovered,
				isModifierHeld: props.isModifierHeld,
				worktreeState: props.issue.worktree_state,
			});
		},
		get chipState(): IssueStateChipResult | null {
			const props = getProps();
			return deriveIssueStateChipLabel({
				aggregateSessionState: mapSessionStateToAggregate(props.sessionState),
				executionPhase: 'none',
				syncStatus: mapCacheToSyncStatus(props.cache),
				worktreeState: props.issue.worktree_state,
				pullRequestState: mapCacheToPrState(props.cache),
				githubIssueState: (props.cache?.github_issue_state as 'open' | 'closed') ?? 'open',
				activeCheckCommandCount: 0,
				activeTestCommandCount: 0,
				prCiStatus: null,
			});
		},
		get notificationDotColor(): string | null {
			return getProps().notificationDotColor;
		},

		// Callbacks
		get onCardClick(): ((event: MouseEvent) => void) | undefined {
			return getProps().onCardClick;
		},
		get onTitleClick(): ((event: MouseEvent) => void) | undefined {
			return getProps().onTitleClick;
		},
		get onMouseEnter(): (() => void) | undefined {
			return getProps().onMouseEnter;
		},
		get onMouseLeave(): (() => void) | undefined {
			return getProps().onMouseLeave;
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
