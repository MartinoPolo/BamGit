import { describe, it, expect } from 'vitest';
import { computeTreeVisualization } from './compute_tree_visualization';
import { TREE_STAGES, POTTED_PLANT_STAGES, TOOL_TYPES } from '$lib/types/tree_visualization';
import type {
	StateDimensions,
	TreeVisualizationTree,
	TreeVisualizationPottedPlant,
	TreeVisualizationOak,
	TreeComputeContext,
} from '$lib/types/tree_visualization';

function createDimensions(overrides: Partial<StateDimensions> = {}): StateDimensions {
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

// ─── Kind Determination ──────────────────────────────────────────────────

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

// ─── Tree Stages ─────────────────────────────────────────────────────────

describe('computeTreeVisualization — tree stages', () => {
	it('seed: labels=["feature"], worktreeState=none, no session', () => {
		const result = computeTreeVisualization(
			createDimensions({
				labels: ['feature'],
				worktreeState: 'none',
				aggregateSessionState: 'no-session',
			}),
		) as TreeVisualizationTree;
		expect(result.kind).toBe('tree');
		expect(result.config.stage).toBe(TREE_STAGES.seed);
	});

	it('sprouting: worktreeState=pending', () => {
		const result = computeTreeVisualization(
			createDimensions({ worktreeState: 'pending' }),
		) as TreeVisualizationTree;
		expect(result.config.stage).toBe(TREE_STAGES.sprouting);
	});

	it('sapling: worktreeState=active, branchStatus=active, no session', () => {
		const result = computeTreeVisualization(
			createDimensions({
				worktreeState: 'active',
				branchStatus: 'active',
				aggregateSessionState: 'no-session',
			}),
		) as TreeVisualizationTree;
		expect(result.config.stage).toBe(TREE_STAGES.sapling);
	});

	it('growing: aggregateSessionState=running, no completed session', () => {
		const result = computeTreeVisualization(
			createDimensions({
				worktreeState: 'active',
				branchStatus: 'active',
				aggregateSessionState: 'running',
			}),
			createContext({ hasCompletedSession: false }),
		) as TreeVisualizationTree;
		expect(result.config.stage).toBe(TREE_STAGES.growing);
	});

	it('growing: aggregateSessionState=running, with completed session (re-execution)', () => {
		const result = computeTreeVisualization(
			createDimensions({
				worktreeState: 'active',
				branchStatus: 'active',
				aggregateSessionState: 'running',
			}),
			createContext({ hasCompletedSession: true }),
		) as TreeVisualizationTree;
		expect(result.config.stage).toBe(TREE_STAGES.growing);
	});

	it('leafy: aggregateSessionState=finished, hasCommitsOnBranch=true', () => {
		const result = computeTreeVisualization(
			createDimensions({
				worktreeState: 'active',
				branchStatus: 'active',
				aggregateSessionState: 'finished',
			}),
			createContext({ hasCommitsOnBranch: true }),
		) as TreeVisualizationTree;
		expect(result.config.stage).toBe(TREE_STAGES.leafy);
	});

	it('fruiting: pullRequestState=draft', () => {
		const result = computeTreeVisualization(
			createDimensions({
				worktreeState: 'active',
				branchStatus: 'active',
				pullRequestState: 'draft',
			}),
		) as TreeVisualizationTree;
		expect(result.config.stage).toBe(TREE_STAGES.fruiting);
	});

	it('fruiting: pullRequestState=open', () => {
		const result = computeTreeVisualization(
			createDimensions({
				worktreeState: 'active',
				branchStatus: 'active',
				pullRequestState: 'open',
			}),
		) as TreeVisualizationTree;
		expect(result.config.stage).toBe(TREE_STAGES.fruiting);
	});

	it('seasonal: pullRequestState=review-requested', () => {
		const result = computeTreeVisualization(
			createDimensions({ pullRequestState: 'review-requested' }),
		) as TreeVisualizationTree;
		expect(result.config.stage).toBe(TREE_STAGES.seasonal);
	});

	it('seasonal: pullRequestState=changes-requested', () => {
		const result = computeTreeVisualization(
			createDimensions({ pullRequestState: 'changes-requested' }),
		) as TreeVisualizationTree;
		expect(result.config.stage).toBe(TREE_STAGES.seasonal);
	});

	it('flowering: pullRequestState=approved', () => {
		const result = computeTreeVisualization(
			createDimensions({ pullRequestState: 'approved' }),
		) as TreeVisualizationTree;
		expect(result.config.stage).toBe(TREE_STAGES.flowering);
	});

	it('leafy with glow: pullRequestState=ready-to-merge', () => {
		const result = computeTreeVisualization(
			createDimensions({ pullRequestState: 'ready-to-merge' }),
		) as TreeVisualizationTree;
		expect(result.config.stage).toBe(TREE_STAGES.seasonal);
		expect(result.overlayConfig.glow.enabled).toBe(true);
	});

	it('bare: pullRequestState=merged, githubIssueState=closed', () => {
		const result = computeTreeVisualization(
			createDimensions({ pullRequestState: 'merged', githubIssueState: 'closed' }),
		) as TreeVisualizationTree;
		expect(result.config.stage).toBe(TREE_STAGES.bare);
	});

	it('dead: branchStatus=deleted', () => {
		const result = computeTreeVisualization(
			createDimensions({ branchStatus: 'deleted', worktreeState: 'active' }),
		) as TreeVisualizationTree;
		expect(result.config.stage).toBe(TREE_STAGES.dead);
	});

	it('stump: worktreeState=removed, grovekeeperStatus=archived', () => {
		const result = computeTreeVisualization(
			createDimensions({ worktreeState: 'removed', grovekeeperStatus: 'archived' }),
		) as TreeVisualizationTree;
		expect(result.config.stage).toBe(TREE_STAGES.stump);
	});
});

// ─── Tree Stage Priority ─────────────────────────────────────────────────

describe('computeTreeVisualization — tree stage priority', () => {
	it('bare wins over sapling when PR merged and issue closed', () => {
		const result = computeTreeVisualization(
			createDimensions({
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

// ─── Oak ─────────────────────────────────────────────────────────────────

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

// ─── Tool Visibility ────────────────────────────────────────────────────

describe('computeTreeVisualization — tool visibility', () => {
	it('stormCloud visible when worktreeState=failed', () => {
		const result = computeTreeVisualization(
			createDimensions({ worktreeState: 'failed' }),
		) as TreeVisualizationTree;
		expect(result.toolVisibility[TOOL_TYPES.stormCloud].visible).toBe(true);
	});

	it('stormCloud visible when aggregateSessionState=errored', () => {
		const result = computeTreeVisualization(
			createDimensions({ aggregateSessionState: 'errored' }),
		) as TreeVisualizationTree;
		expect(result.toolVisibility[TOOL_TYPES.stormCloud].visible).toBe(true);
	});

	it('speechBubble visible when aggregateSessionState=needs-input', () => {
		const result = computeTreeVisualization(
			createDimensions({ aggregateSessionState: 'needs-input' }),
		) as TreeVisualizationTree;
		expect(result.toolVisibility[TOOL_TYPES.speechBubble].visible).toBe(true);
	});

	it('wateringCan visible when aggregateSessionState=running', () => {
		const result = computeTreeVisualization(
			createDimensions({ aggregateSessionState: 'running' }),
		) as TreeVisualizationTree;
		expect(result.toolVisibility[TOOL_TYPES.wateringCan].visible).toBe(true);
	});

	it('woodpecker visible when pullRequestState=review-requested', () => {
		const result = computeTreeVisualization(
			createDimensions({ pullRequestState: 'review-requested' }),
		) as TreeVisualizationTree;
		expect(result.toolVisibility[TOOL_TYPES.woodpecker].visible).toBe(true);
	});

	it('no tools visible when all clear', () => {
		const result = computeTreeVisualization(createDimensions()) as TreeVisualizationTree;
		const visibleTools = Object.values(result.toolVisibility).filter(
			(entry: any) => entry.visible === true,
		);
		expect(visibleTools).toHaveLength(0);
	});
});

// ─── Overlay Config ─────────────────────────────────────────────────────

describe('computeTreeVisualization — overlay config', () => {
	it('glow enabled when pullRequestState=approved', () => {
		const result = computeTreeVisualization(
			createDimensions({ pullRequestState: 'approved' }),
		) as TreeVisualizationTree;
		expect(result.overlayConfig.glow.enabled).toBe(true);
	});

	it('glow enabled when pullRequestState=ready-to-merge', () => {
		const result = computeTreeVisualization(
			createDimensions({ pullRequestState: 'ready-to-merge' }),
		) as TreeVisualizationTree;
		expect(result.overlayConfig.glow.enabled).toBe(true);
	});

	it('glow disabled by default', () => {
		const result = computeTreeVisualization(createDimensions()) as TreeVisualizationTree;
		expect(result.overlayConfig.glow.enabled).toBe(false);
	});
});

// ─── Shape Mapping ───────────────────────────────────────────────────────

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

// ─── Deterministic Seed ──────────────────────────────────────────────────

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
