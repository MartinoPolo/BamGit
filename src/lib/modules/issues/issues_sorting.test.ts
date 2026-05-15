import { describe, it, expect } from 'vitest';
import { sortIssues } from './sort.js';
import type { Issue } from './types.js';

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

describe('sortIssues by priority', () => {
	it('orders: top > high > medium > low > lowest', () => {
		const issues = [
			makeIssue({ id: 'low', priority: 'low' }),
			makeIssue({ id: 'top', priority: 'top' }),
			makeIssue({ id: 'medium', priority: 'medium' }),
			makeIssue({ id: 'high', priority: 'high' }),
			makeIssue({ id: 'lowest', priority: 'lowest' }),
		];
		const sorted = sortIssues(issues, 'priority');
		expect(sorted.map((i) => i.id)).toEqual(['top', 'high', 'medium', 'low', 'lowest']);
	});

	it('issues with null priority sort to the end', () => {
		const issues = [
			makeIssue({ id: 'null-1', priority: null }),
			makeIssue({ id: 'top', priority: 'top' }),
			makeIssue({ id: 'null-2', priority: null }),
			makeIssue({ id: 'low', priority: 'low' }),
		];
		const sorted = sortIssues(issues, 'priority');
		expect(sorted.map((i) => i.id)).toEqual(['top', 'low', 'null-1', 'null-2']);
	});

	it('stable sort: equal priorities maintain relative order', () => {
		const issues = [
			makeIssue({ id: 'a', priority: 'medium' }),
			makeIssue({ id: 'b', priority: 'medium' }),
			makeIssue({ id: 'c', priority: 'medium' }),
		];
		const sorted = sortIssues(issues, 'priority');
		expect(sorted.map((i) => i.id)).toEqual(['a', 'b', 'c']);
	});
});

describe('sortIssues by name', () => {
	it('sorts A-Z case-insensitive', () => {
		const issues = [
			makeIssue({ id: 'c', name: 'charlie' }),
			makeIssue({ id: 'a', name: 'Alpha' }),
			makeIssue({ id: 'b', name: 'Bravo' }),
		];
		const sorted = sortIssues(issues, 'name');
		expect(sorted.map((i) => i.id)).toEqual(['a', 'b', 'c']);
	});

	it('handles unicode characters correctly via localeCompare', () => {
		const issues = [
			makeIssue({ id: 'z', name: 'žlutý' }),
			makeIssue({ id: 'a', name: 'alfa' }),
			makeIssue({ id: 'c', name: 'česky' }),
		];
		const sorted = sortIssues(issues, 'name');
		expect(sorted.map((i) => i.id)).toEqual(['a', 'c', 'z']);
	});

	it('empty string sorts before non-empty', () => {
		const issues = [
			makeIssue({ id: 'b', name: 'beta' }),
			makeIssue({ id: 'empty', name: '' }),
			makeIssue({ id: 'a', name: 'alpha' }),
		];
		const sorted = sortIssues(issues, 'name');
		expect(sorted[0].id).toBe('empty');
	});
});

describe('sortIssues by date', () => {
	it('sorts by sort_order ascending', () => {
		const issues = [
			makeIssue({ id: 'c', sort_order: 3 }),
			makeIssue({ id: 'a', sort_order: 1 }),
			makeIssue({ id: 'b', sort_order: 2 }),
		];
		const sorted = sortIssues(issues, 'date');
		expect(sorted.map((i) => i.id)).toEqual(['a', 'b', 'c']);
	});

	it('when sort_order equal, sorts by created_at ascending', () => {
		const issues = [
			makeIssue({ id: 'b', sort_order: 1, created_at: '2026-01-02T00:00:00Z' }),
			makeIssue({ id: 'a', sort_order: 1, created_at: '2026-01-01T00:00:00Z' }),
			makeIssue({ id: 'c', sort_order: 1, created_at: '2026-01-03T00:00:00Z' }),
		];
		const sorted = sortIssues(issues, 'date');
		expect(sorted.map((i) => i.id)).toEqual(['a', 'b', 'c']);
	});

	it('sort_order takes precedence over created_at', () => {
		const issues = [
			makeIssue({ id: 'late-but-first', sort_order: 1, created_at: '2026-12-01T00:00:00Z' }),
			makeIssue({ id: 'early-but-last', sort_order: 5, created_at: '2026-01-01T00:00:00Z' }),
		];
		const sorted = sortIssues(issues, 'date');
		expect(sorted.map((i) => i.id)).toEqual(['late-but-first', 'early-but-last']);
	});
});

describe('sortIssues — general', () => {
	it('does not mutate the original array', () => {
		const issues = [
			makeIssue({ id: 'b', name: 'bravo' }),
			makeIssue({ id: 'a', name: 'alpha' }),
		];
		const original = [...issues];
		sortIssues(issues, 'name');
		expect(issues.map((i) => i.id)).toEqual(original.map((i) => i.id));
	});

	it('returns empty array for empty input', () => {
		expect(sortIssues([], 'priority')).toEqual([]);
		expect(sortIssues([], 'name')).toEqual([]);
		expect(sortIssues([], 'date')).toEqual([]);
	});
});
