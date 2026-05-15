import { describe, it, expect } from 'vitest';
import {
	computeForestLayout,
	computeDepthRows,
	MIN_SPACING_PX,
	MAX_DEPTH_ROWS,
	TREE_SPACING_FRACTION,
	ROW_SPACING_Y_FRACTION,
	ROW_SCALE_FACTOR,
	ROW_OPACITY_FACTOR,
	ROW_X_OFFSET_FRACTION,
	GROUND_Y_FRACTION,
} from './index';
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
		character_pack_id: null,
		character_avatar: null,
		is_sound_muted: false,
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
		has_local_changes: null,
		ahead_remote_count: null,
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
		depthRow: 0,
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
		depthRow: 0,
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
		depthRow: 0,
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

	it('defaults to active when git_status is missing but branch_name exists', () => {
		const dimensions = mapIssueToStateDimensions(
			createIssue({ branch_name: 'feat/x' }),
			undefined,
			[],
		);
		expect(dimensions.branchStatus).toBe('active');
	});

	it('defaults to active when branch_status is null but branch_name exists', () => {
		const dimensions = mapIssueToStateDimensions(
			createIssue({ branch_name: 'feat/x' }),
			createGitStatus({ branch_status: null }),
			[],
		);
		expect(dimensions.branchStatus).toBe('active');
	});

	it('defaults to active when branch_status is unknown but branch_name exists', () => {
		const dimensions = mapIssueToStateDimensions(
			createIssue({ branch_name: 'feat/x' }),
			createGitStatus({ branch_status: 'unknown' }),
			[],
		);
		expect(dimensions.branchStatus).toBe('active');
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

// ════════════════════════════════════════════════════════════════════════
// computeForestLayout — Row-Based Equidistant Layout
// ════════════════════════════════════════════════════════════════════════

// ─── Empty Input ────────────────────────────────────────────────────────

describe('computeForestLayout — empty input', () => {
	it('returns empty items, null oakPosition, and groundY at GROUND_Y_FRACTION', () => {
		const viewport = createViewport({ width: 1200, height: 800 });
		const result = computeForestLayout([], viewport);

		expect(result.items).toEqual([]);
		expect(result.oakPosition).toBeNull();
		expect(result.groundY).toBeCloseTo(viewport.height * GROUND_Y_FRACTION, 1);
	});
});

// ─── Oak Placement ──────────────────────────────────────────────────────

describe('computeForestLayout — oak placement', () => {
	it('positions oak at horizontal center on groundY with scale=1 opacity=1 rowIndex=0', () => {
		const viewport = createViewport({ width: 1200, height: 800 });
		const result = computeForestLayout([createOak()], viewport);

		expect(result.oakPosition).not.toBeNull();
		const oak = result.oakPosition!;
		expect(oak.x).toBeCloseTo(600, 0);
		expect(oak.y).toBeCloseTo(viewport.height * GROUND_Y_FRACTION, 1);
		expect(oak.scale).toBe(1.0);
		expect(oak.opacity).toBe(1.0);
		expect(oak.zIndex).toBe(100);
		expect(oak.rowIndex).toBe(0);
	});

	it('includes oak in items array', () => {
		const result = computeForestLayout([createOak()], createViewport());
		expect(result.items).toHaveLength(1);
		expect(result.items[0].id).toBe('oak-1');
	});
});

// ─── Oak Absent ─────────────────────────────────────────────────────────

describe('computeForestLayout — oak absent', () => {
	it('returns null oakPosition when no oak provided and trees still positioned', () => {
		const viewport = createViewport({ width: 1200, height: 800 });
		const result = computeForestLayout([createTree('t1'), createTree('t2')], viewport);

		expect(result.oakPosition).toBeNull();
		expect(result.items).toHaveLength(2);
		// Trees should still be positioned with valid coordinates
		for (const item of result.items) {
			expect(item.x).toBeGreaterThan(0);
			expect(item.y).toBeGreaterThan(0);
		}
	});
});

// ─── Row 0 Left-Right Alternation ────────────────────────────────────────

describe('computeForestLayout — row 0 equidistant placement', () => {
	it('distributes 4 trees equidistantly across viewport width', () => {
		const viewport = createViewport({ width: 1200, height: 800 });

		const items: ForestLayoutItem[] = [
			createOak(),
			createTree('t0', { priority: 'top', sortOrder: 0 }),
			createTree('t1', { priority: 'high', sortOrder: 0 }),
			createTree('t2', { priority: 'medium', sortOrder: 0 }),
			createTree('t3', { priority: 'low', sortOrder: 0 }),
		];
		const result = computeForestLayout(items, viewport);

		// 4 non-oak trees → equidistant at width*(i+1)/5
		const t0 = findItem(result.items, 't0');
		const t1 = findItem(result.items, 't1');
		const t2 = findItem(result.items, 't2');
		const t3 = findItem(result.items, 't3');

		expect(t0.x).toBeCloseTo(1200 * (1 / 5), 0);
		expect(t1.x).toBeCloseTo(1200 * (2 / 5), 0);
		expect(t2.x).toBeCloseTo(1200 * (3 / 5), 0);
		expect(t3.x).toBeCloseTo(1200 * (4 / 5), 0);
	});
});

// ─── Equidistant Spacing ────────────────────────────────────────────────

describe('computeForestLayout — equidistant spacing', () => {
	it('non-oak row-0 items have equal horizontal spacing between consecutive positions', () => {
		const viewport = createViewport({ width: 1200, height: 800 });

		const items: ForestLayoutItem[] = [
			createOak(),
			createTree('t0', { sortOrder: 0 }),
			createTree('t1', { sortOrder: 1 }),
			createTree('t2', { sortOrder: 2 }),
			createTree('t3', { sortOrder: 3 }),
		];
		const result = computeForestLayout(items, viewport);

		// Collect non-oak row-0 x positions, sorted
		const nonOakRow0 = result.items
			.filter((item) => item.rowIndex === 0 && item.id !== 'oak-1')
			.sort((a, b) => a.x - b.x);

		// Consecutive positions should have equal spacing: width / (count + 1)
		const expectedSpacing = viewport.width / (nonOakRow0.length + 1);
		for (let i = 1; i < nonOakRow0.length; i++) {
			expect(nonOakRow0[i].x - nonOakRow0[i - 1].x).toBeCloseTo(expectedSpacing, 0);
		}
	});
});

// ─── Priority Sorting Within Row ────────────────────────────────────────

describe('computeForestLayout — priority sorting within row', () => {
	it('higher priority trees are placed first (leftmost) in equidistant distribution', () => {
		const viewport = createViewport({ width: 1200, height: 800 });

		const items: ForestLayoutItem[] = [
			createOak(),
			createTree('low', { priority: 'low', sortOrder: 0 }),
			createTree('top', { priority: 'top', sortOrder: 0 }),
			createTree('med', { priority: 'medium', sortOrder: 0 }),
			createTree('high', { priority: 'high', sortOrder: 0 }),
		];
		const result = computeForestLayout(items, viewport);

		const topPos = findItem(result.items, 'top');
		const highPos = findItem(result.items, 'high');
		const medPos = findItem(result.items, 'med');
		const lowPos = findItem(result.items, 'low');

		// Priority order: top < high < med < low in x position
		expect(topPos.x).toBeLessThan(highPos.x);
		expect(highPos.x).toBeLessThan(medPos.x);
		expect(medPos.x).toBeLessThan(lowPos.x);
	});
});

// ─── Back-Row Perspective — Row 1 ──────────────────────────────────────

describe('computeForestLayout — back-row perspective row 1', () => {
	it('trees with depthRow=1 have reduced scale, opacity, and shifted-up y', () => {
		const viewport = createViewport({ width: 1200, height: 800 });
		const groundY = viewport.height * GROUND_Y_FRACTION;

		const items: ForestLayoutItem[] = [createOak(), createTree('row1', { depthRow: 1 })];
		const result = computeForestLayout(items, viewport);

		const row1Tree = findItem(result.items, 'row1');
		expect(row1Tree.scale).toBeCloseTo(ROW_SCALE_FACTOR, 2);
		expect(row1Tree.opacity).toBeCloseTo(ROW_OPACITY_FACTOR, 2);
		// Y should be shifted up from groundY
		expect(row1Tree.y).toBeCloseTo(groundY - 1 * viewport.height * ROW_SPACING_Y_FRACTION, 1);
		expect(row1Tree.rowIndex).toBe(1);
	});
});

// ─── Back-Row Perspective — Row 2 ──────────────────────────────────────

describe('computeForestLayout — back-row perspective row 2', () => {
	it('trees with depthRow=2 have cumulative scale/opacity reduction', () => {
		const viewport = createViewport({ width: 1200, height: 800 });
		const groundY = viewport.height * GROUND_Y_FRACTION;

		const items: ForestLayoutItem[] = [createOak(), createTree('row2', { depthRow: 2 })];
		const result = computeForestLayout(items, viewport);

		const row2Tree = findItem(result.items, 'row2');
		expect(row2Tree.scale).toBeCloseTo(ROW_SCALE_FACTOR ** 2, 2);
		expect(row2Tree.opacity).toBeCloseTo(ROW_OPACITY_FACTOR ** 2, 2);
		expect(row2Tree.y).toBeCloseTo(groundY - 2 * viewport.height * ROW_SPACING_Y_FRACTION, 1);
		expect(row2Tree.rowIndex).toBe(2);
	});
});

// ─── Back-Row X-Offset ─────────────────────────────────────────────────

describe('computeForestLayout — back-row x-offset', () => {
	it('row 1+ trees are offset by ROW_X_OFFSET_FRACTION', () => {
		const viewport = createViewport({ width: 1200, height: 800 });

		// Single tree in row 1 — equidistant with 1 item: width*(1)/(1+1) + offset
		const items: ForestLayoutItem[] = [createOak(), createTree('r1', { depthRow: 1 })];
		const result = computeForestLayout(items, viewport);

		const r1 = findItem(result.items, 'r1');
		const rowOffset = 1 * viewport.width * TREE_SPACING_FRACTION * ROW_X_OFFSET_FRACTION;
		const expectedX = rowOffset + (viewport.width * 1) / 2;
		expect(r1.x).toBeCloseTo(expectedX, 0);
	});
});

// ─── Max Depth Clamp ────────────────────────────────────────────────────

describe('computeForestLayout — max depth clamp', () => {
	it('clamps depthRow=15 to MAX_DEPTH_ROWS - 1', () => {
		const viewport = createViewport({ width: 1200, height: 800 });
		const groundY = viewport.height * GROUND_Y_FRACTION;
		const clampedRow = MAX_DEPTH_ROWS - 1;

		const items: ForestLayoutItem[] = [createTree('deep', { depthRow: 15 })];
		const result = computeForestLayout(items, viewport);

		const deep = findItem(result.items, 'deep');
		expect(deep.scale).toBeCloseTo(ROW_SCALE_FACTOR ** clampedRow, 2);
		expect(deep.opacity).toBeCloseTo(ROW_OPACITY_FACTOR ** clampedRow, 2);
		expect(deep.y).toBeCloseTo(
			groundY - clampedRow * viewport.height * ROW_SPACING_Y_FRACTION,
			1,
		);
		expect(deep.rowIndex).toBe(clampedRow);
	});
});

// ─── Deterministic ──────────────────────────────────────────────────────

describe('computeForestLayout — deterministic', () => {
	it('same input twice produces identical output', () => {
		const items: ForestLayoutItem[] = [
			createOak(),
			createTree('t1', { priority: 'high', sortOrder: 1 }),
			createTree('t2', { priority: 'low', sortOrder: 2, depthRow: 1 }),
			createPottedPlant('p1', { depthRow: 0 }),
		];
		const viewport = createViewport();

		const result1 = computeForestLayout(items, viewport);
		const result2 = computeForestLayout(items, viewport);

		expect(result1).toEqual(result2);
	});
});

// ─── Minimum Spacing ───────────────────────────────────────────────────

describe('computeForestLayout — minimum spacing', () => {
	it('enforces minimum spacing between all items', () => {
		const items: ForestLayoutItem[] = [
			createOak(),
			...Array.from({ length: 8 }, (_, i) => createTree(`t${i}`)),
		];
		const viewport = createViewport({ width: 1200, height: 800 });
		const result = computeForestLayout(items, viewport);

		for (let i = 0; i < result.items.length; i++) {
			for (let j = i + 1; j < result.items.length; j++) {
				const distance = euclideanDistance(result.items[i], result.items[j]);
				expect(distance).toBeGreaterThanOrEqual(MIN_SPACING_PX * 0.9); // 10% tolerance
			}
		}
	});
});

// ─── Many Items Row 0 ──────────────────────────────────────────────────

describe('computeForestLayout — many items row 0', () => {
	it('15 trees all depthRow=0 are all positioned equidistantly', () => {
		const viewport = createViewport({ width: 1200, height: 800 });

		const items: ForestLayoutItem[] = [
			createOak(),
			...Array.from({ length: 15 }, (_, i) =>
				createTree(`t${i}`, { sortOrder: i, depthRow: 0 }),
			),
		];
		const result = computeForestLayout(items, viewport);

		// All 16 items should be positioned (15 trees + 1 oak)
		expect(result.items).toHaveLength(16);

		// Non-oak items should be equidistantly distributed
		const nonOakItems = result.items
			.filter((item) => item.id !== 'oak-1')
			.sort((a, b) => a.x - b.x);

		expect(nonOakItems).toHaveLength(15);
		// First item should be at width / 16
		expect(nonOakItems[0].x).toBeCloseTo(viewport.width / 16, 0);
	});
});

// ─── Multiple Rows ─────────────────────────────────────────────────────

describe('computeForestLayout — multiple rows', () => {
	it('items across rows 0, 1, 2 positioned at correct y per row', () => {
		const viewport = createViewport({ width: 1200, height: 800 });
		const groundY = viewport.height * GROUND_Y_FRACTION;

		const items: ForestLayoutItem[] = [
			createOak(),
			createTree('r0', { depthRow: 0 }),
			createTree('r1', { depthRow: 1 }),
			createTree('r2', { depthRow: 2 }),
		];
		const result = computeForestLayout(items, viewport);

		const r0 = findItem(result.items, 'r0');
		const r1 = findItem(result.items, 'r1');
		const r2 = findItem(result.items, 'r2');

		expect(r0.y).toBeCloseTo(groundY, 1);
		expect(r1.y).toBeCloseTo(groundY - viewport.height * ROW_SPACING_Y_FRACTION, 1);
		expect(r2.y).toBeCloseTo(groundY - 2 * viewport.height * ROW_SPACING_Y_FRACTION, 1);

		// Each deeper row should be higher (smaller y)
		expect(r1.y).toBeLessThan(r0.y);
		expect(r2.y).toBeLessThan(r1.y);
	});
});

// ─── Viewport Responsiveness ───────────────────────────────────────────

describe('computeForestLayout — responsive', () => {
	it('different viewport sizes produce proportionally different positions', () => {
		const items = [createOak(), createTree('t1'), createTree('t2')];
		const v1 = createViewport({ width: 1000, height: 800 });
		const v2 = createViewport({ width: 2000, height: 1600 });

		const r1 = computeForestLayout(items, v1);
		const r2 = computeForestLayout(items, v2);

		const oak1 = r1.oakPosition!;
		const oak2 = r2.oakPosition!;
		// x = width/2, so should double
		expect(oak2.x / oak1.x).toBeCloseTo(2.0, 0);
		// y = height * GROUND_Y_FRACTION, so should double
		expect(oak2.y / oak1.y).toBeCloseTo(2.0, 0);
	});
});

// ─── zIndex Ordering ───────────────────────────────────────────────────

describe('computeForestLayout — zIndex ordering', () => {
	it('oak has highest zIndex (100)', () => {
		const items = [createOak(), createTree('t1'), createPottedPlant('p1')];
		const result = computeForestLayout(items, createViewport());

		const oak = result.oakPosition!;
		for (const item of result.items) {
			if (item.id !== oak.id) {
				expect(oak.zIndex).toBeGreaterThan(item.zIndex);
			}
		}
	});

	it('front row has higher zIndex than back rows', () => {
		const items: ForestLayoutItem[] = [
			createTree('front', { depthRow: 0 }),
			createTree('back', { depthRow: 1 }),
			createTree('deeper', { depthRow: 2 }),
		];
		const result = computeForestLayout(items, createViewport());

		const front = findItem(result.items, 'front');
		const back = findItem(result.items, 'back');
		const deeper = findItem(result.items, 'deeper');

		expect(front.zIndex).toBeGreaterThan(back.zIndex);
		expect(back.zIndex).toBeGreaterThan(deeper.zIndex);
	});
});

// ─── All Items Have rowIndex ────────────────────────────────────────────

describe('computeForestLayout — all items have rowIndex', () => {
	it('every positioned item has correct rowIndex matching its depthRow', () => {
		const items: ForestLayoutItem[] = [
			createOak(),
			createTree('r0', { depthRow: 0 }),
			createTree('r1', { depthRow: 1 }),
			createTree('r2', { depthRow: 2 }),
			createPottedPlant('p0', { depthRow: 0 }),
			createPottedPlant('p1', { depthRow: 1 }),
		];
		const result = computeForestLayout(items, createViewport());

		expect(findItem(result.items, 'oak-1').rowIndex).toBe(0);
		expect(findItem(result.items, 'r0').rowIndex).toBe(0);
		expect(findItem(result.items, 'r1').rowIndex).toBe(1);
		expect(findItem(result.items, 'r2').rowIndex).toBe(2);
		expect(findItem(result.items, 'p0').rowIndex).toBe(0);
		expect(findItem(result.items, 'p1').rowIndex).toBe(1);
	});
});

// ─── Potted Plants in Rows ──────────────────────────────────────────────

describe('computeForestLayout — potted plants in rows', () => {
	it('potted plants with depthRow follow same row rules as trees', () => {
		const viewport = createViewport({ width: 1200, height: 800 });
		const groundY = viewport.height * GROUND_Y_FRACTION;

		const items: ForestLayoutItem[] = [
			createPottedPlant('p0', { depthRow: 0 }),
			createPottedPlant('p1', { depthRow: 1 }),
		];
		const result = computeForestLayout(items, viewport);

		const p0 = findItem(result.items, 'p0');
		const p1 = findItem(result.items, 'p1');

		expect(p0.y).toBeCloseTo(groundY, 1);
		expect(p0.scale).toBe(1.0);
		expect(p0.opacity).toBe(1.0);
		expect(p0.rowIndex).toBe(0);

		expect(p1.y).toBeCloseTo(groundY - viewport.height * ROW_SPACING_Y_FRACTION, 1);
		expect(p1.scale).toBeCloseTo(ROW_SCALE_FACTOR, 2);
		expect(p1.opacity).toBeCloseTo(ROW_OPACITY_FACTOR, 2);
		expect(p1.rowIndex).toBe(1);
	});
});

// ─── Stumps in Rows ─────────────────────────────────────────────────────

describe('computeForestLayout — stumps in rows', () => {
	it('stumps with depthRow follow same row rules as trees', () => {
		const viewport = createViewport({ width: 1200, height: 800 });
		const groundY = viewport.height * GROUND_Y_FRACTION;

		const items: ForestLayoutItem[] = [
			createStump('s0', { depthRow: 0 }),
			createStump('s1', { depthRow: 1 }),
		];
		const result = computeForestLayout(items, viewport);

		const s0 = findItem(result.items, 's0');
		const s1 = findItem(result.items, 's1');

		expect(s0.y).toBeCloseTo(groundY, 1);
		expect(s0.scale).toBe(1.0);
		expect(s0.opacity).toBe(1.0);
		expect(s0.rowIndex).toBe(0);

		expect(s1.y).toBeCloseTo(groundY - viewport.height * ROW_SPACING_Y_FRACTION, 1);
		expect(s1.scale).toBeCloseTo(ROW_SCALE_FACTOR, 2);
		expect(s1.opacity).toBeCloseTo(ROW_OPACITY_FACTOR, 2);
		expect(s1.rowIndex).toBe(1);
	});
});

// ════════════════════════════════════════════════════════════════════════
// computeTreeVisualization — issue color canopy override
// ════════════════════════════════════════════════════════════════════════

describe('computeTreeVisualization — issue color canopy override', () => {
	it('uses derived canopy colors when issueColor is chromatic', () => {
		const result = computeTreeVisualization(
			createDimensions({ labels: ['task'] }),
			createContext(),
			undefined,
			undefined,
			'#ff0000',
		) as TreeVisualizationTree;

		expect(result.config.canopyLightColor).not.toBe('#a8d84e');
		expect(result.config.canopyDarkColor).not.toBe('#1a472a');
	});

	it('uses default canopy colors when issueColor is undefined', () => {
		const result = computeTreeVisualization(
			createDimensions({ labels: ['task'] }),
			createContext(),
			undefined,
			undefined,
			undefined,
		) as TreeVisualizationTree;

		expect(result.config.canopyLightColor).toBe('#a8d84e');
		expect(result.config.canopyDarkColor).toBe('#1a472a');
	});

	it('uses default canopy colors when issueColor is null', () => {
		const result = computeTreeVisualization(
			createDimensions({ labels: ['task'] }),
			createContext(),
			undefined,
			undefined,
			null,
		) as TreeVisualizationTree;

		expect(result.config.canopyLightColor).toBe('#a8d84e');
		expect(result.config.canopyDarkColor).toBe('#1a472a');
	});
});
