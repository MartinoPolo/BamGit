import { describe, it, expect } from 'vitest';
import { computeForestLayout, MIN_SPACING_PX } from './index';
import type {
	TreeVisualizationTree,
	TreeVisualizationPottedPlant,
	TreeVisualizationOak,
	TreeComputeContext,
	ForestLayoutItem,
	ForestLayoutItemOak,
	ForestLayoutItemTree,
	ForestLayoutItemPottedPlant,
	Viewport,
	PositionedForestItem,
} from './index';
import {
	computeTreeVisualization,
	mapIssueToStateDimensions,
	aggregateSessionState,
	TREE_STAGES,
	POTTED_PLANT_STAGES,
	TOOL_TYPES,
	GLOW_COLORS,
	SPEECH_BUBBLE_COLORS,
	BIRD_TYPE_MAP,
} from './testing';
import type { StateDimensions } from './testing';
import type { Issue } from '$lib/modules/issues';
import type { GitStatusCache, SessionState, ExecutionPhase } from '$lib/types/generated';

// ════════════════════════════════════════════════════════════════════════
// Shared Factories
// ════════════════════════════════════════════════════════════════════════

function createDimensions(overrides: Partial<StateDimensions> = {}): StateDimensions {
	return {
		labels: ['task'],
		worktreeState: 'none',
		aggregateSessionState: 'no-session',
		executionPhase: 'none',
		branchStatus: 'no-branch',
		pullRequestState: 'no-pr',
		githubIssueState: 'open',
		syncStatus: { type: 'up-to-date' },
		grovekeeperStatus: 'active',
		...overrides,
	};
}

function createContext(overrides: Partial<TreeComputeContext> = {}): TreeComputeContext {
	return {
		isPrd: false,
		prdTitle: '',
		subIssueCompletionRatio: 0,
		subIssueCount: 0,
		hasCompletedSession: false,
		hasCommitsOnBranch: false,
		sessionCount: 0,
		issueId: 'test-issue-1',
		...overrides,
	};
}

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

function createViewport(overrides: Partial<Viewport> = {}): Viewport {
	return { width: 1200, height: 800, ...overrides };
}

function createOak(
	overrides: Partial<Omit<ForestLayoutItemOak, 'kind'>> = {},
): ForestLayoutItemOak {
	return {
		id: 'oak-1',
		priority: null,
		sortOrder: 0,
		...overrides,
		kind: 'oak',
	};
}

function createTree(
	id: string,
	overrides: Partial<Omit<ForestLayoutItemTree, 'kind' | 'id'>> = {},
): ForestLayoutItemTree {
	return {
		id,
		stage: 'leafy',
		priority: 'medium',
		sortOrder: 0,
		...overrides,
		kind: 'tree',
	};
}

function createStump(
	id: string,
	overrides: Partial<Omit<ForestLayoutItemTree, 'kind' | 'id' | 'stage'>> = {},
): ForestLayoutItemTree {
	return {
		id,
		priority: null,
		sortOrder: 0,
		...overrides,
		kind: 'tree',
		stage: 'stump',
	};
}

function createPottedPlant(
	id: string,
	overrides: Partial<Omit<ForestLayoutItemPottedPlant, 'kind' | 'id'>> = {},
): ForestLayoutItemPottedPlant {
	return {
		id,
		stage: 'small-plant',
		priority: null,
		sortOrder: 0,
		...overrides,
		kind: 'potted-plant',
	};
}

function findItem(items: readonly PositionedForestItem[], id: string): PositionedForestItem {
	const found = items.find((item) => item.id === id);
	if (!found) {
		throw new Error(`Item ${id} not found in layout result`);
	}
	return found;
}

function euclideanDistance(a: PositionedForestItem, b: PositionedForestItem): number {
	return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}

// ════════════════════════════════════════════════════════════════════════
// aggregateSessionState
// ════════════════════════════════════════════════════════════════════════

describe('aggregateSessionState', () => {
	it('returns no-session for empty array', () => {
		expect(aggregateSessionState([])).toBe('no-session');
	});

	it('returns running for single running session', () => {
		expect(aggregateSessionState(['running'])).toBe('running');
	});

	it('returns needs-input for single needs-input session', () => {
		expect(aggregateSessionState(['needs-input'])).toBe('needs-input');
	});

	it('returns errored for single errored session', () => {
		expect(aggregateSessionState(['errored'])).toBe('errored');
	});

	it('returns needs-review for single needs-review session', () => {
		expect(aggregateSessionState(['needs-review'])).toBe('needs-review');
	});

	it('returns paused for single paused session', () => {
		expect(aggregateSessionState(['paused'])).toBe('paused');
	});

	it('returns finished for single finished session', () => {
		expect(aggregateSessionState(['finished'])).toBe('finished');
	});

	it('needs-input wins over running', () => {
		expect(aggregateSessionState(['running', 'needs-input'])).toBe('needs-input');
	});

	it('errored wins over finished', () => {
		expect(aggregateSessionState(['finished', 'errored'])).toBe('errored');
	});

	it('needs-review wins over paused and running', () => {
		expect(aggregateSessionState(['paused', 'running', 'needs-review'])).toBe('needs-review');
	});

	it('errored wins over needs-review', () => {
		expect(aggregateSessionState(['needs-review', 'errored'])).toBe('errored');
	});

	it('needs-input is highest priority across all states', () => {
		const sessions: readonly SessionState[] = [
			'finished',
			'paused',
			'running',
			'errored',
			'needs-input',
		];
		expect(aggregateSessionState(sessions)).toBe('needs-input');
	});

	it('returns finished when all sessions are finished', () => {
		expect(aggregateSessionState(['finished', 'finished', 'finished'])).toBe('finished');
	});

	it('running wins over finished', () => {
		expect(aggregateSessionState(['finished', 'running'])).toBe('running');
	});
});

// ════════════════════════════════════════════════════════════════════════
// mapIssueToStateDimensions
// ════════════════════════════════════════════════════════════════════════

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

	it('maps active -> active', () => {
		const dimensions = mapIssueToStateDimensions(
			createIssue({ branch_name: 'feat/x' }),
			createGitStatus({ branch_status: 'active' }),
			[],
		);
		expect(dimensions.branchStatus).toBe('active');
	});

	it('maps local -> local-only', () => {
		const dimensions = mapIssueToStateDimensions(
			createIssue({ branch_name: 'feat/x' }),
			createGitStatus({ branch_status: 'local' }),
			[],
		);
		expect(dimensions.branchStatus).toBe('local-only');
	});

	it('maps remote-gone -> remote-gone', () => {
		const dimensions = mapIssueToStateDimensions(
			createIssue({ branch_name: 'feat/x' }),
			createGitStatus({ branch_status: 'remote-gone' }),
			[],
		);
		expect(dimensions.branchStatus).toBe('remote-gone');
	});

	it('maps deleted -> deleted', () => {
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

	it('maps closed -> closed', () => {
		const dimensions = mapIssueToStateDimensions(
			createIssue(),
			createGitStatus({ github_issue_state: 'closed' }),
			[],
		);
		expect(dimensions.githubIssueState).toBe('closed');
	});

	it('maps open -> open', () => {
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

// ─── grovekeeperStatus ──────────────────────────────────────────────────

describe('mapIssueToStateDimensions — grovekeeperStatus', () => {
	it('maps active issue.status -> active', () => {
		const dimensions = mapIssueToStateDimensions(
			createIssue({ status: 'active' }),
			undefined,
			[],
		);
		expect(dimensions.grovekeeperStatus).toBe('active');
	});

	it('maps archived issue.status -> archived', () => {
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

// ════════════════════════════════════════════════════════════════════════
// computeTreeVisualization
// ════════════════════════════════════════════════════════════════════════

// ─── Kind Determination ─────────────────────────────────────────────────

describe('computeTreeVisualization — kind determination', () => {
	it('returns oak when isPrd is true', () => {
		const result = computeTreeVisualization(createDimensions(), createContext({ isPrd: true }));
		expect(result.kind).toBe('oak');
	});

	it('returns tree when labels are set', () => {
		const result = computeTreeVisualization(createDimensions({ labels: ['feature'] }));
		expect(result.kind).toBe('tree');
	});

	it('returns potted-plant when labels are empty', () => {
		const result = computeTreeVisualization(createDimensions({ labels: [] }));
		expect(result.kind).toBe('potted-plant');
	});
});

// ─── Tree Stages ────────────────────────────────────────────────────────

describe('computeTreeVisualization — tree stages', () => {
	it('rule 1: stump when worktreeState=removed and grovekeeperStatus=archived', () => {
		const result = computeTreeVisualization(
			createDimensions({ worktreeState: 'removed', grovekeeperStatus: 'archived' }),
		) as TreeVisualizationTree;
		expect(result.config.stage).toBe(TREE_STAGES.stump);
	});

	it('rule 2: dead when branchStatus=deleted', () => {
		const result = computeTreeVisualization(
			createDimensions({ branchStatus: 'deleted' }),
		) as TreeVisualizationTree;
		expect(result.config.stage).toBe(TREE_STAGES.dead);
	});

	it('rule 3: dead when branchStatus=remote-gone and prState!=merged', () => {
		const result = computeTreeVisualization(
			createDimensions({ branchStatus: 'remote-gone', pullRequestState: 'open' }),
		) as TreeVisualizationTree;
		expect(result.config.stage).toBe(TREE_STAGES.dead);
	});

	it('rule 4a: bare when prState=merged and githubIssueState=open', () => {
		const result = computeTreeVisualization(
			createDimensions({ pullRequestState: 'merged', githubIssueState: 'open' }),
		) as TreeVisualizationTree;
		expect(result.config.stage).toBe(TREE_STAGES.bare);
	});

	it('rule 4b: bare when prState=merged and githubIssueState=closed', () => {
		const result = computeTreeVisualization(
			createDimensions({ pullRequestState: 'merged', githubIssueState: 'closed' }),
		) as TreeVisualizationTree;
		expect(result.config.stage).toBe(TREE_STAGES.bare);
	});

	it('rule 5: wilting when prState=closed', () => {
		const result = computeTreeVisualization(
			createDimensions({ pullRequestState: 'closed' }),
		) as TreeVisualizationTree;
		expect(result.config.stage).toBe(TREE_STAGES.wilting);
	});

	it('rule 6: fruiting when prState=ready-to-merge', () => {
		const result = computeTreeVisualization(
			createDimensions({ pullRequestState: 'ready-to-merge' }),
		) as TreeVisualizationTree;
		expect(result.config.stage).toBe(TREE_STAGES.fruiting);
	});

	it('rule 7: fruiting when prState=approved', () => {
		const result = computeTreeVisualization(
			createDimensions({ pullRequestState: 'approved' }),
		) as TreeVisualizationTree;
		expect(result.config.stage).toBe(TREE_STAGES.fruiting);
	});

	it('rule 8: seasonal when prState=changes-requested', () => {
		const result = computeTreeVisualization(
			createDimensions({ pullRequestState: 'changes-requested' }),
		) as TreeVisualizationTree;
		expect(result.config.stage).toBe(TREE_STAGES.seasonal);
	});

	it('rule 9a: flowering when prState=open', () => {
		const result = computeTreeVisualization(
			createDimensions({ pullRequestState: 'open' }),
		) as TreeVisualizationTree;
		expect(result.config.stage).toBe(TREE_STAGES.flowering);
	});

	it('rule 9b: flowering when prState=review-requested', () => {
		const result = computeTreeVisualization(
			createDimensions({ pullRequestState: 'review-requested' }),
		) as TreeVisualizationTree;
		expect(result.config.stage).toBe(TREE_STAGES.flowering);
	});

	it('rule 10: leafy when prState=draft', () => {
		const result = computeTreeVisualization(
			createDimensions({ pullRequestState: 'draft' }),
		) as TreeVisualizationTree;
		expect(result.config.stage).toBe(TREE_STAGES.leafy);
	});

	it('rule 11a: growing when aggregateSessionState=running', () => {
		const result = computeTreeVisualization(
			createDimensions({ aggregateSessionState: 'running' }),
		) as TreeVisualizationTree;
		expect(result.config.stage).toBe(TREE_STAGES.growing);
	});

	it('rule 11b: growing when aggregateSessionState=needs-input', () => {
		const result = computeTreeVisualization(
			createDimensions({ aggregateSessionState: 'needs-input' }),
		) as TreeVisualizationTree;
		expect(result.config.stage).toBe(TREE_STAGES.growing);
	});

	it('rule 11c: growing when aggregateSessionState=paused', () => {
		const result = computeTreeVisualization(
			createDimensions({ aggregateSessionState: 'paused' }),
		) as TreeVisualizationTree;
		expect(result.config.stage).toBe(TREE_STAGES.growing);
	});

	it('rule 11d: growing when aggregateSessionState=errored', () => {
		const result = computeTreeVisualization(
			createDimensions({ aggregateSessionState: 'errored' }),
		) as TreeVisualizationTree;
		expect(result.config.stage).toBe(TREE_STAGES.growing);
	});

	it('rule 11e: growing when aggregateSessionState=needs-review', () => {
		const result = computeTreeVisualization(
			createDimensions({ aggregateSessionState: 'needs-review' }),
		) as TreeVisualizationTree;
		expect(result.config.stage).toBe(TREE_STAGES.growing);
	});

	it('rule 12: leafy when hasCommitsOnBranch=true and prState=no-pr', () => {
		const result = computeTreeVisualization(
			createDimensions({ pullRequestState: 'no-pr' }),
			createContext({ hasCommitsOnBranch: true }),
		) as TreeVisualizationTree;
		expect(result.config.stage).toBe(TREE_STAGES.leafy);
	});

	it('rule 13a: sapling when worktreeState=active, branchStatus=active, no session', () => {
		const result = computeTreeVisualization(
			createDimensions({
				worktreeState: 'active',
				branchStatus: 'active',
				aggregateSessionState: 'no-session',
			}),
		) as TreeVisualizationTree;
		expect(result.config.stage).toBe(TREE_STAGES.sapling);
	});

	it('rule 13b: sapling when worktreeState=active, branchStatus=local-only', () => {
		const result = computeTreeVisualization(
			createDimensions({
				worktreeState: 'active',
				branchStatus: 'local-only',
				aggregateSessionState: 'no-session',
			}),
		) as TreeVisualizationTree;
		expect(result.config.stage).toBe(TREE_STAGES.sapling);
	});

	it('rule 14a: sprouting when worktreeState=pending', () => {
		const result = computeTreeVisualization(
			createDimensions({ worktreeState: 'pending' }),
		) as TreeVisualizationTree;
		expect(result.config.stage).toBe(TREE_STAGES.sprouting);
	});

	it('rule 14b: sprouting when worktreeState=failed', () => {
		const result = computeTreeVisualization(
			createDimensions({ worktreeState: 'failed' }),
		) as TreeVisualizationTree;
		expect(result.config.stage).toBe(TREE_STAGES.sprouting);
	});

	it('rule 15: seed as fallback when no rules match', () => {
		const result = computeTreeVisualization(
			createDimensions({
				labels: ['feature'],
				worktreeState: 'none',
				aggregateSessionState: 'no-session',
			}),
		) as TreeVisualizationTree;
		expect(result.config.stage).toBe(TREE_STAGES.seed);
	});
});

// ─── Tree Stage Priority ────────────────────────────────────────────────

describe('computeTreeVisualization — tree stage priority', () => {
	it('P1: stump wins over deleted branch', () => {
		const result = computeTreeVisualization(
			createDimensions({
				worktreeState: 'removed',
				grovekeeperStatus: 'archived',
				branchStatus: 'deleted',
			}),
		) as TreeVisualizationTree;
		expect(result.config.stage).toBe(TREE_STAGES.stump);
	});

	it('P2: dead branch wins over merged PR', () => {
		const result = computeTreeVisualization(
			createDimensions({
				branchStatus: 'deleted',
				pullRequestState: 'merged',
				githubIssueState: 'closed',
			}),
		) as TreeVisualizationTree;
		expect(result.config.stage).toBe(TREE_STAGES.dead);
	});

	it('P3: merged PR wins over running session', () => {
		const result = computeTreeVisualization(
			createDimensions({
				pullRequestState: 'merged',
				aggregateSessionState: 'running',
			}),
		) as TreeVisualizationTree;
		expect(result.config.stage).toBe(TREE_STAGES.bare);
	});

	it('P4: merged PR with open issue still yields bare (REQ-11)', () => {
		const result = computeTreeVisualization(
			createDimensions({
				pullRequestState: 'merged',
				githubIssueState: 'open',
			}),
		) as TreeVisualizationTree;
		expect(result.config.stage).toBe(TREE_STAGES.bare);
	});
});

// ─── Potted Plant Stages ────────────────────────────────────────────────

describe('computeTreeVisualization — potted plant stages', () => {
	it('pot-with-soil: default for labels=[]', () => {
		const result = computeTreeVisualization(
			createDimensions({ labels: [] }),
		) as TreeVisualizationPottedPlant;
		expect(result.kind).toBe('potted-plant');
		expect(result.stage).toBe(POTTED_PLANT_STAGES.potWithSoil);
	});

	it('sprout: has session activity but no completed session', () => {
		const result = computeTreeVisualization(
			createDimensions({ labels: [], aggregateSessionState: 'running' }),
			createContext({ hasCompletedSession: false }),
		) as TreeVisualizationPottedPlant;
		expect(result.stage).toBe(POTTED_PLANT_STAGES.sprout);
	});

	it('small-plant: hasCompletedSession=true', () => {
		const result = computeTreeVisualization(
			createDimensions({ labels: [], aggregateSessionState: 'finished' }),
			createContext({ hasCompletedSession: true }),
		) as TreeVisualizationPottedPlant;
		expect(result.stage).toBe(POTTED_PLANT_STAGES.smallPlant);
	});

	it('flowering: has PR activity', () => {
		const result = computeTreeVisualization(
			createDimensions({ labels: [], pullRequestState: 'draft' }),
			createContext({ hasCompletedSession: true }),
		) as TreeVisualizationPottedPlant;
		expect(result.stage).toBe(POTTED_PLANT_STAGES.flowering);
	});

	it('dried: githubIssueState=closed', () => {
		const result = computeTreeVisualization(
			createDimensions({ labels: [], githubIssueState: 'closed' }),
		) as TreeVisualizationPottedPlant;
		expect(result.stage).toBe(POTTED_PLANT_STAGES.dried);
	});
});

// ─── Oak ────────────────────────────────────────────────────────────────

describe('computeTreeVisualization — oak', () => {
	it('isPrd=true returns oak', () => {
		const result = computeTreeVisualization(
			createDimensions(),
			createContext({ isPrd: true }),
		) as TreeVisualizationOak;
		expect(result.kind).toBe('oak');
	});

	it('oak includes title from context', () => {
		const result = computeTreeVisualization(
			createDimensions(),
			createContext({ isPrd: true, prdTitle: 'Forest Dashboard' }),
		) as TreeVisualizationOak;
		expect(result.title).toBe('Forest Dashboard');
	});

	it('oak includes completionRatio from context', () => {
		const result = computeTreeVisualization(
			createDimensions(),
			createContext({ isPrd: true, subIssueCompletionRatio: 0.75 }),
		) as TreeVisualizationOak;
		expect(result.completionRatio).toBe(0.75);
	});

	it('oak defaults to empty title and zero ratio', () => {
		const result = computeTreeVisualization(
			createDimensions(),
			createContext({ isPrd: true }),
		) as TreeVisualizationOak;
		expect(result.title).toBe('');
		expect(result.completionRatio).toBe(0);
	});
});

// ─── Tool Visibility ───────────────────────────────────────────────────

// ─── Execution Phase Tools (REQ-3, REQ-5) ─────────────────────────────

describe('computeTreeVisualization — execution phase tools', () => {
	it('T1: lantern when running + analyzing', () => {
		const result = computeTreeVisualization(
			createDimensions({ aggregateSessionState: 'running', executionPhase: 'analyzing' }),
		) as TreeVisualizationTree;
		expect(result.toolVisibility[TOOL_TYPES.lantern].visible).toBe(true);
	});

	it('T2: shovel when running + tdd', () => {
		const result = computeTreeVisualization(
			createDimensions({ aggregateSessionState: 'running', executionPhase: 'tdd' }),
		) as TreeVisualizationTree;
		expect(result.toolVisibility[TOOL_TYPES.shovel].visible).toBe(true);
	});

	it('T3: no trunkBase tool when running + reviewing', () => {
		const result = computeTreeVisualization(
			createDimensions({ aggregateSessionState: 'running', executionPhase: 'reviewing' }),
		) as TreeVisualizationTree;
		expect(result.toolVisibility[TOOL_TYPES.lantern].visible).toBe(false);
		expect(result.toolVisibility[TOOL_TYPES.shovel].visible).toBe(false);
		expect(result.toolVisibility[TOOL_TYPES.pruningShears].visible).toBe(false);
		expect(result.toolVisibility[TOOL_TYPES.rake].visible).toBe(false);
		expect(result.toolVisibility[TOOL_TYPES.ladder].visible).toBe(false);
	});

	it('T4: pruningShears when running + verifying', () => {
		const result = computeTreeVisualization(
			createDimensions({ aggregateSessionState: 'running', executionPhase: 'verifying' }),
		) as TreeVisualizationTree;
		expect(result.toolVisibility[TOOL_TYPES.pruningShears].visible).toBe(true);
	});

	it('T5: rake when running + committing', () => {
		const result = computeTreeVisualization(
			createDimensions({ aggregateSessionState: 'running', executionPhase: 'committing' }),
		) as TreeVisualizationTree;
		expect(result.toolVisibility[TOOL_TYPES.rake].visible).toBe(true);
	});

	it('T6: no execution tool when paused, ladder instead', () => {
		const result = computeTreeVisualization(
			createDimensions({ aggregateSessionState: 'paused', executionPhase: 'tdd' }),
		) as TreeVisualizationTree;
		expect(result.toolVisibility[TOOL_TYPES.shovel].visible).toBe(false);
		expect(result.toolVisibility[TOOL_TYPES.ladder].visible).toBe(true);
	});
});

// ─── State-Driven Accessories (REQ-4) ─────────────────────────────────

describe('computeTreeVisualization — state-driven accessories', () => {
	it('A1: wateringCan visible when worktreeState=pending', () => {
		const result = computeTreeVisualization(
			createDimensions({ worktreeState: 'pending' }),
		) as TreeVisualizationTree;
		expect(result.toolVisibility[TOOL_TYPES.wateringCan].visible).toBe(true);
	});

	it('A2: ladder visible when aggregateSessionState=paused', () => {
		const result = computeTreeVisualization(
			createDimensions({ aggregateSessionState: 'paused' }),
		) as TreeVisualizationTree;
		expect(result.toolVisibility[TOOL_TYPES.ladder].visible).toBe(true);
	});

	it('A3: grill visible when labels include HITL and no running session', () => {
		const result = computeTreeVisualization(
			createDimensions({
				labels: ['task', 'HITL'],
				aggregateSessionState: 'no-session',
			}),
		) as TreeVisualizationTree;
		expect(result.toolVisibility[TOOL_TYPES.grill].visible).toBe(true);
	});

	it('A4: speechBubble visible with red color when errored', () => {
		const result = computeTreeVisualization(
			createDimensions({ aggregateSessionState: 'errored' }),
		) as TreeVisualizationTree;
		expect(result.toolVisibility[TOOL_TYPES.speechBubble].visible).toBe(true);
		expect(result.toolVisibility[TOOL_TYPES.speechBubble].color).toBe(SPEECH_BUBBLE_COLORS.red);
	});

	it('A5: speechBubble visible with orange color when needs-input', () => {
		const result = computeTreeVisualization(
			createDimensions({ aggregateSessionState: 'needs-input' }),
		) as TreeVisualizationTree;
		expect(result.toolVisibility[TOOL_TYPES.speechBubble].visible).toBe(true);
		expect(result.toolVisibility[TOOL_TYPES.speechBubble].color).toBe(
			SPEECH_BUBBLE_COLORS.orange,
		);
	});

	it('A6: stormCloud visible when syncStatus=merge-conflict', () => {
		const result = computeTreeVisualization(
			createDimensions({ syncStatus: { type: 'merge-conflict' } }),
		) as TreeVisualizationTree;
		expect(result.toolVisibility[TOOL_TYPES.stormCloud].visible).toBe(true);
	});

	it('A7: stormCloud visible when worktreeState=failed', () => {
		const result = computeTreeVisualization(
			createDimensions({ worktreeState: 'failed' }),
		) as TreeVisualizationTree;
		expect(result.toolVisibility[TOOL_TYPES.stormCloud].visible).toBe(true);
	});

	it('A8: mushrooms visible when syncStatus=behind-base', () => {
		const result = computeTreeVisualization(
			createDimensions({ syncStatus: { type: 'behind-base', count: 3 } }),
		) as TreeVisualizationTree;
		expect(result.toolVisibility[TOOL_TYPES.mushrooms].visible).toBe(true);
	});

	it('no tools visible when all clear', () => {
		const result = computeTreeVisualization(createDimensions()) as TreeVisualizationTree;
		const visibleTools = (
			Object.values(result.toolVisibility) as Array<{ visible: boolean }>
		).filter((entry) => entry.visible === true);
		expect(visibleTools).toHaveLength(0);
	});
});

// ─── trunkBase Priority (REQ-5) ───────────────────────────────────────

describe('computeTreeVisualization — trunkBase priority', () => {
	it('TP1: execution tool wins over HITL grill when running', () => {
		const result = computeTreeVisualization(
			createDimensions({
				labels: ['task', 'HITL'],
				aggregateSessionState: 'running',
				executionPhase: 'analyzing',
			}),
		) as TreeVisualizationTree;
		expect(result.toolVisibility[TOOL_TYPES.lantern].visible).toBe(true);
		expect(result.toolVisibility[TOOL_TYPES.grill].visible).toBe(false);
	});

	it('TP2: ladder wins over grill when paused with HITL label', () => {
		const result = computeTreeVisualization(
			createDimensions({
				labels: ['task', 'HITL'],
				aggregateSessionState: 'paused',
			}),
		) as TreeVisualizationTree;
		expect(result.toolVisibility[TOOL_TYPES.ladder].visible).toBe(true);
		expect(result.toolVisibility[TOOL_TYPES.grill].visible).toBe(false);
	});

	it('TP3: grill wins over wateringCan when HITL label and pending', () => {
		const result = computeTreeVisualization(
			createDimensions({
				labels: ['task', 'HITL'],
				worktreeState: 'pending',
				aggregateSessionState: 'no-session',
			}),
		) as TreeVisualizationTree;
		expect(result.toolVisibility[TOOL_TYPES.grill].visible).toBe(true);
		expect(result.toolVisibility[TOOL_TYPES.wateringCan].visible).toBe(false);
	});

	it('TP4: wateringCan when only pending, no other trunkBase triggers', () => {
		const result = computeTreeVisualization(
			createDimensions({
				worktreeState: 'pending',
				aggregateSessionState: 'no-session',
			}),
		) as TreeVisualizationTree;
		expect(result.toolVisibility[TOOL_TYPES.wateringCan].visible).toBe(true);
	});
});

// ─── Overlay Config ────────────────────────────────────────────────────

describe('computeTreeVisualization — glow overlay', () => {
	it('G1: red glow with pulse when errored', () => {
		const result = computeTreeVisualization(
			createDimensions({ aggregateSessionState: 'errored' }),
		) as TreeVisualizationTree;
		expect(result.overlayConfig.glow).toEqual({
			enabled: true,
			color: GLOW_COLORS.red,
			intensity: 4,
			pulse: true,
		});
	});

	it('G2: orange glow with pulse when needs-input', () => {
		const result = computeTreeVisualization(
			createDimensions({ aggregateSessionState: 'needs-input' }),
		) as TreeVisualizationTree;
		expect(result.overlayConfig.glow).toEqual({
			enabled: true,
			color: GLOW_COLORS.orange,
			intensity: 3,
			pulse: true,
		});
	});

	it('G3: green glow intensity 5 when ready-to-merge', () => {
		const result = computeTreeVisualization(
			createDimensions({ pullRequestState: 'ready-to-merge' }),
		) as TreeVisualizationTree;
		expect(result.overlayConfig.glow).toEqual({
			enabled: true,
			color: GLOW_COLORS.green,
			intensity: 5,
			pulse: false,
		});
	});

	it('G4: green glow intensity 2 when approved', () => {
		const result = computeTreeVisualization(
			createDimensions({ pullRequestState: 'approved' }),
		) as TreeVisualizationTree;
		expect(result.overlayConfig.glow).toEqual({
			enabled: true,
			color: GLOW_COLORS.green,
			intensity: 2,
			pulse: false,
		});
	});

	it('G5: red glow wins over approved (higher priority)', () => {
		const result = computeTreeVisualization(
			createDimensions({
				aggregateSessionState: 'errored',
				pullRequestState: 'approved',
			}),
		) as TreeVisualizationTree;
		expect(result.overlayConfig.glow.color).toBe(GLOW_COLORS.red);
		expect(result.overlayConfig.glow.intensity).toBe(4);
		expect(result.overlayConfig.glow.pulse).toBe(true);
	});

	it('G6: orange glow wins over ready-to-merge (higher priority)', () => {
		const result = computeTreeVisualization(
			createDimensions({
				aggregateSessionState: 'needs-input',
				pullRequestState: 'ready-to-merge',
			}),
		) as TreeVisualizationTree;
		expect(result.overlayConfig.glow.color).toBe(GLOW_COLORS.orange);
		expect(result.overlayConfig.glow.intensity).toBe(3);
		expect(result.overlayConfig.glow.pulse).toBe(true);
	});

	it('G7: glow disabled when no triggers', () => {
		const result = computeTreeVisualization(createDimensions()) as TreeVisualizationTree;
		expect(result.overlayConfig.glow.enabled).toBe(false);
	});
});

// ─── Shape Mapping ──────────────────────────────────────────────────────

describe('computeTreeVisualization — shape mapping', () => {
	it('bug label maps to maple', () => {
		const result = computeTreeVisualization(
			createDimensions({ labels: ['bug'] }),
		) as TreeVisualizationTree;
		expect(result.config.shape).toBe('maple');
	});

	it('feature label maps to oak', () => {
		const result = computeTreeVisualization(
			createDimensions({ labels: ['feature'] }),
		) as TreeVisualizationTree;
		expect(result.config.shape).toBe('oak');
	});

	it('task label maps to pine', () => {
		const result = computeTreeVisualization(
			createDimensions({ labels: ['task'] }),
		) as TreeVisualizationTree;
		expect(result.config.shape).toBe('pine');
	});

	it('default shape is cherry when no known label', () => {
		const result = computeTreeVisualization(
			createDimensions({ labels: ['unknown-label'] }),
		) as TreeVisualizationTree;
		expect(result.config.shape).toBe('cherry');
	});

	it('prd label takes priority over bug', () => {
		const result = computeTreeVisualization(
			createDimensions({ labels: ['bug', 'prd'] }),
		) as TreeVisualizationTree;
		expect(result.config.shape).toBe('apple');
	});
});

// ─── Deterministic Seed ─────────────────────────────────────────────────

describe('computeTreeVisualization — deterministic seed', () => {
	it('same issueId produces same seed', () => {
		const result1 = computeTreeVisualization(
			createDimensions(),
			createContext({ issueId: 'abc-123' }),
		) as TreeVisualizationTree;
		const result2 = computeTreeVisualization(
			createDimensions(),
			createContext({ issueId: 'abc-123' }),
		) as TreeVisualizationTree;
		expect(result1.config.seed).toBe(result2.config.seed);
	});

	it('different issueId produces different seed', () => {
		const result1 = computeTreeVisualization(
			createDimensions(),
			createContext({ issueId: 'abc-123' }),
		) as TreeVisualizationTree;
		const result2 = computeTreeVisualization(
			createDimensions(),
			createContext({ issueId: 'def-456' }),
		) as TreeVisualizationTree;
		expect(result1.config.seed).not.toBe(result2.config.seed);
	});
});

// ─── Animation (REQ-8) ────────────────────────────────────────────────

describe('computeTreeVisualization — animation', () => {
	it('AN1: all animations enabled when running', () => {
		const result = computeTreeVisualization(
			createDimensions({ aggregateSessionState: 'running' }),
		) as TreeVisualizationTree;
		expect(result.animateCanopySway).toBe(true);
		expect(result.animateGrowth).toBe(true);
		expect(result.animateTools).toBe(true);
	});

	it('AN2: all animations disabled when paused', () => {
		const result = computeTreeVisualization(
			createDimensions({ aggregateSessionState: 'paused' }),
		) as TreeVisualizationTree;
		expect(result.animateCanopySway).toBe(false);
		expect(result.animateGrowth).toBe(false);
		expect(result.animateTools).toBe(false);
	});

	it('AN3: all animations disabled when errored', () => {
		const result = computeTreeVisualization(
			createDimensions({ aggregateSessionState: 'errored' }),
		) as TreeVisualizationTree;
		expect(result.animateCanopySway).toBe(false);
		expect(result.animateGrowth).toBe(false);
		expect(result.animateTools).toBe(false);
	});

	it('AN4: all animations disabled when no-session', () => {
		const result = computeTreeVisualization(
			createDimensions({ aggregateSessionState: 'no-session' }),
		) as TreeVisualizationTree;
		expect(result.animateCanopySway).toBe(false);
		expect(result.animateGrowth).toBe(false);
		expect(result.animateTools).toBe(false);
	});
});

// ─── Fruit (REQ-9) ────────────────────────────────────────────────────

describe('computeTreeVisualization — fruit', () => {
	it('F1: fruitCount 3-5 and fruitType matches shape when stage=fruiting', () => {
		const result = computeTreeVisualization(
			createDimensions({ pullRequestState: 'approved', labels: ['task'] }),
			createContext({ issueId: 'fruit-test-1' }),
		) as TreeVisualizationTree;
		expect(result.config.stage).toBe(TREE_STAGES.fruiting);
		expect(result.config.fruitCount).toBeGreaterThanOrEqual(3);
		expect(result.config.fruitCount).toBeLessThanOrEqual(5);
		// task -> pine -> pine_cone
		expect(result.config.fruitType).toBe('pine_cone');
	});

	it('F2: fruitType=none when not fruiting stage', () => {
		const result = computeTreeVisualization(
			createDimensions({ pullRequestState: 'open', labels: ['task'] }),
		) as TreeVisualizationTree;
		expect(result.config.stage).toBe(TREE_STAGES.flowering);
		expect(result.config.fruitType).toBe('none');
	});

	it('F3: same issueId gives consistent fruitCount', () => {
		const result1 = computeTreeVisualization(
			createDimensions({ pullRequestState: 'approved', labels: ['task'] }),
			createContext({ issueId: 'deterministic-fruit' }),
		) as TreeVisualizationTree;
		const result2 = computeTreeVisualization(
			createDimensions({ pullRequestState: 'approved', labels: ['task'] }),
			createContext({ issueId: 'deterministic-fruit' }),
		) as TreeVisualizationTree;
		expect(result1.config.fruitCount).toBe(result2.config.fruitCount);
	});
});

// ─── Bird Type Mapping (REQ-6) ────────────────────────────────────────

describe('BIRD_TYPE_MAP — sub-agent bird type mapping', () => {
	it('maps all 6 agent categories to bird types', () => {
		expect(Object.keys(BIRD_TYPE_MAP)).toHaveLength(6);
	});

	it('analysis maps to owl', () => {
		expect(BIRD_TYPE_MAP.analysis).toBe('owl');
	});

	it('executor maps to robin', () => {
		expect(BIRD_TYPE_MAP.executor).toBe('robin');
	});

	it('checker maps to sparrow', () => {
		expect(BIRD_TYPE_MAP.checker).toBe('sparrow');
	});

	it('reviewer maps to cardinal', () => {
		expect(BIRD_TYPE_MAP.reviewer).toBe('cardinal');
	});

	it('utility maps to hummingbird', () => {
		expect(BIRD_TYPE_MAP.utility).toBe('hummingbird');
	});

	it('research maps to parrot', () => {
		expect(BIRD_TYPE_MAP.research).toBe('parrot');
	});
});

// ════════════════════════════════════════════════════════════════════════
// computeForestLayout
// ════════════════════════════════════════════════════════════════════════

// ─── Empty Input ────────────────────────────────────────────────────────

describe('computeForestLayout — empty input', () => {
	it('returns empty result for no items', () => {
		const result = computeForestLayout([], createViewport());
		expect(result.items).toEqual([]);
		expect(result.oakPosition).toBeNull();
	});
});

// ─── Oak Placement ──────────────────────────────────────────────────────

describe('computeForestLayout — oak placement', () => {
	it('positions oak at center-top of viewport', () => {
		const viewport = createViewport({ width: 1200, height: 800 });
		const result = computeForestLayout([createOak()], viewport);

		expect(result.oakPosition).not.toBeNull();
		const oak = result.oakPosition!;
		expect(oak.x).toBeCloseTo(600, 0); // center x
		expect(oak.y).toBeLessThan(800 * 0.25); // top 25%
		expect(oak.scale).toBe(1.0);
		expect(oak.opacity).toBe(1.0);
	});

	it('returns null oakPosition when no oak provided', () => {
		const result = computeForestLayout([createTree('t1'), createTree('t2')], createViewport());
		expect(result.oakPosition).toBeNull();
	});

	it('includes oak in items array', () => {
		const result = computeForestLayout([createOak()], createViewport());
		expect(result.items).toHaveLength(1);
		expect(result.items[0].id).toBe('oak-1');
	});
});

// ─── Tree Semicircle Arrangement ────────────────────────────────────────

describe('computeForestLayout — tree semicircle', () => {
	it('distributes trees with y below oak position', () => {
		const oak = createOak();
		const trees = Array.from({ length: 5 }, (_, i) => createTree(`t${i}`));
		const viewport = createViewport();
		const result = computeForestLayout([oak, ...trees], viewport);

		const oakPos = result.oakPosition!;
		for (const tree of trees) {
			const pos = findItem(result.items, tree.id);
			expect(pos.y).toBeGreaterThan(oakPos.y);
		}
	});

	it('distributes trees symmetrically around center x', () => {
		const trees = Array.from({ length: 4 }, (_, i) => createTree(`t${i}`));
		const viewport = createViewport({ width: 1000, height: 800 });
		const result = computeForestLayout(trees, viewport);

		const centerX = 500;
		const positions = trees.map((t) => findItem(result.items, t.id));
		const leftCount = positions.filter((p) => p.x < centerX).length;
		const rightCount = positions.filter((p) => p.x > centerX).length;
		// Even count should split evenly
		expect(leftCount).toBe(rightCount);
	});

	it('places single tree centered in tree zone', () => {
		const viewport = createViewport({ width: 1000, height: 800 });
		const result = computeForestLayout([createTree('solo')], viewport);

		const pos = findItem(result.items, 'solo');
		expect(pos.x).toBeCloseTo(500, 0);
	});

	it('orders trees by priority then sort_order — higher priority closer to center', () => {
		const items: ForestLayoutItem[] = [
			createOak(),
			createTree('low', { priority: 'low', sortOrder: 0 }),
			createTree('top', { priority: 'top', sortOrder: 0 }),
			createTree('med', { priority: 'medium', sortOrder: 0 }),
			createTree('high', { priority: 'high', sortOrder: 0 }),
		];
		const viewport = createViewport();
		const result = computeForestLayout(items, viewport);

		const oakPos = result.oakPosition!;
		const topPos = findItem(result.items, 'top');
		const lowPos = findItem(result.items, 'low');

		// Higher-priority tree should be in inner ring (closer to oak center)
		const topDistance = euclideanDistance(topPos, oakPos);
		const lowDistance = euclideanDistance(lowPos, oakPos);
		expect(topDistance).toBeLessThan(lowDistance);
	});
});

// ─── Stump Placement ──────────────────────────────────────────────────

describe('computeForestLayout — stumps', () => {
	it('places stumps with reduced opacity', () => {
		const items = [createOak(), createStump('s1'), createTree('t1')];
		const result = computeForestLayout(items, createViewport());

		const stump = findItem(result.items, 's1');
		expect(stump.opacity).toBeLessThanOrEqual(0.5);
	});

	it('places stumps at periphery — further from center than trees', () => {
		const items = [createOak(), createTree('t1'), createTree('t2'), createStump('s1')];
		const viewport = createViewport();
		const result = computeForestLayout(items, viewport);

		const oakPos = result.oakPosition!;
		const treeDistances = ['t1', 't2'].map((id) =>
			euclideanDistance(findItem(result.items, id), oakPos),
		);
		const stumpDistance = euclideanDistance(findItem(result.items, 's1'), oakPos);
		const maxTreeDistance = Math.max(...treeDistances);
		expect(stumpDistance).toBeGreaterThanOrEqual(maxTreeDistance);
	});

	it('gives stumps reduced scale', () => {
		const result = computeForestLayout([createStump('s1')], createViewport());
		const stump = findItem(result.items, 's1');
		expect(stump.scale).toBeLessThanOrEqual(0.6);
	});
});

// ─── Potted Plants Shelf ───────────────────────────────────────────────

describe('computeForestLayout — potted plants', () => {
	it('positions potted plants on bottom shelf strip', () => {
		const viewport = createViewport({ height: 800 });
		const plants = [createPottedPlant('p1'), createPottedPlant('p2')];
		const result = computeForestLayout(plants, viewport);

		for (const plant of plants) {
			const pos = findItem(result.items, plant.id);
			expect(pos.y).toBeGreaterThanOrEqual(viewport.height * 0.8);
		}
	});

	it('distributes potted plants horizontally across shelf', () => {
		const viewport = createViewport({ width: 1000 });
		const plants = Array.from({ length: 3 }, (_, i) => createPottedPlant(`p${i}`));
		const result = computeForestLayout(plants, viewport);

		const positions = plants.map((p) => findItem(result.items, p.id));
		const xValues = positions.map((p) => p.x).sort((a, b) => a - b);

		// Should be spread out, not stacked
		for (let i = 1; i < xValues.length; i++) {
			expect(xValues[i] - xValues[i - 1]).toBeGreaterThan(0);
		}
	});

	it('exposes shelfY coordinate', () => {
		const viewport = createViewport({ height: 800 });
		const result = computeForestLayout([createPottedPlant('p1')], viewport);
		expect(result.shelfY).toBeGreaterThanOrEqual(viewport.height * 0.8);
	});
});

// ─── Minimum Spacing ───────────────────────────────────────────────────

describe('computeForestLayout — minimum spacing', () => {
	it('enforces minimum spacing between all items', () => {
		const items: ForestLayoutItem[] = [
			createOak(),
			...Array.from({ length: 15 }, (_, i) => createTree(`t${i}`)),
		];
		const viewport = createViewport({ width: 800, height: 600 });
		const result = computeForestLayout(items, viewport);

		for (let i = 0; i < result.items.length; i++) {
			for (let j = i + 1; j < result.items.length; j++) {
				const distance = euclideanDistance(result.items[i], result.items[j]);
				expect(distance).toBeGreaterThanOrEqual(MIN_SPACING_PX * 0.9); // 10% tolerance
			}
		}
	});
});

// ─── Viewport Responsiveness ───────────────────────────────────────────

describe('computeForestLayout — viewport responsiveness', () => {
	it('produces different positions for different viewport sizes', () => {
		const items = [createOak(), createTree('t1'), createTree('t2')];
		const small = computeForestLayout(items, createViewport({ width: 600, height: 400 }));
		const large = computeForestLayout(items, createViewport({ width: 1600, height: 1000 }));

		const smallOak = small.oakPosition!;
		const largeOak = large.oakPosition!;
		expect(smallOak.x).not.toBeCloseTo(largeOak.x, 0);
	});

	it('scales positions proportionally to viewport', () => {
		const items = [createOak(), createTree('t1')];
		const v1 = createViewport({ width: 1000, height: 800 });
		const v2 = createViewport({ width: 2000, height: 1600 });

		const r1 = computeForestLayout(items, v1);
		const r2 = computeForestLayout(items, v2);

		// Positions should roughly double
		const oak1 = r1.oakPosition!;
		const oak2 = r2.oakPosition!;
		expect(oak2.x / oak1.x).toBeCloseTo(2.0, 0);
		expect(oak2.y / oak1.y).toBeCloseTo(2.0, 0);
	});
});

// ─── Many Trees Overflow ───────────────────────────────────────────────

describe('computeForestLayout — large item counts', () => {
	it('handles 30+ trees without crashing', () => {
		const items: ForestLayoutItem[] = [
			createOak(),
			...Array.from({ length: 35 }, (_, i) => createTree(`t${i}`)),
		];
		const result = computeForestLayout(items, createViewport());
		expect(result.items).toHaveLength(36);
	});
});

// ─── Mixed Kinds ───────────────────────────────────────────────────────

describe('computeForestLayout — mixed kinds', () => {
	it('correctly zones all kinds simultaneously', () => {
		const viewport = createViewport({ width: 1200, height: 800 });
		const items: ForestLayoutItem[] = [
			createOak(),
			createTree('t1'),
			createTree('t2'),
			createStump('s1'),
			createPottedPlant('p1'),
			createPottedPlant('p2'),
		];
		const result = computeForestLayout(items, viewport);

		expect(result.items).toHaveLength(6);
		expect(result.oakPosition).not.toBeNull();

		const oak = result.oakPosition!;
		const t1 = findItem(result.items, 't1');
		const s1 = findItem(result.items, 's1');
		const p1 = findItem(result.items, 'p1');

		// Oak at top
		expect(oak.y).toBeLessThan(t1.y);
		// Trees above shelf
		expect(t1.y).toBeLessThan(result.shelfY);
		// Potted plants at/below shelf
		expect(p1.y).toBeGreaterThanOrEqual(result.shelfY - 10); // small tolerance
		// Stump reduced opacity
		expect(s1.opacity).toBeLessThanOrEqual(0.5);
	});
});

// ─── zIndex Ordering ───────────────────────────────────────────────────

describe('computeForestLayout — zIndex', () => {
	it('gives oak the highest zIndex', () => {
		const items = [createOak(), createTree('t1'), createPottedPlant('p1')];
		const result = computeForestLayout(items, createViewport());

		const oak = result.oakPosition!;
		for (const item of result.items) {
			if (item.id !== oak.id) {
				expect(oak.zIndex).toBeGreaterThanOrEqual(item.zIndex);
			}
		}
	});

	it('gives stumps the lowest zIndex', () => {
		const items = [createTree('t1'), createStump('s1'), createPottedPlant('p1')];
		const result = computeForestLayout(items, createViewport());

		const stump = findItem(result.items, 's1');
		const tree = findItem(result.items, 't1');
		expect(stump.zIndex).toBeLessThan(tree.zIndex);
	});
});
