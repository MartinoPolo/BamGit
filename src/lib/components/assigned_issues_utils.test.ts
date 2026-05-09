import { describe, it, expect } from 'vitest';
import {
	categorizeAssignedIssues,
	filterAssignedIssues,
	sortAssignedIssues,
	sortLabelsByPriority,
} from './assigned_issues_utils.js';
import type { AssignedIssue } from '$lib/types/generated';
import type { Issue } from '$lib/modules/issues';

function makeAssignedIssue(number: number, overrides?: Partial<AssignedIssue>): AssignedIssue {
	return {
		number,
		title: `Issue #${number}`,
		state: 'OPEN',
		url: `https://github.com/o/r/issues/${number}`,
		labels: [],
		parent_issue_number: null,
		...overrides,
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
		character_pack_id: null,
		character_avatar: null,
		is_sound_muted: false,
	};
}

describe('categorizeAssignedIssues', () => {
	it('returns all empty arrays for empty inputs', () => {
		const result = categorizeAssignedIssues([], []);
		expect(result).toEqual({ unlinked: [], linked: [] });
	});

	it('categorizes issue matching dashboard as linked', () => {
		const assigned = [makeAssignedIssue(42)];
		const dashboard = [makeDashboardIssue(42)];
		const result = categorizeAssignedIssues(assigned, dashboard);
		expect(result.linked).toHaveLength(1);
		expect(result.linked[0].number).toBe(42);
		expect(result.unlinked).toHaveLength(0);
	});

	it('categorizes unmatched issue as unlinked', () => {
		const assigned = [makeAssignedIssue(99)];
		const result = categorizeAssignedIssues(assigned, []);
		expect(result.unlinked).toHaveLength(1);
		expect(result.unlinked[0].number).toBe(99);
	});

	it('handles multiple issues across both categories', () => {
		const assigned = [
			makeAssignedIssue(1),
			makeAssignedIssue(2),
			makeAssignedIssue(3),
			makeAssignedIssue(4),
		];
		const dashboard = [makeDashboardIssue(1), makeDashboardIssue(3)];
		const result = categorizeAssignedIssues(assigned, dashboard);
		expect(result.linked.map((i) => i.number)).toEqual([1, 3]);
		expect(result.unlinked.map((i) => i.number)).toEqual([2, 4]);
	});
});

describe('filterAssignedIssues', () => {
	const issues = [
		makeAssignedIssue(42, { title: 'Auth middleware', parent_issue_number: 89 }),
		makeAssignedIssue(55, { title: 'Dark mode toggle', parent_issue_number: null }),
		makeAssignedIssue(78, { title: 'Onboarding wizard', parent_issue_number: 254 }),
	];

	it('returns all issues for empty query', () => {
		expect(filterAssignedIssues(issues, '')).toHaveLength(3);
	});

	it('filters by issue number', () => {
		const result = filterAssignedIssues(issues, '42');
		expect(result).toHaveLength(1);
		expect(result[0].number).toBe(42);
	});

	it('filters by title substring', () => {
		const result = filterAssignedIssues(issues, 'dark');
		expect(result).toHaveLength(1);
		expect(result[0].number).toBe(55);
	});

	it('filters by PRD number', () => {
		const result = filterAssignedIssues(issues, '#89');
		expect(result).toHaveLength(1);
		expect(result[0].number).toBe(42);
	});
});

describe('sortAssignedIssues', () => {
	const issues = [
		makeAssignedIssue(10, { title: 'Zebra', parent_issue_number: 5 }),
		makeAssignedIssue(5, { title: 'Apple', parent_issue_number: null }),
		makeAssignedIssue(20, { title: 'Mango', parent_issue_number: 3 }),
	];

	it('sorts by number ascending', () => {
		const sorted = sortAssignedIssues(issues, 'number', 'asc');
		expect(sorted.map((i) => i.number)).toEqual([5, 10, 20]);
	});

	it('sorts by number descending', () => {
		const sorted = sortAssignedIssues(issues, 'number', 'desc');
		expect(sorted.map((i) => i.number)).toEqual([20, 10, 5]);
	});

	it('sorts by title ascending', () => {
		const sorted = sortAssignedIssues(issues, 'title', 'asc');
		expect(sorted.map((i) => i.title)).toEqual(['Apple', 'Mango', 'Zebra']);
	});

	it('sorts by PRD ascending with nulls last', () => {
		const sorted = sortAssignedIssues(issues, 'prd', 'asc');
		expect(sorted.map((i) => i.parent_issue_number)).toEqual([3, 5, null]);
	});
});

describe('sortLabelsByPriority', () => {
	it('puts AFK/HITL labels first', () => {
		const labels = [
			{ name: 'bug', color: 'd73a4a' },
			{ name: 'AFK', color: '1D76DB' },
			{ name: 'design-needed', color: 'E8820C' },
		];
		const sorted = sortLabelsByPriority(labels);
		expect(sorted[0].name).toBe('AFK');
		expect(sorted[1].name).toBe('design-needed');
		expect(sorted[2].name).toBe('bug');
	});
});
