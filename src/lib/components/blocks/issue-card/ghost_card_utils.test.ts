import { describe, it, expect } from 'vitest';
import type { AssignedIssue } from '$lib/types/generated';
import type { Issue } from '$lib/modules/issues';
import { assignedIssueToGhostIssue, getUnlinkedOpenAssignedIssues } from './ghost_card_utils.js';

function makeAssignedIssue(overrides: Partial<AssignedIssue> = {}): AssignedIssue {
	return {
		number: 42,
		title: 'Test issue',
		state: 'OPEN',
		url: 'https://github.com/org/repo/issues/42',
		labels: [{ name: 'bug', color: 'ff0000' }],
		parent_issue_number: 10,
		...overrides,
	};
}

function makeDashboardIssue(overrides: Partial<Issue> = {}): Issue {
	return {
		id: 'issue-1',
		dashboard_id: 'dash-1',
		name: 'Dashboard issue',
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
		created_at: '2024-01-01',
		character_pack_id: null,
		character_avatar: null,
		is_sound_muted: false,
		...overrides,
	};
}

describe('assignedIssueToGhostIssue', () => {
	it('maps all fields correctly from a complete AssignedIssue', () => {
		const assigned = makeAssignedIssue();
		const result = assignedIssueToGhostIssue(assigned);

		expect(result).toEqual({
			id: 'ghost-42',
			dashboard_id: '',
			name: 'Test issue',
			priority: null,
			color: null,
			status: 'active',
			github_issue_url: 'https://github.com/org/repo/issues/42',
			github_issue_number: 42,
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
			labels: [{ name: 'bug', color: 'ff0000' }],
			sort_order: 0,
			created_at: '',
			character_pack_id: null,
			character_avatar: null,
			is_sound_muted: false,
		});
	});

	it('uses ghost-${number} as the synthetic ID', () => {
		const result = assignedIssueToGhostIssue(makeAssignedIssue({ number: 999 }));
		expect(result.id).toBe('ghost-999');
	});

	it('passes labels through directly', () => {
		const labels = [
			{ name: 'enhancement', color: '00ff00' },
			{ name: 'priority', color: '0000ff' },
		];
		const result = assignedIssueToGhostIssue(makeAssignedIssue({ labels }));
		expect(result.labels).toEqual(labels);
	});

	it('handles parent_issue_number: null without affecting parent_issue_id', () => {
		const result = assignedIssueToGhostIssue(makeAssignedIssue({ parent_issue_number: null }));
		expect(result.parent_issue_id).toBeNull();
	});
});

describe('getUnlinkedOpenAssignedIssues', () => {
	it('returns only unlinked issues (excludes those linked to dashboard issues)', () => {
		const assigned = [
			makeAssignedIssue({ number: 1 }),
			makeAssignedIssue({ number: 2 }),
			makeAssignedIssue({ number: 3 }),
		];
		const dashboard = [makeDashboardIssue({ github_issue_number: 2 })];

		const result = getUnlinkedOpenAssignedIssues(assigned, dashboard);
		expect(result.map((i) => i.number)).toEqual([1, 3]);
	});

	it('excludes closed issues (state: CLOSED)', () => {
		const assigned = [
			makeAssignedIssue({ number: 1, state: 'OPEN' }),
			makeAssignedIssue({ number: 2, state: 'CLOSED' }),
			makeAssignedIssue({ number: 3, state: 'OPEN' }),
		];
		const dashboard: Issue[] = [];

		const result = getUnlinkedOpenAssignedIssues(assigned, dashboard);
		expect(result.map((i) => i.number)).toEqual([1, 3]);
	});

	it('returns empty array when all issues are linked', () => {
		const assigned = [makeAssignedIssue({ number: 1 }), makeAssignedIssue({ number: 2 })];
		const dashboard = [
			makeDashboardIssue({ github_issue_number: 1 }),
			makeDashboardIssue({ github_issue_number: 2 }),
		];

		const result = getUnlinkedOpenAssignedIssues(assigned, dashboard);
		expect(result).toEqual([]);
	});

	it('returns empty array when all issues are closed', () => {
		const assigned = [
			makeAssignedIssue({ number: 1, state: 'CLOSED' }),
			makeAssignedIssue({ number: 2, state: 'CLOSED' }),
		];
		const dashboard: Issue[] = [];

		const result = getUnlinkedOpenAssignedIssues(assigned, dashboard);
		expect(result).toEqual([]);
	});
});
