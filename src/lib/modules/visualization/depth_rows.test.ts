import { describe, it, expect } from 'vitest';
import { computeDepthRows } from './depth_rows.js';
import type { IssueDependency } from '$lib/types/generated';

describe('computeDepthRows', () => {
	it('places all issues in row 0 when no dependencies exist', () => {
		const issueIds = ['a', 'b', 'c'];
		const dependencies: IssueDependency[] = [];

		const result = computeDepthRows(issueIds, dependencies);

		expect(result.get('a')).toBe(0);
		expect(result.get('b')).toBe(0);
		expect(result.get('c')).toBe(0);
	});

	it('places blocked issue one row behind its blocker', () => {
		const issueIds = ['auth', 'onboarding'];
		const dependencies: IssueDependency[] = [
			{ id: 'dep-1', blocker_issue_id: 'auth', blocked_issue_id: 'onboarding' },
		];

		const result = computeDepthRows(issueIds, dependencies);

		expect(result.get('auth')).toBe(0);
		expect(result.get('onboarding')).toBe(1);
	});

	// fallow-ignore-next-line code-duplication
	it('computes correct depth for linear chain A→B→C', () => {
		const issueIds = ['a', 'b', 'c'];
		const dependencies: IssueDependency[] = [
			{ id: 'dep-1', blocker_issue_id: 'a', blocked_issue_id: 'b' },
			{ id: 'dep-2', blocker_issue_id: 'b', blocked_issue_id: 'c' },
		];

		const result = computeDepthRows(issueIds, dependencies);

		expect(result.get('a')).toBe(0);
		expect(result.get('b')).toBe(1);
		expect(result.get('c')).toBe(2);
	});

	it('handles diamond DAG: A blocks B and C, both block D', () => {
		const issueIds = ['a', 'b', 'c', 'd'];
		const dependencies: IssueDependency[] = [
			{ id: 'dep-1', blocker_issue_id: 'a', blocked_issue_id: 'b' },
			{ id: 'dep-2', blocker_issue_id: 'a', blocked_issue_id: 'c' },
			{ id: 'dep-3', blocker_issue_id: 'b', blocked_issue_id: 'd' },
			{ id: 'dep-4', blocker_issue_id: 'c', blocked_issue_id: 'd' },
		];

		const result = computeDepthRows(issueIds, dependencies);

		expect(result.get('a')).toBe(0);
		expect(result.get('b')).toBe(1);
		expect(result.get('c')).toBe(1);
		expect(result.get('d')).toBe(2);
	});

	it('places disconnected issues in row 0', () => {
		const issueIds = ['a', 'b', 'c', 'disconnected'];
		const dependencies: IssueDependency[] = [
			{ id: 'dep-1', blocker_issue_id: 'a', blocked_issue_id: 'b' },
		];

		const result = computeDepthRows(issueIds, dependencies);

		expect(result.get('disconnected')).toBe(0);
		expect(result.get('c')).toBe(0);
	});

	it('handles cycles gracefully without infinite loop', () => {
		const issueIds = ['a', 'b', 'c'];
		const dependencies: IssueDependency[] = [
			{ id: 'dep-1', blocker_issue_id: 'a', blocked_issue_id: 'b' },
			{ id: 'dep-2', blocker_issue_id: 'b', blocked_issue_id: 'c' },
			{ id: 'dep-3', blocker_issue_id: 'c', blocked_issue_id: 'a' },
		];

		const result = computeDepthRows(issueIds, dependencies);

		// All issues should still have a depth assigned (no crash)
		expect(result.size).toBe(3);
		for (const id of issueIds) {
			expect(result.has(id)).toBe(true);
		}
	});

	it('ignores dependencies referencing unknown issue IDs', () => {
		const issueIds = ['a', 'b'];
		const dependencies: IssueDependency[] = [
			{ id: 'dep-1', blocker_issue_id: 'unknown', blocked_issue_id: 'a' },
			{ id: 'dep-2', blocker_issue_id: 'a', blocked_issue_id: 'ghost' },
		];

		const result = computeDepthRows(issueIds, dependencies);

		expect(result.get('a')).toBe(0);
		expect(result.get('b')).toBe(0);
	});

	it('handles multiple blockers — uses maximum depth', () => {
		const issueIds = ['root', 'mid', 'leaf'];
		const dependencies: IssueDependency[] = [
			{ id: 'dep-1', blocker_issue_id: 'root', blocked_issue_id: 'mid' },
			{ id: 'dep-2', blocker_issue_id: 'root', blocked_issue_id: 'leaf' },
			{ id: 'dep-3', blocker_issue_id: 'mid', blocked_issue_id: 'leaf' },
		];

		const result = computeDepthRows(issueIds, dependencies);

		expect(result.get('root')).toBe(0);
		expect(result.get('mid')).toBe(1);
		// leaf is blocked by both root (depth 1) and mid (depth 2) — take max
		expect(result.get('leaf')).toBe(2);
	});
});
