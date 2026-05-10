import { describe, it, expect } from 'vitest';
import type { Issue } from '$lib/modules/issues';
import { computeDependencyLayout, computePrdsLayout, computeSinglePrdLayout } from './dagre_layout';
import type { IssueDependency } from '$lib/types/generated';
import { NODE_WIDTH, NODE_HEIGHT } from './types';

const PRD_LABEL = { name: 'prd', color: '#000' };

function makeIssue(overrides: Partial<Issue> = {}): Issue {
	return {
		id: 'issue-1',
		dashboard_id: 'dash-1',
		name: 'Test',
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

function makeDependency(blockerId: string, blockedId: string, id?: string): IssueDependency {
	return {
		id: id ?? `dep-${blockerId}-${blockedId}`,
		blocker_issue_id: blockerId,
		blocked_issue_id: blockedId,
	};
}

function makeLinearChain() {
	const issues = [
		makeIssue({ id: 'a', name: 'A' }),
		makeIssue({ id: 'b', name: 'B' }),
		makeIssue({ id: 'c', name: 'C' }),
	];
	const deps = [makeDependency('a', 'b'), makeDependency('b', 'c')];
	return { issues, deps, result: computeDependencyLayout(issues, deps) };
}

describe('computeDependencyLayout (global view)', () => {
	it('returns empty result when no dependencies', () => {
		const result = computeDependencyLayout(
			[makeIssue({ id: 'a' }), makeIssue({ id: 'b' })],
			[],
		);
		expect(result.nodes).toHaveLength(0);
		expect(result.edges).toHaveLength(0);
	});

	it('positions two nodes for a single dependency', () => {
		const issues = [makeIssue({ id: 'a' }), makeIssue({ id: 'b' })];
		const deps = [makeDependency('a', 'b')];

		const result = computeDependencyLayout(issues, deps);

		expect(result.nodes).toHaveLength(2);
		expect(result.edges).toHaveLength(1);

		const nodeA = result.nodes.find((n) => n.id === 'a')!;
		expect(nodeA.width).toBe(NODE_WIDTH);
		expect(nodeA.height).toBe(NODE_HEIGHT);
	});

	it('lays out left-to-right: blocker has smaller x than blocked', () => {
		const { result } = makeLinearChain();
		const nodeA = result.nodes.find((n) => n.id === 'a')!;
		const nodeB = result.nodes.find((n) => n.id === 'b')!;
		const nodeC = result.nodes.find((n) => n.id === 'c')!;
		expect(nodeA.x).toBeLessThan(nodeB.x);
		expect(nodeB.x).toBeLessThan(nodeC.x);
	});

	it('handles diamond DAG without node overlaps', () => {
		const issues = [
			makeIssue({ id: 'a' }),
			makeIssue({ id: 'b' }),
			makeIssue({ id: 'c' }),
			makeIssue({ id: 'd' }),
		];
		const deps = [
			makeDependency('a', 'b'),
			makeDependency('a', 'c'),
			makeDependency('b', 'd'),
			makeDependency('c', 'd'),
		];

		const result = computeDependencyLayout(issues, deps);

		expect(result.nodes).toHaveLength(4);
		expect(result.edges).toHaveLength(4);

		for (let i = 0; i < result.nodes.length; i++) {
			for (let j = i + 1; j < result.nodes.length; j++) {
				const a = result.nodes[i];
				const b = result.nodes[j];
				const overlapX = Math.abs(a.x - b.x) < (a.width + b.width) / 2;
				const overlapY = Math.abs(a.y - b.y) < (a.height + b.height) / 2;
				expect(overlapX && overlapY, `Nodes ${a.id} and ${b.id} overlap`).toBe(false);
			}
		}
	});

	it('handles 20+ nodes without error', () => {
		const issues = Array.from({ length: 25 }, (_, i) => makeIssue({ id: `n${i}` }));
		const deps: IssueDependency[] = [];
		for (let i = 0; i < 24; i++) {
			deps.push(makeDependency(`n${i}`, `n${i + 1}`));
		}
		const result = computeDependencyLayout(issues, deps);
		expect(result.nodes).toHaveLength(25);
		expect(result.edges).toHaveLength(24);
	});

	it('only includes nodes that participate in dependencies', () => {
		const issues = [
			makeIssue({ id: 'a' }),
			makeIssue({ id: 'b' }),
			makeIssue({ id: 'orphan' }),
		];
		const deps = [makeDependency('a', 'b')];
		const result = computeDependencyLayout(issues, deps);
		expect(result.nodes).toHaveLength(2);
		expect(result.nodes.find((n) => n.id === 'orphan')).toBeUndefined();
	});

	it('uses issue name as label', () => {
		const issues = [
			makeIssue({ id: 'a', name: 'First' }),
			makeIssue({ id: 'b', name: 'Second' }),
		];
		const deps = [makeDependency('a', 'b')];
		const result = computeDependencyLayout(issues, deps);
		expect(result.nodes.find((n) => n.id === 'a')!.label).toBe('First');
	});

	it('skips edges where one side is missing from issues list', () => {
		const issues = [makeIssue({ id: 'a' })];
		const deps = [makeDependency('a', 'missing')];
		const result = computeDependencyLayout(issues, deps);
		expect(result.nodes).toHaveLength(0);
	});

	it('marks edge as cross-PRD when blocker and blocked belong to different PRDs', () => {
		const prd1 = makeIssue({ id: 'prd-1', labels: [PRD_LABEL] });
		const prd2 = makeIssue({ id: 'prd-2', labels: [PRD_LABEL] });
		const a = makeIssue({ id: 'a', parent_issue_id: 'prd-1' });
		const b = makeIssue({ id: 'b', parent_issue_id: 'prd-2' });
		const result = computeDependencyLayout([prd1, prd2, a, b], [makeDependency('a', 'b')]);
		expect(result.edges[0].isCrossPrd).toBe(true);
	});

	it('marks PRD nodes via isPrd flag', () => {
		const prd = makeIssue({ id: 'prd-1', labels: [PRD_LABEL] });
		const child = makeIssue({ id: 'child', parent_issue_id: 'prd-1' });
		const result = computeDependencyLayout([prd, child], [makeDependency('prd-1', 'child')]);
		expect(result.nodes.find((n) => n.id === 'prd-1')!.isPrd).toBe(true);
		expect(result.nodes.find((n) => n.id === 'child')!.isPrd).toBe(false);
	});
});

describe('computePrdsLayout', () => {
	it('returns empty when no PRDs', () => {
		const issues = [makeIssue({ id: 'a' })];
		const result = computePrdsLayout(issues, []);
		expect(result.nodes).toHaveLength(0);
	});

	it('shows PRDs as nodes with no edges when no cross-PRD deps exist', () => {
		const prd1 = makeIssue({ id: 'prd-1', labels: [PRD_LABEL] });
		const prd2 = makeIssue({ id: 'prd-2', labels: [PRD_LABEL] });
		const result = computePrdsLayout([prd1, prd2], []);
		expect(result.nodes).toHaveLength(2);
		expect(result.edges).toHaveLength(0);
	});

	it('renders cross-PRD edges between PRD nodes with aggregate count', () => {
		const prd1 = makeIssue({ id: 'prd-1', labels: [PRD_LABEL] });
		const prd2 = makeIssue({ id: 'prd-2', labels: [PRD_LABEL] });
		const a = makeIssue({ id: 'a', parent_issue_id: 'prd-1' });
		const b = makeIssue({ id: 'b', parent_issue_id: 'prd-1' });
		const c = makeIssue({ id: 'c', parent_issue_id: 'prd-2' });
		const deps = [makeDependency('a', 'c'), makeDependency('b', 'c')];
		const result = computePrdsLayout([prd1, prd2, a, b, c], deps);
		expect(result.edges).toHaveLength(1);
		expect(result.edges[0].count).toBe(2);
		expect(result.edges[0].fromId).toBe('prd-1');
		expect(result.edges[0].toId).toBe('prd-2');
	});
});

describe('computeSinglePrdLayout', () => {
	it('returns empty when prdId not found', () => {
		const issues = [makeIssue({ id: 'a' })];
		const result = computeSinglePrdLayout(issues, [], 'missing');
		expect(result.nodes).toHaveLength(0);
	});

	it('returns empty when no sub-issues', () => {
		const prd = makeIssue({ id: 'prd-1', labels: [PRD_LABEL] });
		const result = computeSinglePrdLayout([prd], [], 'prd-1');
		expect(result.nodes).toHaveLength(0);
	});

	it('places closed sub-issues as floating-top row above open layout', () => {
		const prd = makeIssue({ id: 'prd-1', labels: [PRD_LABEL] });
		const closed1 = makeIssue({
			id: 'closed-1',
			parent_issue_id: 'prd-1',
			status: 'archived',
		});
		const closed2 = makeIssue({
			id: 'closed-2',
			parent_issue_id: 'prd-1',
			status: 'archived',
		});
		const open1 = makeIssue({ id: 'open-1', parent_issue_id: 'prd-1' });
		const open2 = makeIssue({ id: 'open-2', parent_issue_id: 'prd-1' });
		const deps = [makeDependency('open-1', 'open-2')];

		const result = computeSinglePrdLayout([prd, closed1, closed2, open1, open2], deps, 'prd-1');

		expect(result.nodes).toHaveLength(4);

		const closedNodes = result.nodes.filter((n) => n.isFloatingClosed);
		expect(closedNodes).toHaveLength(2);
		for (const node of closedNodes) {
			expect(node.y).toBeLessThan(0);
		}

		const openNodes = result.nodes.filter((n) => !n.isFloatingClosed);
		expect(openNodes).toHaveLength(2);
		for (const node of openNodes) {
			expect(node.y).toBeGreaterThanOrEqual(0);
		}
	});

	it('only includes intra-PRD edges between open sub-issues', () => {
		const prd1 = makeIssue({ id: 'prd-1', labels: [PRD_LABEL] });
		const prd2 = makeIssue({ id: 'prd-2', labels: [PRD_LABEL] });
		const a = makeIssue({ id: 'a', parent_issue_id: 'prd-1' });
		const b = makeIssue({ id: 'b', parent_issue_id: 'prd-1' });
		const c = makeIssue({ id: 'c', parent_issue_id: 'prd-2' });
		const deps = [makeDependency('a', 'b'), makeDependency('a', 'c')];
		const result = computeSinglePrdLayout([prd1, prd2, a, b, c], deps, 'prd-1');

		expect(result.edges).toHaveLength(1);
		expect(result.edges[0].fromId).toBe('a');
		expect(result.edges[0].toId).toBe('b');
	});
});
