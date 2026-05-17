import type { ExecutionPhase } from '$lib/types/generated';
import type { WorktreeState } from '$lib/modules/issues/index.js';
import type {
	AggregateSessionState,
	ForestPullRequestState,
	ForestSyncStatus,
} from '$lib/modules/visualization/types.js';

export const CHIP_COLORS = {
	error: '--chip-error',
	warning: '--chip-warning',
	success: '--chip-success',
	info: '--chip-info',
	muted: '--chip-muted',
} as const;

export type ChipColor = (typeof CHIP_COLORS)[keyof typeof CHIP_COLORS];

export interface IssueStateChipResult {
	readonly label: string;
	readonly colorVariable: ChipColor;
}

export interface IssueStateChipInput {
	readonly aggregateSessionState: AggregateSessionState;
	readonly executionPhase?: ExecutionPhase;
	readonly syncStatus: ForestSyncStatus;
	readonly worktreeState: WorktreeState;
	readonly pullRequestState: ForestPullRequestState;
	readonly githubIssueState: 'open' | 'closed';
	readonly activeCheckCommandCount?: number;
	readonly activeTestCommandCount?: number;
	readonly prCiStatus?: 'running' | 'passed' | 'failed' | null;
}

export type WorktreeBadgeTone = 'warning' | 'success' | 'danger';

export interface WorktreeBadgeResult {
	readonly label: string;
	readonly tone: WorktreeBadgeTone;
}
