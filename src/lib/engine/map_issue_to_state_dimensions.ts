import type { Issue } from '$lib/types/issue';
import type { BranchStatus, GitStatusCache } from '$lib/types/git_status';
import type { ExecutionPhase, SessionState } from '$lib/types/generated';
import type {
	ForestBranchStatus,
	ForestPullRequestState,
	ForestSyncStatus,
	StateDimensions,
} from '$lib/types/tree_visualization';
import { aggregateSessionState } from './aggregate_session_state';

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
	'ready-to-merge',
	'merged',
	'closed',
]);

function mapBranchStatus(
	issueBranchName: string | null,
	raw: BranchStatus | null | undefined,
): ForestBranchStatus {
	if (issueBranchName === null || raw == null || raw === 'unknown') {
		return 'no-branch';
	}
	if (raw === 'local') {
		return 'local-only';
	}
	return raw;
}

function mapPrState(raw: string | null | undefined): ForestPullRequestState {
	if (raw == null) {
		return 'no-pr';
	}
	if (KNOWN_PR_STATES.has(raw as ForestPullRequestState)) {
		return raw as ForestPullRequestState;
	}
	return 'open';
}

function mapSyncStatus(gitStatus: GitStatusCache | undefined): ForestSyncStatus {
	if (gitStatus === undefined) {
		return { type: 'up-to-date' };
	}
	if (gitStatus.merge_conflict === true) {
		return { type: 'merge-conflict' };
	}
	const behind = gitStatus.behind_base_count ?? 0;
	if (behind > 0) {
		return { type: 'behind-base', count: behind };
	}
	return { type: 'up-to-date' };
}

function pickExecutionPhase(sessions: readonly SessionForMapping[]): ExecutionPhase {
	const running = sessions.find((session) => session.state === 'running');
	return running?.execution_phase ?? 'none';
}

export function mapIssueToStateDimensions(
	issue: Issue,
	gitStatus: GitStatusCache | undefined,
	sessions: readonly SessionForMapping[],
): StateDimensions {
	return {
		labels: issue.labels.map((label) => label.name),
		worktreeState: issue.worktree_state,
		aggregateSessionState: aggregateSessionState(sessions.map((session) => session.state)),
		executionPhase: pickExecutionPhase(sessions),
		branchStatus: mapBranchStatus(issue.branch_name, gitStatus?.branch_status),
		pullRequestState: mapPrState(gitStatus?.pr_state),
		githubIssueState: gitStatus?.github_issue_state === 'closed' ? 'closed' : 'open',
		syncStatus: mapSyncStatus(gitStatus),
		grovekeeperStatus: issue.status === 'archived' ? 'archived' : 'active',
	};
}
