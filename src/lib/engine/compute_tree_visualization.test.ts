import { describe, it, expect } from 'vitest';
import { compute_tree_visualization } from './compute_tree_visualization';
import { TREE_STAGES, POTTED_PLANT_STAGES, TOOL_TYPES } from '$lib/types/tree_visualization';
import type {
	StateDimensions,
	TreeVisualizationTree,
	TreeVisualizationPottedPlant,
	TreeVisualizationOak,
	TreeComputeContext,
} from '$lib/types/tree_visualization';

function create_dimensions(overrides: Partial<StateDimensions> = {}): StateDimensions {
	return {
		labels: ['AFK'],
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

function create_context(overrides: Partial<TreeComputeContext> = {}): TreeComputeContext {
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

// ─── Kind Determination ──────────────────────────────────────────────────

describe('compute_tree_visualization — kind determination', () => {
	it('returns oak when isPrd is true', () => {
		const result = compute_tree_visualization(
			create_dimensions(),
			create_context({ isPrd: true }),
		);
		expect(result.kind).toBe('oak');
	});

	it('returns tree when labels are set', () => {
		const result = compute_tree_visualization(create_dimensions({ labels: ['feature'] }));
		expect(result.kind).toBe('tree');
	});

	it('returns potted-plant when labels are empty', () => {
		const result = compute_tree_visualization(create_dimensions({ labels: [] }));
		expect(result.kind).toBe('potted-plant');
	});
});

// ─── Tree Stages ─────────────────────────────────────────────────────────

describe('compute_tree_visualization — tree stages', () => {
	it('seed: labels=["feature"], worktreeState=none, no session', () => {
		const result = compute_tree_visualization(
			create_dimensions({
				labels: ['feature'],
				worktreeState: 'none',
				aggregateSessionState: 'no-session',
			}),
		) as TreeVisualizationTree;
		expect(result.kind).toBe('tree');
		expect(result.config.stage).toBe(TREE_STAGES.seed);
	});

	it('sprouting: worktreeState=pending', () => {
		const result = compute_tree_visualization(
			create_dimensions({ worktreeState: 'pending' }),
		) as TreeVisualizationTree;
		expect(result.config.stage).toBe(TREE_STAGES.sprouting);
	});

	it('sapling: worktreeState=active, branchStatus=active, no session', () => {
		const result = compute_tree_visualization(
			create_dimensions({
				worktreeState: 'active',
				branchStatus: 'active',
				aggregateSessionState: 'no-session',
			}),
		) as TreeVisualizationTree;
		expect(result.config.stage).toBe(TREE_STAGES.sapling);
	});

	it('growing: aggregateSessionState=running, no completed session', () => {
		const result = compute_tree_visualization(
			create_dimensions({
				worktreeState: 'active',
				branchStatus: 'active',
				aggregateSessionState: 'running',
			}),
			create_context({ hasCompletedSession: false }),
		) as TreeVisualizationTree;
		expect(result.config.stage).toBe(TREE_STAGES.growing);
	});

	it('growing: aggregateSessionState=running, with completed session (re-execution)', () => {
		const result = compute_tree_visualization(
			create_dimensions({
				worktreeState: 'active',
				branchStatus: 'active',
				aggregateSessionState: 'running',
			}),
			create_context({ hasCompletedSession: true }),
		) as TreeVisualizationTree;
		expect(result.config.stage).toBe(TREE_STAGES.growing);
	});

	it('leafy: aggregateSessionState=finished, hasCommitsOnBranch=true', () => {
		const result = compute_tree_visualization(
			create_dimensions({
				worktreeState: 'active',
				branchStatus: 'active',
				aggregateSessionState: 'finished',
			}),
			create_context({ hasCommitsOnBranch: true }),
		) as TreeVisualizationTree;
		expect(result.config.stage).toBe(TREE_STAGES.leafy);
	});

	it('fruiting: pullRequestState=draft', () => {
		const result = compute_tree_visualization(
			create_dimensions({
				worktreeState: 'active',
				branchStatus: 'active',
				pullRequestState: 'draft',
			}),
		) as TreeVisualizationTree;
		expect(result.config.stage).toBe(TREE_STAGES.fruiting);
	});

	it('fruiting: pullRequestState=open', () => {
		const result = compute_tree_visualization(
			create_dimensions({
				worktreeState: 'active',
				branchStatus: 'active',
				pullRequestState: 'open',
			}),
		) as TreeVisualizationTree;
		expect(result.config.stage).toBe(TREE_STAGES.fruiting);
	});

	it('seasonal: pullRequestState=review-requested', () => {
		const result = compute_tree_visualization(
			create_dimensions({ pullRequestState: 'review-requested' }),
		) as TreeVisualizationTree;
		expect(result.config.stage).toBe(TREE_STAGES.seasonal);
	});

	it('seasonal: pullRequestState=changes-requested', () => {
		const result = compute_tree_visualization(
			create_dimensions({ pullRequestState: 'changes-requested' }),
		) as TreeVisualizationTree;
		expect(result.config.stage).toBe(TREE_STAGES.seasonal);
	});

	it('flowering: pullRequestState=approved', () => {
		const result = compute_tree_visualization(
			create_dimensions({ pullRequestState: 'approved' }),
		) as TreeVisualizationTree;
		expect(result.config.stage).toBe(TREE_STAGES.flowering);
	});

	it('leafy with glow: pullRequestState=ready-to-merge', () => {
		const result = compute_tree_visualization(
			create_dimensions({ pullRequestState: 'ready-to-merge' }),
		) as TreeVisualizationTree;
		expect(result.config.stage).toBe(TREE_STAGES.seasonal);
		expect(result.overlayConfig.glow.enabled).toBe(true);
	});

	it('bare: pullRequestState=merged, githubIssueState=closed', () => {
		const result = compute_tree_visualization(
			create_dimensions({ pullRequestState: 'merged', githubIssueState: 'closed' }),
		) as TreeVisualizationTree;
		expect(result.config.stage).toBe(TREE_STAGES.bare);
	});

	it('dead: branchStatus=deleted', () => {
		const result = compute_tree_visualization(
			create_dimensions({ branchStatus: 'deleted', worktreeState: 'active' }),
		) as TreeVisualizationTree;
		expect(result.config.stage).toBe(TREE_STAGES.dead);
	});

	it('stump: worktreeState=removed, grovekeeperStatus=archived', () => {
		const result = compute_tree_visualization(
			create_dimensions({ worktreeState: 'removed', grovekeeperStatus: 'archived' }),
		) as TreeVisualizationTree;
		expect(result.config.stage).toBe(TREE_STAGES.stump);
	});
});

// ─── Tree Stage Priority ─────────────────────────────────────────────────

describe('compute_tree_visualization — tree stage priority', () => {
	it('bare wins over sapling when PR merged and issue closed', () => {
		const result = compute_tree_visualization(
			create_dimensions({
				worktreeState: 'active',
				branchStatus: 'active',
				pullRequestState: 'merged',
				githubIssueState: 'closed',
				aggregateSessionState: 'no-session',
			}),
		) as TreeVisualizationTree;
		expect(result.config.stage).toBe(TREE_STAGES.bare);
	});
});

// ─── Potted Plant Stages ─────────────────────────────────────────────────

describe('compute_tree_visualization — potted plant stages', () => {
	it('pot-with-soil: default for labels=[]', () => {
		const result = compute_tree_visualization(
			create_dimensions({ labels: [] }),
		) as TreeVisualizationPottedPlant;
		expect(result.kind).toBe('potted-plant');
		expect(result.stage).toBe(POTTED_PLANT_STAGES.potWithSoil);
	});

	it('sprout: has session activity but no completed session', () => {
		const result = compute_tree_visualization(
			create_dimensions({ labels: [], aggregateSessionState: 'running' }),
			create_context({ hasCompletedSession: false }),
		) as TreeVisualizationPottedPlant;
		expect(result.stage).toBe(POTTED_PLANT_STAGES.sprout);
	});

	it('small-plant: hasCompletedSession=true', () => {
		const result = compute_tree_visualization(
			create_dimensions({ labels: [], aggregateSessionState: 'finished' }),
			create_context({ hasCompletedSession: true }),
		) as TreeVisualizationPottedPlant;
		expect(result.stage).toBe(POTTED_PLANT_STAGES.smallPlant);
	});

	it('flowering: has PR activity', () => {
		const result = compute_tree_visualization(
			create_dimensions({ labels: [], pullRequestState: 'draft' }),
			create_context({ hasCompletedSession: true }),
		) as TreeVisualizationPottedPlant;
		expect(result.stage).toBe(POTTED_PLANT_STAGES.flowering);
	});

	it('dried: githubIssueState=closed', () => {
		const result = compute_tree_visualization(
			create_dimensions({ labels: [], githubIssueState: 'closed' }),
		) as TreeVisualizationPottedPlant;
		expect(result.stage).toBe(POTTED_PLANT_STAGES.dried);
	});
});

// ─── Oak ─────────────────────────────────────────────────────────────────

describe('compute_tree_visualization — oak', () => {
	it('isPrd=true returns oak', () => {
		const result = compute_tree_visualization(
			create_dimensions(),
			create_context({ isPrd: true }),
		) as TreeVisualizationOak;
		expect(result.kind).toBe('oak');
	});

	it('oak includes title from context', () => {
		const result = compute_tree_visualization(
			create_dimensions(),
			create_context({ isPrd: true, prdTitle: 'Forest Dashboard' }),
		) as TreeVisualizationOak;
		expect(result.title).toBe('Forest Dashboard');
	});

	it('oak includes completionRatio from context', () => {
		const result = compute_tree_visualization(
			create_dimensions(),
			create_context({ isPrd: true, subIssueCompletionRatio: 0.75 }),
		) as TreeVisualizationOak;
		expect(result.completionRatio).toBe(0.75);
	});

	it('oak defaults to empty title and zero ratio', () => {
		const result = compute_tree_visualization(
			create_dimensions(),
			create_context({ isPrd: true }),
		) as TreeVisualizationOak;
		expect(result.title).toBe('');
		expect(result.completionRatio).toBe(0);
	});
});

// ─── Tool Visibility ────────────────────────────────────────────────────

describe('compute_tree_visualization — tool visibility', () => {
	it('stormCloud visible when worktreeState=failed', () => {
		const result = compute_tree_visualization(
			create_dimensions({ worktreeState: 'failed' }),
		) as TreeVisualizationTree;
		expect(result.toolVisibility[TOOL_TYPES.stormCloud].visible).toBe(true);
	});

	it('stormCloud visible when aggregateSessionState=errored', () => {
		const result = compute_tree_visualization(
			create_dimensions({ aggregateSessionState: 'errored' }),
		) as TreeVisualizationTree;
		expect(result.toolVisibility[TOOL_TYPES.stormCloud].visible).toBe(true);
	});

	it('speechBubble visible when aggregateSessionState=needs-input', () => {
		const result = compute_tree_visualization(
			create_dimensions({ aggregateSessionState: 'needs-input' }),
		) as TreeVisualizationTree;
		expect(result.toolVisibility[TOOL_TYPES.speechBubble].visible).toBe(true);
	});

	it('wateringCan visible when aggregateSessionState=running', () => {
		const result = compute_tree_visualization(
			create_dimensions({ aggregateSessionState: 'running' }),
		) as TreeVisualizationTree;
		expect(result.toolVisibility[TOOL_TYPES.wateringCan].visible).toBe(true);
	});

	it('woodpecker visible when pullRequestState=review-requested', () => {
		const result = compute_tree_visualization(
			create_dimensions({ pullRequestState: 'review-requested' }),
		) as TreeVisualizationTree;
		expect(result.toolVisibility[TOOL_TYPES.woodpecker].visible).toBe(true);
	});

	it('no tools visible when all clear', () => {
		const result = compute_tree_visualization(create_dimensions()) as TreeVisualizationTree;
		const visible_tools = Object.values(result.toolVisibility).filter(
			(entry) => entry.visible === true,
		);
		expect(visible_tools).toHaveLength(0);
	});
});

// ─── Overlay Config ─────────────────────────────────────────────────────

describe('compute_tree_visualization — overlay config', () => {
	it('glow enabled when pullRequestState=approved', () => {
		const result = compute_tree_visualization(
			create_dimensions({ pullRequestState: 'approved' }),
		) as TreeVisualizationTree;
		expect(result.overlayConfig.glow.enabled).toBe(true);
	});

	it('glow enabled when pullRequestState=ready-to-merge', () => {
		const result = compute_tree_visualization(
			create_dimensions({ pullRequestState: 'ready-to-merge' }),
		) as TreeVisualizationTree;
		expect(result.overlayConfig.glow.enabled).toBe(true);
	});

	it('glow disabled by default', () => {
		const result = compute_tree_visualization(create_dimensions()) as TreeVisualizationTree;
		expect(result.overlayConfig.glow.enabled).toBe(false);
	});
});

// ─── Shape Mapping ───────────────────────────────────────────────────────

describe('compute_tree_visualization — shape mapping', () => {
	it('bug label maps to maple', () => {
		const result = compute_tree_visualization(
			create_dimensions({ labels: ['bug'] }),
		) as TreeVisualizationTree;
		expect(result.config.shape).toBe('maple');
	});

	it('feature label maps to oak', () => {
		const result = compute_tree_visualization(
			create_dimensions({ labels: ['feature'] }),
		) as TreeVisualizationTree;
		expect(result.config.shape).toBe('oak');
	});

	it('task label maps to pine', () => {
		const result = compute_tree_visualization(
			create_dimensions({ labels: ['task'] }),
		) as TreeVisualizationTree;
		expect(result.config.shape).toBe('pine');
	});

	it('default shape is cherry when no known label', () => {
		const result = compute_tree_visualization(
			create_dimensions({ labels: ['unknown-label'] }),
		) as TreeVisualizationTree;
		expect(result.config.shape).toBe('cherry');
	});

	it('prd label takes priority over bug', () => {
		const result = compute_tree_visualization(
			create_dimensions({ labels: ['bug', 'prd'] }),
		) as TreeVisualizationTree;
		expect(result.config.shape).toBe('apple');
	});
});

// ─── Deterministic Seed ──────────────────────────────────────────────────

describe('compute_tree_visualization — deterministic seed', () => {
	it('same issueId produces same seed', () => {
		const result1 = compute_tree_visualization(
			create_dimensions(),
			create_context({ issueId: 'abc-123' }),
		) as TreeVisualizationTree;
		const result2 = compute_tree_visualization(
			create_dimensions(),
			create_context({ issueId: 'abc-123' }),
		) as TreeVisualizationTree;
		expect(result1.config.seed).toBe(result2.config.seed);
	});

	it('different issueId produces different seed', () => {
		const result1 = compute_tree_visualization(
			create_dimensions(),
			create_context({ issueId: 'abc-123' }),
		) as TreeVisualizationTree;
		const result2 = compute_tree_visualization(
			create_dimensions(),
			create_context({ issueId: 'def-456' }),
		) as TreeVisualizationTree;
		expect(result1.config.seed).not.toBe(result2.config.seed);
	});
});
