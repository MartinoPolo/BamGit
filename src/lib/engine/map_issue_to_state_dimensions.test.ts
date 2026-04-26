import { describe, it, expect } from 'vitest';
import { mapIssueToStateDimensions } from './map_issue_to_state_dimensions';
import type { Issue } from '$lib/modules/issues/index.svelte.js';
import type { GitStatusCache } from '$lib/types/generated';
import type { SessionState, ExecutionPhase } from '$lib/types/generated';

function createIssue(overrides: Partial<Issue> = {}): Issue {
	return {
		id: 'i1',
		dashboard_id: 'd1',
		name: 'Test Issue',
		priority: null,
		color: null,
		status: 'active',
		github_issue_url: null,
		github_issue_number: null,
		branch_name: null,
		base_branch: null,
		worktree_folder: null,
		worktree_state: 'none',
		parent_issue_id: null,
		editor_folder: null,
		dev_server_command: null,
		dev_server_port: null,
		dev_server_pid: null,
		browser_url: null,
		labels: [],
		sort_order: 0,
		created_at: '2026-01-01T00:00:00Z',
		...overrides,
	};
}

function createGitStatus(overrides: Partial<GitStatusCache> = {}): GitStatusCache {
	return {
		issue_id: 'i1',
		branch_status: null,
		pr_state: null,
		pr_number: null,
		pr_url: null,
		github_issue_state: null,
		behind_base_count: null,
		merge_conflict: null,
		fetched_at: null,
		...overrides,
	};
}

interface SessionStub {
	state: SessionState;
	execution_phase: ExecutionPhase;
}

function createSession(overrides: Partial<SessionStub> = {}): SessionStub {
	return { state: 'running', execution_phase: 'none', ...overrides };
}

// ─── worktreeState ──────────────────────────────────────────────────────

describe('mapIssueToStateDimensions — worktreeState', () => {
	it('passes through issue.worktree_state verbatim', () => {
		const dimensions = mapIssueToStateDimensions(
			createIssue({ worktree_state: 'active' }),
			undefined,
			[],
		);
		expect(dimensions.worktreeState).toBe('active');
	});

	it('handles every WorktreeState value', () => {
		const states = ['none', 'pending', 'active', 'failed', 'removing', 'removed'] as const;
		for (const state of states) {
			const dimensions = mapIssueToStateDimensions(
				createIssue({ worktree_state: state }),
				undefined,
				[],
			);
			expect(dimensions.worktreeState).toBe(state);
		}
	});
});

// ─── aggregateSessionState ──────────────────────────────────────────────

describe('mapIssueToStateDimensions — aggregateSessionState', () => {
	it('returns no-session when sessions array empty', () => {
		const dimensions = mapIssueToStateDimensions(createIssue(), undefined, []);
		expect(dimensions.aggregateSessionState).toBe('no-session');
	});

	it('aggregates from session states using priority order', () => {
		const dimensions = mapIssueToStateDimensions(createIssue(), undefined, [
			createSession({ state: 'running' }),
			createSession({ state: 'needs-input' }),
		]);
		expect(dimensions.aggregateSessionState).toBe('needs-input');
	});

	it('returns running when all sessions running', () => {
		const dimensions = mapIssueToStateDimensions(createIssue(), undefined, [
			createSession({ state: 'running' }),
			createSession({ state: 'running' }),
		]);
		expect(dimensions.aggregateSessionState).toBe('running');
	});
});

// ─── executionPhase ─────────────────────────────────────────────────────

describe('mapIssueToStateDimensions — executionPhase', () => {
	it('returns none when no sessions', () => {
		const dimensions = mapIssueToStateDimensions(createIssue(), undefined, []);
		expect(dimensions.executionPhase).toBe('none');
	});

	it('returns first running session execution phase', () => {
		const dimensions = mapIssueToStateDimensions(createIssue(), undefined, [
			createSession({ state: 'finished', execution_phase: 'committing' }),
			createSession({ state: 'running', execution_phase: 'tdd' }),
		]);
		expect(dimensions.executionPhase).toBe('tdd');
	});

	it('returns none when no running session exists', () => {
		const dimensions = mapIssueToStateDimensions(createIssue(), undefined, [
			createSession({ state: 'finished', execution_phase: 'committing' }),
		]);
		expect(dimensions.executionPhase).toBe('none');
	});
});

// ─── branchStatus ───────────────────────────────────────────────────────

describe('mapIssueToStateDimensions — branchStatus', () => {
	it('returns no-branch when issue has no branch_name', () => {
		const dimensions = mapIssueToStateDimensions(
			createIssue({ branch_name: null }),
			createGitStatus({ branch_status: 'active' }),
			[],
		);
		expect(dimensions.branchStatus).toBe('no-branch');
	});

	it('returns no-branch when git_status is missing', () => {
		const dimensions = mapIssueToStateDimensions(
			createIssue({ branch_name: 'feat/x' }),
			undefined,
			[],
		);
		expect(dimensions.branchStatus).toBe('no-branch');
	});

	it('returns no-branch when branch_status is null', () => {
		const dimensions = mapIssueToStateDimensions(
			createIssue({ branch_name: 'feat/x' }),
			createGitStatus({ branch_status: null }),
			[],
		);
		expect(dimensions.branchStatus).toBe('no-branch');
	});

	it('returns no-branch when branch_status is unknown', () => {
		const dimensions = mapIssueToStateDimensions(
			createIssue({ branch_name: 'feat/x' }),
			createGitStatus({ branch_status: 'unknown' }),
			[],
		);
		expect(dimensions.branchStatus).toBe('no-branch');
	});

	it('maps active → active', () => {
		const dimensions = mapIssueToStateDimensions(
			createIssue({ branch_name: 'feat/x' }),
			createGitStatus({ branch_status: 'active' }),
			[],
		);
		expect(dimensions.branchStatus).toBe('active');
	});

	it('maps local → local-only', () => {
		const dimensions = mapIssueToStateDimensions(
			createIssue({ branch_name: 'feat/x' }),
			createGitStatus({ branch_status: 'local' }),
			[],
		);
		expect(dimensions.branchStatus).toBe('local-only');
	});

	it('maps remote-gone → remote-gone', () => {
		const dimensions = mapIssueToStateDimensions(
			createIssue({ branch_name: 'feat/x' }),
			createGitStatus({ branch_status: 'remote-gone' }),
			[],
		);
		expect(dimensions.branchStatus).toBe('remote-gone');
	});

	it('maps deleted → deleted', () => {
		const dimensions = mapIssueToStateDimensions(
			createIssue({ branch_name: 'feat/x' }),
			createGitStatus({ branch_status: 'deleted' }),
			[],
		);
		expect(dimensions.branchStatus).toBe('deleted');
	});
});

// ─── pullRequestState ───────────────────────────────────────────────────

describe('mapIssueToStateDimensions — pullRequestState', () => {
	it('returns no-pr when git_status missing', () => {
		const dimensions = mapIssueToStateDimensions(createIssue(), undefined, []);
		expect(dimensions.pullRequestState).toBe('no-pr');
	});

	it('returns no-pr when pr_state is null', () => {
		const dimensions = mapIssueToStateDimensions(
			createIssue(),
			createGitStatus({ pr_state: null }),
			[],
		);
		expect(dimensions.pullRequestState).toBe('no-pr');
	});

	it.each([
		'draft',
		'open',
		'review-requested',
		'changes-requested',
		'approved',
		'ready-to-merge',
		'merged',
		'closed',
	] as const)('passes through known pr_state "%s"', (state) => {
		const dimensions = mapIssueToStateDimensions(
			createIssue(),
			createGitStatus({ pr_state: state }),
			[],
		);
		expect(dimensions.pullRequestState).toBe(state);
	});

	it('falls back to open for unrecognised pr_state string', () => {
		const dimensions = mapIssueToStateDimensions(
			createIssue(),
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			createGitStatus({ pr_state: 'some-new-state' as any }),
			[],
		);
		expect(dimensions.pullRequestState).toBe('open');
	});
});

// ─── githubIssueState ───────────────────────────────────────────────────

describe('mapIssueToStateDimensions — githubIssueState', () => {
	it('defaults to open when git_status missing', () => {
		const dimensions = mapIssueToStateDimensions(createIssue(), undefined, []);
		expect(dimensions.githubIssueState).toBe('open');
	});

	it('defaults to open when github_issue_state is null', () => {
		const dimensions = mapIssueToStateDimensions(
			createIssue(),
			createGitStatus({ github_issue_state: null }),
			[],
		);
		expect(dimensions.githubIssueState).toBe('open');
	});

	it('maps closed → closed', () => {
		const dimensions = mapIssueToStateDimensions(
			createIssue(),
			createGitStatus({ github_issue_state: 'closed' }),
			[],
		);
		expect(dimensions.githubIssueState).toBe('closed');
	});

	it('maps open → open', () => {
		const dimensions = mapIssueToStateDimensions(
			createIssue(),
			createGitStatus({ github_issue_state: 'open' }),
			[],
		);
		expect(dimensions.githubIssueState).toBe('open');
	});
});

// ─── syncStatus ─────────────────────────────────────────────────────────

describe('mapIssueToStateDimensions — syncStatus', () => {
	it('returns up-to-date when git_status missing', () => {
		const dimensions = mapIssueToStateDimensions(createIssue(), undefined, []);
		expect(dimensions.syncStatus).toEqual({ type: 'up-to-date' });
	});

	it('returns merge-conflict when merge_conflict true', () => {
		const dimensions = mapIssueToStateDimensions(
			createIssue(),
			createGitStatus({ merge_conflict: true, behind_base_count: 3 }),
			[],
		);
		expect(dimensions.syncStatus).toEqual({ type: 'merge-conflict' });
	});

	it('returns behind-base when behind_base_count > 0 and no merge conflict', () => {
		const dimensions = mapIssueToStateDimensions(
			createIssue(),
			createGitStatus({ merge_conflict: false, behind_base_count: 5 }),
			[],
		);
		expect(dimensions.syncStatus).toEqual({ type: 'behind-base', count: 5 });
	});

	it('returns up-to-date when behind_base_count is 0', () => {
		const dimensions = mapIssueToStateDimensions(
			createIssue(),
			createGitStatus({ merge_conflict: false, behind_base_count: 0 }),
			[],
		);
		expect(dimensions.syncStatus).toEqual({ type: 'up-to-date' });
	});

	it('returns up-to-date when behind_base_count is null', () => {
		const dimensions = mapIssueToStateDimensions(
			createIssue(),
			createGitStatus({ merge_conflict: false, behind_base_count: null }),
			[],
		);
		expect(dimensions.syncStatus).toEqual({ type: 'up-to-date' });
	});
});

// ─── grovekeeperStatus ───────────────────────────────────────────────────────

describe('mapIssueToStateDimensions — grovekeeperStatus', () => {
	it('maps active issue.status → active', () => {
		const dimensions = mapIssueToStateDimensions(
			createIssue({ status: 'active' }),
			undefined,
			[],
		);
		expect(dimensions.grovekeeperStatus).toBe('active');
	});

	it('maps archived issue.status → archived', () => {
		const dimensions = mapIssueToStateDimensions(
			createIssue({ status: 'archived' }),
			undefined,
			[],
		);
		expect(dimensions.grovekeeperStatus).toBe('archived');
	});
});

// ─── labels ─────────────────────────────────────────────────────────────

describe('mapIssueToStateDimensions — labels', () => {
	it('returns empty labels for issue with no labels', () => {
		const dimensions = mapIssueToStateDimensions(createIssue(), undefined, []);
		expect(dimensions.labels).toEqual([]);
	});

	it('extracts label names from issue labels', () => {
		const dimensions = mapIssueToStateDimensions(
			createIssue({
				labels: [
					{ name: 'bug', color: '#d73a4a' },
					{ name: 'task', color: '#0E8A16' },
				],
			}),
			undefined,
			[],
		);
		expect(dimensions.labels).toEqual(['bug', 'task']);
	});

	it('handles single label', () => {
		const dimensions = mapIssueToStateDimensions(
			createIssue({ labels: [{ name: 'feature', color: '#a2eeef' }] }),
			undefined,
			[],
		);
		expect(dimensions.labels).toEqual(['feature']);
	});
});
