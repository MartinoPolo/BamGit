import { describe, it, expect } from 'vitest';
import {
	extractGitHubIssueNumber,
	buildCreateIssueRequest,
	buildUpdateIssueRequest,
	buildCreateDashboardRequest,
	buildUpdateDashboardRequest,
} from './dialog_helpers.js';

describe('extractGitHubIssueNumber', () => {
	it('extracts issue number from standard GitHub URL', () => {
		expect(extractGitHubIssueNumber('https://github.com/owner/repo/issues/42')).toBe(42);
	});

	it('extracts issue number from URL with trailing path', () => {
		expect(extractGitHubIssueNumber('https://github.com/owner/repo/issues/123/comments')).toBe(
			123,
		);
	});

	it('returns null for non-issue URLs', () => {
		expect(extractGitHubIssueNumber('https://github.com/owner/repo/pull/42')).toBeNull();
	});

	it('returns null for empty string', () => {
		expect(extractGitHubIssueNumber('')).toBeNull();
	});
});

describe('buildCreateIssueRequest', () => {
	it('builds minimal request with name and color', () => {
		const result = buildCreateIssueRequest('dash-1', 'Fix bug', '#ff0000', '', '');
		expect(result).toEqual({
			dashboard_id: 'dash-1',
			name: 'Fix bug',
			color: '#ff0000',
		});
	});

	it('includes priority when provided', () => {
		const result = buildCreateIssueRequest('dash-1', 'Fix bug', '#ff0000', 'high', '');
		expect(result?.priority).toBe('high');
	});

	it('includes GitHub URL and extracts issue number', () => {
		const result = buildCreateIssueRequest(
			'dash-1',
			'Fix bug',
			'#ff0000',
			'',
			'https://github.com/o/r/issues/7',
		);
		expect(result?.github_issue_url).toBe('https://github.com/o/r/issues/7');
		expect(result?.github_issue_number).toBe(7);
	});

	it('includes lowest priority when provided', () => {
		const result = buildCreateIssueRequest('dash-1', 'Fix bug', '#ff0000', 'lowest', '');
		expect(result?.priority).toBe('lowest');
	});

	it('returns null for empty name', () => {
		expect(buildCreateIssueRequest('dash-1', '  ', '#ff0000', '', '')).toBeNull();
	});

	it('trims whitespace from name', () => {
		const result = buildCreateIssueRequest('dash-1', '  Fix bug  ', '#ff0000', '', '');
		expect(result?.name).toBe('Fix bug');
	});
});

describe('buildUpdateIssueRequest', () => {
	it('builds update request with all fields', () => {
		const result = buildUpdateIssueRequest(
			'issue-1',
			'Updated',
			'high',
			'#00ff00',
			'https://github.com/o/r/issues/1',
		);
		expect(result).toEqual({
			id: 'issue-1',
			name: 'Updated',
			priority: 'high',
			color: '#00ff00',
			github_issue_url: 'https://github.com/o/r/issues/1',
		});
	});

	it('returns null when issueId is null', () => {
		expect(buildUpdateIssueRequest(null, 'Test', '', '', '')).toBeNull();
	});

	it('returns null for empty name', () => {
		expect(buildUpdateIssueRequest('issue-1', '', '', '', '')).toBeNull();
	});

	it('nullifies empty priority and color', () => {
		const result = buildUpdateIssueRequest('issue-1', 'Test', '', '', '');
		expect(result?.priority).toBeNull();
		expect(result?.color).toBeNull();
		expect(result?.github_issue_url).toBeNull();
	});
});

describe('buildCreateDashboardRequest', () => {
	it('builds repo request with accent color', () => {
		const result = buildCreateDashboardRequest('My Repo', '#62874b', '', '', '', '');
		expect(result).toEqual({
			name: 'My Repo',
			type: 'repo',
			accent_color: '#62874b',
			github_repo: undefined,
			local_folder: undefined,
			default_base_branch: undefined,
			worktree_parent_folder: undefined,
		});
	});

	it('includes all fields when provided', () => {
		const result = buildCreateDashboardRequest(
			'My Repo',
			'#62874b',
			'owner/repo',
			'/local',
			'main',
			'/worktrees',
		);
		expect(result?.github_repo).toBe('owner/repo');
		expect(result?.local_folder).toBe('/local');
		expect(result?.default_base_branch).toBe('main');
		expect(result?.worktree_parent_folder).toBe('/worktrees');
	});

	it('returns null for empty name', () => {
		expect(buildCreateDashboardRequest('', '#62874b', '', '', '', '')).toBeNull();
	});
});

describe('buildUpdateDashboardRequest', () => {
	const dashboard = { id: 'dash-1' };

	it('builds update request', () => {
		const result = buildUpdateDashboardRequest(
			dashboard,
			'Updated',
			'#62874b',
			'owner/repo',
			'/local',
			'main',
			'/worktrees',
		);
		expect(result).toEqual({
			id: 'dash-1',
			name: 'Updated',
			accent_color: '#62874b',
			github_repo: 'owner/repo',
			local_folder: '/local',
			default_base_branch: 'main',
			worktree_parent_folder: '/worktrees',
		});
	});

	it('returns null when dashboard is null', () => {
		expect(buildUpdateDashboardRequest(null, 'Test', null, '', '', '', '')).toBeNull();
	});

	it('returns null for empty name', () => {
		expect(buildUpdateDashboardRequest(dashboard, '', null, '', '', '', '')).toBeNull();
	});

	it('nullifies empty string fields', () => {
		const result = buildUpdateDashboardRequest(dashboard, 'Test', null, '', '', '', '');
		expect(result?.github_repo).toBeNull();
		expect(result?.local_folder).toBeNull();
	});
});
