import { describe, it, expect } from 'vitest';
import { computeDependencyLayout } from './dagre_layout';
import type { IssueDependency } from '$lib/types/generated';
import { NODE_WIDTH, NODE_HEIGHT } from './types';

function makeDependency(blockerId: string, blockedId: string, id?: string): IssueDependency {
	return {
		id: id ?? `dep-${blockerId}-${blockedId}`,
		blocker_issue_id: blockerId,
		blocked_issue_id: blockedId,
	};
}

function makeIssue(id: string, name?: string) {
	return { id, name: name ?? `Issue ${id}` };
}

function makeLinearChain() {
	const issues = [makeIssue('a'), makeIssue('b'), makeIssue('c')];
	const deps = [makeDependency('a', 'b'), makeDependency('b', 'c')];
	return { issues, deps, result: computeDependencyLayout(issues, deps) };
}

describe('computeDependencyLayout', () => {
	it('returns empty result when no dependencies', () => {
		const result = computeDependencyLayout([makeIssue('a'), makeIssue('b')], []);
		expect(result.nodes).toHaveLength(0);
		expect(result.edges).toHaveLength(0);
		expect(result.graphWidth).toBe(0);
		expect(result.graphHeight).toBe(0);
	});

	it('positions two nodes for a single dependency', () => {
		const issues = [makeIssue('a'), makeIssue('b')];
		const deps = [makeDependency('a', 'b')];

		const result = computeDependencyLayout(issues, deps);

		expect(result.nodes).toHaveLength(2);
		expect(result.edges).toHaveLength(1);

		const nodeA = result.nodes.find((n) => n.id === 'a')!;
		const nodeB = result.nodes.find((n) => n.id === 'b')!;
		expect(nodeA).toBeDefined();
		expect(nodeB).toBeDefined();
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
		const issues = [makeIssue('a'), makeIssue('b'), makeIssue('c'), makeIssue('d')];
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
		const issues = Array.from({ length: 25 }, (_, i) => makeIssue(`n${i}`));
		const deps: IssueDependency[] = [];
		for (let i = 0; i < 24; i++) {
			deps.push(makeDependency(`n${i}`, `n${i + 1}`));
		}

		const result = computeDependencyLayout(issues, deps);

		expect(result.nodes).toHaveLength(25);
		expect(result.edges).toHaveLength(24);
		expect(result.graphWidth).toBeGreaterThan(0);
		expect(result.graphHeight).toBeGreaterThan(0);
	});

	it('edges reference valid node IDs', () => {
		const { result } = makeLinearChain();
		const nodeIds = new Set(result.nodes.map((n) => n.id));

		for (const edge of result.edges) {
			expect(nodeIds.has(edge.fromId)).toBe(true);
			expect(nodeIds.has(edge.toId)).toBe(true);
			expect(edge.points.length).toBeGreaterThan(0);
		}
	});

	it('only includes nodes that participate in dependencies', () => {
		const issues = [makeIssue('a'), makeIssue('b'), makeIssue('orphan')];
		const deps = [makeDependency('a', 'b')];

		const result = computeDependencyLayout(issues, deps);

		expect(result.nodes).toHaveLength(2);
		expect(result.nodes.find((n) => n.id === 'orphan')).toBeUndefined();
	});

	it('uses issue name as label', () => {
		const issues = [makeIssue('a', 'First Issue'), makeIssue('b', 'Second Issue')];
		const deps = [makeDependency('a', 'b')];

		const result = computeDependencyLayout(issues, deps);

		const nodeA = result.nodes.find((n) => n.id === 'a')!;
		expect(nodeA.label).toBe('First Issue');
	});

	it('skips edges where one side is missing from issues list', () => {
		const issues = [makeIssue('a')];
		const deps = [makeDependency('a', 'missing')];

		const result = computeDependencyLayout(issues, deps);

		expect(result.nodes).toHaveLength(0);
		expect(result.edges).toHaveLength(0);
	});
});
