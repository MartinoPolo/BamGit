import type { PullRequestState } from '$lib/types/generated';
import type { WorktreeState, IssueLabel } from '$lib/modules/issues';

export const ACTION_IDS = {
	Run: 'run',
	Hitl: 'hitl',
	Review: 'review',
	CheckAndFix: 'check-and-fix',
	Commit: 'commit',
	CommitAndPush: 'commit-and-push',
	CommitPushAndPr: 'commit-push-and-pr',
	CreatePr: 'create-pr',
	CodeClean: 'code-clean',
	Push: 'push',
	Merge: 'merge',
	SyncBase: 'sync-base',
	SetupWorktree: 'setup-worktree',
	RemoveWorktree: 'remove-worktree',
	RetryWorktree: 'retry-worktree',
	ViewSession: 'view-session',
} as const;

export type ActionId = (typeof ACTION_IDS)[keyof typeof ACTION_IDS];

export type ActionInvocationType = 'agent' | 'deterministic' | 'ui';

export type ActionVisibility = 'primary' | 'secondary' | 'overflow' | 'disabled';

export interface ContextualActionDefinition {
	readonly id: ActionId;
	readonly label: string;
	readonly icon: string;
	readonly invocationType: ActionInvocationType;
	readonly commandTemplate: string | null;
}

export interface DerivedActions {
	readonly primary: ActionId | null;
	readonly secondary: ActionId | null;
	readonly overflow: readonly ActionId[];
	readonly disabled: readonly ActionId[];
}

export type SessionState = 'executing' | 'hitl' | 'review' | 'error' | 'paused' | 'done' | null;

export interface ContextualActionInput {
	readonly worktreeState: WorktreeState;
	readonly sessionState: SessionState;
	readonly prState: PullRequestState | null;
	readonly hasLocalChanges: boolean;
	readonly aheadRemoteCount: number;
	readonly behindBaseCount: number;
	readonly mergeConflict: boolean;
	readonly labels: readonly IssueLabel[];
}
