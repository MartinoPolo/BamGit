import type { Issue } from '$lib/modules/issues/index.js';
import type { GitStatusCache, ExecutionPhase, SessionState } from '$lib/types/generated';
import type {
	AggregateSessionState,
	ForestBranchStatus,
	ForestPullRequestState,
	ForestSyncStatus,
	StateDimensions,
	SessionForMapping,
} from './types.js';

// ─── aggregateSessionState — priority-based session state reduction ───────────

const SESSION_PRIORITY: readonly SessionState[] = [
	'needs-input',
	'errored',
	'needs-review',
	'running',
	'paused',
	'finished',
];

/** @internal Exported for testing only — use `computeVisualization` for production code. */
export function aggregateSessionState(sessions: readonly SessionState[]): AggregateSessionState {
	if (sessions.length === 0) {
		return 'no-session';
	}

	const stateSet = new Set(sessions);

	for (const state of SESSION_PRIORITY) {
		if (stateSet.has(state)) {
			return state;
		}
	}

	return 'no-session';
}

// ─── mapIssueToStateDimensions — maps raw inputs to StateDimensions ───────────

const KNOWN_PR_STATES = new Set([
	'draft',
	'open',
	'review-requested',
	'changes-requested',
	'approved',
	'ready-to-merge',
	'merged',
	'closed',
]);

const PASSTHROUGH_BRANCH_STATUSES = new Set(['active', 'remote-gone', 'deleted']);

function isPassthroughBranchStatus(raw: string): raw is ForestBranchStatus {
	return PASSTHROUGH_BRANCH_STATUSES.has(raw);
}

function isKnownPrState(raw: string): raw is ForestPullRequestState {
	return KNOWN_PR_STATES.has(raw);
}

function mapBranchStatus(
	issueBranchName: string | null,
	raw: string | null | undefined,
): ForestBranchStatus {
	if (issueBranchName === null) {
		return 'no-branch';
	}
	if (raw == null || raw === 'unknown') {
		return 'active';
	}
	if (raw === 'local') {
		return 'local-only';
	}
	if (isPassthroughBranchStatus(raw)) {
		return raw;
	}
	return 'active';
}

function mapPrState(raw: string | null | undefined): ForestPullRequestState {
	if (raw == null) {
		return 'no-pr';
	}
	if (isKnownPrState(raw)) {
		return raw;
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

/** @internal Exported for testing only — use `computeVisualization` for production code. */
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
