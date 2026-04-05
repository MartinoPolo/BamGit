import type { Issue } from '$lib/types/issue';
import type { BranchStatus, GitStatusCache } from '$lib/types/git_status';
import type { ExecutionPhase, SessionState } from '$lib/types/session';
import type {
	ForestBranchStatus,
	ForestPullRequestState,
	ForestSyncStatus,
	StateDimensions,
} from '$lib/types/tree_visualization';
import { aggregate_session_state } from './aggregate_session_state';

/**
 * Minimal session shape needed by the mapper. Matches {@link Session} but decoupled
 * to allow callers to pass any session-like object.
 */
export interface SessionForMapping {
	readonly state: SessionState;
	readonly execution_phase: ExecutionPhase;
}

const KNOWN_PR_STATES: ReadonlySet<ForestPullRequestState> = new Set([
	'draft',
	'open',
	'review-requested',
	'changes-requested',
	'approved',
	'merged',
	'closed',
]);

function map_branch_status(
	issue_branch_name: string | null,
	raw: BranchStatus | null | undefined,
): ForestBranchStatus {
	// TODO(#25): when issue.label is added, revisit 'no-branch' stub policy.
	if (issue_branch_name === null || raw == null || raw === 'unknown') {
		return 'no-branch';
	}
	if (raw === 'local') {
		return 'local-only';
	}
	return raw;
}

function map_pr_state(raw: string | null | undefined): ForestPullRequestState {
	if (raw == null) {
		return 'no-pr';
	}
	if (KNOWN_PR_STATES.has(raw as ForestPullRequestState)) {
		return raw as ForestPullRequestState;
	}
	return 'open';
}

function map_sync_status(git_status: GitStatusCache | undefined): ForestSyncStatus {
	if (git_status === undefined) {
		return { type: 'up-to-date' };
	}
	if (git_status.merge_conflict === true) {
		return { type: 'merge-conflict' };
	}
	const behind = git_status.behind_base_count ?? 0;
	if (behind > 0) {
		return { type: 'behind-base', count: behind };
	}
	return { type: 'up-to-date' };
}

function pick_execution_phase(sessions: readonly SessionForMapping[]): ExecutionPhase {
	const running = sessions.find((session) => session.state === 'running');
	return running?.execution_phase ?? 'none';
}

/**
 * Pure adapter that converts backend types (Issue, GitStatusCache, sessions) into
 * the engine's StateDimensions contract. Safe to call in derived state — no side effects.
 *
 * Label is currently stubbed as 'AFK' (no label field on Issue yet) so issues render
 * as trees instead of potted plants. Revisit when GitHub label sync lands.
 */
export function map_issue_to_state_dimensions(
	issue: Issue,
	git_status: GitStatusCache | undefined,
	sessions: readonly SessionForMapping[],
): StateDimensions {
	return {
		label: 'AFK',
		worktreeState: issue.worktree_state,
		aggregateSessionState: aggregate_session_state(sessions.map((session) => session.state)),
		executionPhase: pick_execution_phase(sessions),
		branchStatus: map_branch_status(issue.branch_name, git_status?.branch_status),
		pullRequestState: map_pr_state(git_status?.pr_state),
		githubIssueState: git_status?.github_issue_state === 'closed' ? 'closed' : 'open',
		syncStatus: map_sync_status(git_status),
		bamgitStatus: issue.status === 'archived' ? 'archived' : 'active',
	};
}
