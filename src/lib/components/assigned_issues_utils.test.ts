import { describe, it, expect } from 'vitest';
import { categorizeAssignedIssues } from './assigned_issues_utils.js';
import type { AssignedIssue } from '$lib/types/generated';
import type { Issue } from '$lib/modules/issues';

function makeAssignedIssue(number: number): AssignedIssue {
	return {
		number,
		title: `Issue #${number}`,
		state: 'OPEN',
		url: `https://github.com/o/r/issues/${number}`,
		labels: [],
	};
}

function makeDashboardIssue(githubNumber: number | null): Issue {
	return {
		id: `id-${githubNumber}`,
		dashboard_id: 'd1',
		name: `Dashboard Issue`,
		priority: null,
		color: null,
		status: 'active',
		github_issue_url:
			githubNumber !== null ? `https://github.com/o/r/issues/${githubNumber}` : null,
		github_issue_number: githubNumber,
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
		created_at: '2024-01-01',
	};
}

describe('categorizeAssignedIssues', () => {
	it('returns all empty arrays for empty inputs', () => {
		const result = categorizeAssignedIssues([], [], []);
		expect(result).toEqual({ unlinked: [], linked: [], deleted: [] });
	});

	it('categorizes issue matching dashboard as linked', () => {
		const assigned = [makeAssignedIssue(42)];
		const dashboard = [makeDashboardIssue(42)];
		const result = categorizeAssignedIssues(assigned, dashboard, []);
		expect(result.linked).toHaveLength(1);
		expect(result.linked[0].number).toBe(42);
		expect(result.unlinked).toHaveLength(0);
		expect(result.deleted).toHaveLength(0);
	});

	it('categorizes issue in deletedNumbers as deleted', () => {
		const assigned = [makeAssignedIssue(10)];
		const result = categorizeAssignedIssues(assigned, [], [10]);
		expect(result.deleted).toHaveLength(1);
		expect(result.deleted[0].number).toBe(10);
		expect(result.unlinked).toHaveLength(0);
	});

	it('linked takes priority over deleted', () => {
		const assigned = [makeAssignedIssue(5)];
		const dashboard = [makeDashboardIssue(5)];
		const result = categorizeAssignedIssues(assigned, dashboard, [5]);
		expect(result.linked).toHaveLength(1);
		expect(result.deleted).toHaveLength(0);
	});

	it('categorizes unmatched issue as unlinked', () => {
		const assigned = [makeAssignedIssue(99)];
		const result = categorizeAssignedIssues(assigned, [], []);
		expect(result.unlinked).toHaveLength(1);
		expect(result.unlinked[0].number).toBe(99);
	});

	it('handles multiple issues across all categories', () => {
		const assigned = [
			makeAssignedIssue(1),
			makeAssignedIssue(2),
			makeAssignedIssue(3),
			makeAssignedIssue(4),
		];
		const dashboard = [makeDashboardIssue(1), makeDashboardIssue(3)];
		const result = categorizeAssignedIssues(assigned, dashboard, [2]);
		expect(result.linked.map((i) => i.number)).toEqual([1, 3]);
		expect(result.deleted.map((i) => i.number)).toEqual([2]);
		expect(result.unlinked.map((i) => i.number)).toEqual([4]);
	});
});
