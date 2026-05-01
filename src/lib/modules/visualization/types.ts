import type {
	TreeShape,
	TreeConfig,
	ToolVisibility,
	OverlayConfig,
	PottedPlantStage,
	TreeStage,
} from 'low-poly-2d-trees';
import type { ExecutionPhase, SessionState } from '$lib/types/generated';
import type { WorktreeState } from '$lib/modules/issues/index.js';

// ─── GitHub Label -> Tree Shape Mapping ─────────────────────────────────────

/** @public */
export interface LabelShapeMappingEntry {
	readonly labelName: string;
	readonly treeShape: TreeShape;
}

// ─── Issue Tree State Dimensions ────────────────────────────────────────────

type ForestWorktreeState = WorktreeState;

/** @internal Exported for testing only. */
export type AggregateSessionState = SessionState | 'no-session';

/** @internal Exported for testing only. */
export type ForestBranchStatus = 'no-branch' | 'active' | 'local-only' | 'remote-gone' | 'deleted';

/** @internal Exported for testing only. */
export type ForestPullRequestState =
	| 'no-pr'
	| 'draft'
	| 'open'
	| 'review-requested'
	| 'changes-requested'
	| 'approved'
	| 'ready-to-merge'
	| 'merged'
	| 'closed';

/** @internal Exported for testing only. */
export type ForestSyncStatus =
	| { readonly type: 'up-to-date' }
	| { readonly type: 'behind-base'; readonly count: number }
	| { readonly type: 'merge-conflict' };

type ForestGitHubIssueState = 'open' | 'closed';
type ForestGrovekeeperStatus = 'active' | 'archived';

/** @internal Exported for testing only. */
export interface StateDimensions {
	readonly labels: readonly string[];
	readonly worktreeState: ForestWorktreeState;
	readonly aggregateSessionState: AggregateSessionState;
	readonly executionPhase: ExecutionPhase;
	readonly branchStatus: ForestBranchStatus;
	readonly pullRequestState: ForestPullRequestState;
	readonly githubIssueState: ForestGitHubIssueState;
	readonly syncStatus: ForestSyncStatus;
	readonly grovekeeperStatus: ForestGrovekeeperStatus;
}

// ─── Visualization Result (library-typed output) ────────────────────────────

export interface TreeVisualizationTree {
	readonly kind: 'tree';
	readonly config: TreeConfig;
	readonly toolVisibility: ToolVisibility;
	readonly overlayConfig: OverlayConfig;
	readonly animateCanopySway: boolean;
	readonly animateGrowth: boolean;
	readonly animateTools: boolean;
}

export interface TreeVisualizationPottedPlant {
	readonly kind: 'potted-plant';
	readonly stage: PottedPlantStage;
	readonly seed: number;
}

export interface TreeVisualizationOak {
	readonly kind: 'oak';
	readonly title: string;
	readonly completionRatio: number;
	readonly issueCount: number;
	readonly seed: number;
}

export type TreeVisualization =
	| TreeVisualizationTree
	| TreeVisualizationPottedPlant
	| TreeVisualizationOak;

// ─── Engine Context (supplemental data not in StateDimensions) ──────────────

export interface TreeComputeContext {
	readonly isPrd: boolean;
	readonly prdTitle: string;
	readonly subIssueCompletionRatio: number;
	readonly subIssueCount: number;
	readonly hasCompletedSession: boolean;
	readonly hasCommitsOnBranch: boolean;
	readonly sessionCount: number;
	readonly issueId: string;
}

// ─── Session Mapping Input ──────────────────────────────────────────────────

export interface SessionForMapping {
	readonly state: SessionState;
	readonly execution_phase: ExecutionPhase;
}

// ─── Forest Layout Types ─────────────────────────────────────────────────────

type IssuePriority = 'low' | 'medium' | 'high' | 'top' | null;

export interface Viewport {
	readonly width: number;
	readonly height: number;
}

export interface ForestLayoutItemOak {
	readonly id: string;
	readonly kind: 'oak';
	readonly priority: IssuePriority;
	readonly sortOrder: number;
}

export interface ForestLayoutItemTree {
	readonly id: string;
	readonly kind: 'tree';
	readonly stage: TreeStage;
	readonly priority: IssuePriority;
	readonly sortOrder: number;
	readonly depthRow: number;
}

export interface ForestLayoutItemPottedPlant {
	readonly id: string;
	readonly kind: 'potted-plant';
	readonly stage: PottedPlantStage;
	readonly priority: IssuePriority;
	readonly sortOrder: number;
	readonly depthRow: number;
}

export type ForestLayoutItem =
	| ForestLayoutItemOak
	| ForestLayoutItemTree
	| ForestLayoutItemPottedPlant;

export interface PositionedForestItem {
	readonly id: string;
	readonly x: number;
	readonly y: number;
	readonly scale: number;
	readonly opacity: number;
	readonly zIndex: number;
	readonly rowIndex: number;
}

export interface ForestLayoutResult {
	readonly items: readonly PositionedForestItem[];
	readonly oakPosition: PositionedForestItem | null;
	readonly groundY: number;
}
