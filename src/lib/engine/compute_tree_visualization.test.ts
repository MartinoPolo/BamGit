import { describe, it, expect } from 'vitest';
import { compute_tree_visualization } from './compute_tree_visualization';
import type {
	StateDimensions,
	TreeVisualizationTree,
	TreeVisualizationPottedPlant,
	TreeVisualizationOak,
	TreeComputeContext,
} from '$lib/types/tree_visualization';

function create_dimensions(overrides: Partial<StateDimensions> = {}): StateDimensions {
	return {
		label: 'AFK',
		worktreeState: 'none',
		aggregateSessionState: 'no-session',
		executionPhase: 'none',
		branchStatus: 'no-branch',
		pullRequestState: 'no-pr',
		githubIssueState: 'open',
		syncStatus: { type: 'up-to-date' },
		bamgitStatus: 'active',
		...overrides,
	};
}

function create_context(overrides: Partial<TreeComputeContext> = {}): TreeComputeContext {
	return {
		isPrd: false,
		prdTitle: '',
		subIssueCompletionRatio: 0,
		hasCompletedSession: false,
		hasCommitsOnBranch: false,
		sessionCount: 0,
		companionSaplings: [],
		activeTools: [],
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

	it('returns tree when label is set', () => {
		const result = compute_tree_visualization(create_dimensions({ label: 'HITL' }));
		expect(result.kind).toBe('tree');
	});

	it('returns potted-plant when label is null', () => {
		const result = compute_tree_visualization(create_dimensions({ label: null }));
		expect(result.kind).toBe('potted-plant');
	});
});

// ─── Tree Stages ─────────────────────────────────────────────────────────

describe('compute_tree_visualization — tree stages', () => {
	it('seed: label=HITL, worktreeState=none, no session', () => {
		const result = compute_tree_visualization(
			create_dimensions({
				label: 'HITL',
				worktreeState: 'none',
				aggregateSessionState: 'no-session',
			}),
		) as TreeVisualizationTree;
		expect(result.kind).toBe('tree');
		expect(result.stage).toBe('seed');
	});

	it('sprouting: label=AFK, worktreeState=none', () => {
		const result = compute_tree_visualization(
			create_dimensions({ label: 'AFK', worktreeState: 'none' }),
		) as TreeVisualizationTree;
		expect(result.kind).toBe('tree');
		expect(result.stage).toBe('sprouting');
	});

	it('sprouting: label=AFK, worktreeState=pending', () => {
		const result = compute_tree_visualization(
			create_dimensions({ label: 'AFK', worktreeState: 'pending' }),
		) as TreeVisualizationTree;
		expect(result.kind).toBe('tree');
		expect(result.stage).toBe('sprouting');
	});

	it('sapling: worktreeState=active, branchStatus=active, no session', () => {
		const result = compute_tree_visualization(
			create_dimensions({
				worktreeState: 'active',
				branchStatus: 'active',
				aggregateSessionState: 'no-session',
			}),
		) as TreeVisualizationTree;
		expect(result.kind).toBe('tree');
		expect(result.stage).toBe('sapling');
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
		expect(result.kind).toBe('tree');
		expect(result.stage).toBe('growing');
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
		expect(result.kind).toBe('tree');
		expect(result.stage).toBe('leafy');
	});

	it('fruiting: pullRequestState=draft', () => {
		const result = compute_tree_visualization(
			create_dimensions({
				worktreeState: 'active',
				branchStatus: 'active',
				pullRequestState: 'draft',
			}),
		) as TreeVisualizationTree;
		expect(result.kind).toBe('tree');
		expect(result.stage).toBe('fruiting');
	});

	it('fruiting: pullRequestState=open', () => {
		const result = compute_tree_visualization(
			create_dimensions({
				worktreeState: 'active',
				branchStatus: 'active',
				pullRequestState: 'open',
			}),
		) as TreeVisualizationTree;
		expect(result.kind).toBe('tree');
		expect(result.stage).toBe('fruiting');
	});

	it('autumn: pullRequestState=review-requested', () => {
		const result = compute_tree_visualization(
			create_dimensions({ pullRequestState: 'review-requested' }),
		) as TreeVisualizationTree;
		expect(result.kind).toBe('tree');
		expect(result.stage).toBe('autumn');
	});

	it('autumn: pullRequestState=changes-requested', () => {
		const result = compute_tree_visualization(
			create_dimensions({ pullRequestState: 'changes-requested' }),
		) as TreeVisualizationTree;
		expect(result.kind).toBe('tree');
		expect(result.stage).toBe('autumn');
	});

	it('autumn: pullRequestState=approved', () => {
		const result = compute_tree_visualization(
			create_dimensions({ pullRequestState: 'approved' }),
		) as TreeVisualizationTree;
		expect(result.kind).toBe('tree');
		expect(result.stage).toBe('autumn');
	});

	it('ready: pullRequestState=ready-to-merge', () => {
		const result = compute_tree_visualization(
			create_dimensions({ pullRequestState: 'ready-to-merge' }),
		) as TreeVisualizationTree;
		expect(result.kind).toBe('tree');
		expect(result.stage).toBe('ready');
	});

	it('bare: pullRequestState=merged, githubIssueState=closed', () => {
		const result = compute_tree_visualization(
			create_dimensions({ pullRequestState: 'merged', githubIssueState: 'closed' }),
		) as TreeVisualizationTree;
		expect(result.kind).toBe('tree');
		expect(result.stage).toBe('bare');
	});

	it('dead: branchStatus=deleted', () => {
		const result = compute_tree_visualization(
			create_dimensions({ branchStatus: 'deleted', worktreeState: 'active' }),
		) as TreeVisualizationTree;
		expect(result.kind).toBe('tree');
		expect(result.stage).toBe('dead');
	});

	it('stump: worktreeState=removed, bamgitStatus=archived', () => {
		const result = compute_tree_visualization(
			create_dimensions({ worktreeState: 'removed', bamgitStatus: 'archived' }),
		) as TreeVisualizationTree;
		expect(result.kind).toBe('tree');
		expect(result.stage).toBe('stump');
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
		expect(result.stage).toBe('bare');
	});
});

// ─── Potted Plant Stages ─────────────────────────────────────────────────

describe('compute_tree_visualization — potted plant stages', () => {
	it('pot-with-soil: default for label=null', () => {
		const result = compute_tree_visualization(
			create_dimensions({ label: null }),
		) as TreeVisualizationPottedPlant;
		expect(result.kind).toBe('potted-plant');
		expect(result.stage).toBe('pot-with-soil');
	});

	it('sprout: has session activity but no completed session', () => {
		const result = compute_tree_visualization(
			create_dimensions({ label: null, aggregateSessionState: 'running' }),
			create_context({ hasCompletedSession: false }),
		) as TreeVisualizationPottedPlant;
		expect(result.kind).toBe('potted-plant');
		expect(result.stage).toBe('sprout');
	});

	it('small-plant: hasCompletedSession=true', () => {
		const result = compute_tree_visualization(
			create_dimensions({ label: null, aggregateSessionState: 'finished' }),
			create_context({ hasCompletedSession: true }),
		) as TreeVisualizationPottedPlant;
		expect(result.kind).toBe('potted-plant');
		expect(result.stage).toBe('small-plant');
	});

	it('flowering: has PR activity', () => {
		const result = compute_tree_visualization(
			create_dimensions({ label: null, pullRequestState: 'draft' }),
			create_context({ hasCompletedSession: true }),
		) as TreeVisualizationPottedPlant;
		expect(result.kind).toBe('potted-plant');
		expect(result.stage).toBe('flowering');
	});

	it('dried: githubIssueState=closed', () => {
		const result = compute_tree_visualization(
			create_dimensions({ label: null, githubIssueState: 'closed' }),
		) as TreeVisualizationPottedPlant;
		expect(result.kind).toBe('potted-plant');
		expect(result.stage).toBe('dried');
	});
});

// ─── Oak ─────────────────────────────────────────────────────────────────

describe('compute_tree_visualization — oak', () => {
	it('isPrd=true returns oak with overlays array', () => {
		const result = compute_tree_visualization(
			create_dimensions(),
			create_context({ isPrd: true }),
		) as TreeVisualizationOak;
		expect(result.kind).toBe('oak');
		expect(result.overlays).toEqual([]);
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

// ─── Overlays ────────────────────────────────────────────────────────────

describe('compute_tree_visualization — overlays', () => {
	it('error-damage when worktreeState=failed', () => {
		const result = compute_tree_visualization(create_dimensions({ worktreeState: 'failed' }));
		expect(result.overlays).toContain('error-damage');
	});

	it('error-damage when aggregateSessionState=errored', () => {
		const result = compute_tree_visualization(
			create_dimensions({ aggregateSessionState: 'errored' }),
		);
		expect(result.overlays).toContain('error-damage');
	});

	it('merge-conflict when syncStatus.type=merge-conflict', () => {
		const result = compute_tree_visualization(
			create_dimensions({ syncStatus: { type: 'merge-conflict' } }),
		);
		expect(result.overlays).toContain('merge-conflict');
	});

	it('behind-base when syncStatus.type=behind-base', () => {
		const result = compute_tree_visualization(
			create_dimensions({ syncStatus: { type: 'behind-base', count: 3 } }),
		);
		expect(result.overlays).toContain('behind-base');
	});

	it('needs-input when aggregateSessionState=needs-input', () => {
		const result = compute_tree_visualization(
			create_dimensions({ aggregateSessionState: 'needs-input' }),
		);
		expect(result.overlays).toContain('needs-input');
	});

	it('changes-requested when pullRequestState=changes-requested', () => {
		const result = compute_tree_visualization(
			create_dimensions({ pullRequestState: 'changes-requested' }),
		);
		expect(result.overlays).toContain('changes-requested');
	});

	it('approved when pullRequestState=approved', () => {
		const result = compute_tree_visualization(
			create_dimensions({ pullRequestState: 'approved' }),
		);
		expect(result.overlays).toContain('approved');
	});

	it('multiple overlays can stack', () => {
		const result = compute_tree_visualization(
			create_dimensions({
				worktreeState: 'failed',
				aggregateSessionState: 'needs-input',
				syncStatus: { type: 'merge-conflict' },
			}),
		);
		expect(result.overlays).toContain('error-damage');
		expect(result.overlays).toContain('needs-input');
		expect(result.overlays).toContain('merge-conflict');
	});

	it('no overlays when all clear', () => {
		const result = compute_tree_visualization(create_dimensions());
		expect(result.overlays).toEqual([]);
	});
});

// ─── Fruit Types ─────────────────────────────────────────────────────────

describe('compute_tree_visualization — fruit types', () => {
	it('no fruit when sessionCount=0', () => {
		const result = compute_tree_visualization(
			create_dimensions(),
			create_context({ sessionCount: 0 }),
		) as TreeVisualizationTree;
		expect(result.fruitTypes).toEqual([]);
	});

	it('assigns fruit types based on sessionCount', () => {
		const result = compute_tree_visualization(
			create_dimensions(),
			create_context({ sessionCount: 3 }),
		) as TreeVisualizationTree;
		expect(result.fruitTypes).toHaveLength(3);
	});

	it('fruit types rotate through available types', () => {
		const result = compute_tree_visualization(
			create_dimensions(),
			create_context({ sessionCount: 7 }),
		) as TreeVisualizationTree;
		expect(result.fruitTypes).toHaveLength(7);
		expect(result.fruitTypes[5]).toBe(result.fruitTypes[0]);
	});
});

// ─── Context Passthrough ─────────────────────────────────────────────────

describe('compute_tree_visualization — context passthrough', () => {
	it('companion saplings passed through in tree kind', () => {
		const saplings = [{ agentType: 'coder', state: 'active' as const }];
		const result = compute_tree_visualization(
			create_dimensions(),
			create_context({ companionSaplings: saplings }),
		) as TreeVisualizationTree;
		expect(result.companionSaplings).toEqual(saplings);
	});

	it('active tools passed through in tree kind', () => {
		const tools = ['bash' as const, 'grep' as const];
		const result = compute_tree_visualization(
			create_dimensions(),
			create_context({ activeTools: tools }),
		) as TreeVisualizationTree;
		expect(result.activeTools).toEqual(tools);
	});

	it('uses default context when context not provided', () => {
		const result = compute_tree_visualization(create_dimensions()) as TreeVisualizationTree;
		expect(result.kind).toBe('tree');
		expect(result.companionSaplings).toEqual([]);
		expect(result.activeTools).toEqual([]);
		expect(result.fruitTypes).toEqual([]);
	});
});
