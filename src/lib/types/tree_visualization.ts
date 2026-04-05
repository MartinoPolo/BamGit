// ─── R12 State Dimensions ─────────────────────────────────────────────────
// Forest-prefixed types: superset of existing types to avoid breaking backend contracts.
// The engine operates on these types; mappers convert from existing types at the boundary.

import type { ExecutionPhase, SessionState } from './session';
import type { WorktreeState } from './worktree';

export type GitHubLabel = 'HITL' | 'AFK';

// WorktreeState now includes 'removing' | 'removed' — alias kept for engine boundary stability
export type ForestWorktreeState = WorktreeState;

export type AggregateSessionState = SessionState | 'no-session';

export type { ExecutionPhase };

export type ForestBranchStatus = 'no-branch' | 'active' | 'local-only' | 'remote-gone' | 'deleted';

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

export type ForestGitHubIssueState = 'open' | 'closed';

export type ForestSyncStatus =
	| { readonly type: 'up-to-date' }
	| { readonly type: 'behind-base'; readonly count: number }
	| { readonly type: 'merge-conflict' };

export type ForestBamGitStatus = 'active' | 'archived';

export interface StateDimensions {
	readonly label: GitHubLabel | null;
	readonly worktreeState: ForestWorktreeState;
	readonly aggregateSessionState: AggregateSessionState;
	readonly executionPhase: ExecutionPhase;
	readonly branchStatus: ForestBranchStatus;
	readonly pullRequestState: ForestPullRequestState;
	readonly githubIssueState: ForestGitHubIssueState;
	readonly syncStatus: ForestSyncStatus;
	readonly bamgitStatus: ForestBamGitStatus;
}

// ─── Tree Lifecycle Stages ────────────────────────────────────────────────

export type TreeStage =
	| 'seed'
	| 'sprouting'
	| 'sapling'
	| 'growing'
	| 'leafy'
	| 'fruiting'
	| 'autumn'
	| 'ready'
	| 'bare'
	| 'dead'
	| 'stump';

export type PottedPlantStage = 'pot-with-soil' | 'sprout' | 'small-plant' | 'flowering' | 'dried';

// ─── Overlays ─────────────────────────────────────────────────────────────

export type TreeOverlay =
	| 'error-damage'
	| 'merge-conflict'
	| 'behind-base'
	| 'needs-input'
	| 'changes-requested'
	| 'approved';

// ─── Session Overlays ─────────────────────────────────────────────────────

export type FruitType = 'apple' | 'pear' | 'orange' | 'cherry' | 'plum';

export interface CompanionSapling {
	readonly agentType: string;
	readonly state: 'active' | 'wilted';
}

export type ActiveTool = 'bash' | 'grep' | 'write' | 'edit';

// ─── Tree Visualization Descriptor ────────────────────────────────────────

export interface TreeVisualizationTree {
	readonly kind: 'tree';
	readonly stage: TreeStage;
	readonly overlays: readonly TreeOverlay[];
	readonly companionSaplings: readonly CompanionSapling[];
	readonly activeTools: readonly ActiveTool[];
	readonly fruitTypes: readonly FruitType[];
}

export interface TreeVisualizationPottedPlant {
	readonly kind: 'potted-plant';
	readonly stage: PottedPlantStage;
	readonly overlays: readonly TreeOverlay[];
}

export interface TreeVisualizationOak {
	readonly kind: 'oak';
	readonly title: string;
	readonly completionRatio: number;
	readonly overlays: readonly TreeOverlay[];
}

export type TreeVisualization =
	| TreeVisualizationTree
	| TreeVisualizationPottedPlant
	| TreeVisualizationOak;

// ─── Engine Context (supplemental data not in StateDimensions) ────────────

export interface TreeComputeContext {
	readonly isPrd: boolean;
	readonly prdTitle: string;
	readonly subIssueCompletionRatio: number;
	/** Whether any session on this branch has previously reached 'finished' state. */
	readonly hasCompletedSession: boolean;
	readonly hasCommitsOnBranch: boolean;
	readonly sessionCount: number;
	readonly companionSaplings: readonly CompanionSapling[];
	readonly activeTools: readonly ActiveTool[];
}
