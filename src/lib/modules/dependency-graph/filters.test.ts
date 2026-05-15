import { describe, it, expect } from 'vitest';
import type { Issue } from '$lib/modules/issues';
import { applyDependencyFilter, extractAreaLabels, DEFAULT_DEPENDENCY_FILTER } from './filters';

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

describe('applyDependencyFilter', () => {
	it('hides archived issues by default', () => {
		const issues = [
			makeIssue({ id: 'a', status: 'active' }),
			makeIssue({ id: 'b', status: 'archived' }),
		];
		const result = applyDependencyFilter(issues, DEFAULT_DEPENDENCY_FILTER);
		expect(result.map((i) => i.id)).toEqual(['a']);
	});

	it('shows archived when showClosed is true', () => {
		const issues = [
			makeIssue({ id: 'a', status: 'active' }),
			makeIssue({ id: 'b', status: 'archived' }),
		];
		const result = applyDependencyFilter(issues, {
			...DEFAULT_DEPENDENCY_FILTER,
			showClosed: true,
		});
		expect(result.map((i) => i.id).sort()).toEqual(['a', 'b']);
	});

	it('afkOnly keeps only AFK-labeled', () => {
		const issues = [
			makeIssue({ id: 'a', labels: [{ name: 'AFK', color: '#000' }] }),
			makeIssue({ id: 'b', labels: [{ name: 'HITL', color: '#000' }] }),
		];
		const result = applyDependencyFilter(issues, {
			...DEFAULT_DEPENDENCY_FILTER,
			afkOnly: true,
		});
		expect(result.map((i) => i.id)).toEqual(['a']);
	});

	it('hitlOnly keeps only HITL-labeled', () => {
		const issues = [
			makeIssue({ id: 'a', labels: [{ name: 'AFK', color: '#000' }] }),
			makeIssue({ id: 'b', labels: [{ name: 'HITL', color: '#000' }] }),
		];
		const result = applyDependencyFilter(issues, {
			...DEFAULT_DEPENDENCY_FILTER,
			hitlOnly: true,
		});
		expect(result.map((i) => i.id)).toEqual(['b']);
	});

	it('area filter matches exact label name', () => {
		const issues = [
			makeIssue({ id: 'a', labels: [{ name: 'area:ui', color: '#000' }] }),
			makeIssue({ id: 'b', labels: [{ name: 'area:db', color: '#000' }] }),
		];
		const result = applyDependencyFilter(issues, {
			...DEFAULT_DEPENDENCY_FILTER,
			area: 'area:ui',
		});
		expect(result.map((i) => i.id)).toEqual(['a']);
	});

	it('labelSearch matches case-insensitively as substring', () => {
		const issues = [
			makeIssue({ id: 'a', labels: [{ name: 'area:ui', color: '#000' }] }),
			makeIssue({ id: 'b', labels: [{ name: 'bug', color: '#000' }] }),
		];
		const result = applyDependencyFilter(issues, {
			...DEFAULT_DEPENDENCY_FILTER,
			labelSearch: 'AREA',
		});
		expect(result.map((i) => i.id)).toEqual(['a']);
	});

	it('applies multiple filters cumulatively', () => {
		const issues = [
			makeIssue({
				id: 'a',
				labels: [
					{ name: 'AFK', color: '#000' },
					{ name: 'area:ui', color: '#000' },
				],
			}),
			makeIssue({ id: 'b', labels: [{ name: 'AFK', color: '#000' }] }),
			makeIssue({ id: 'c', labels: [{ name: 'area:ui', color: '#000' }] }),
		];
		const result = applyDependencyFilter(issues, {
			...DEFAULT_DEPENDENCY_FILTER,
			afkOnly: true,
			area: 'area:ui',
		});
		expect(result.map((i) => i.id)).toEqual(['a']);
	});

	it('area filter is exact match, not substring', () => {
		const issues = [
			makeIssue({ id: 'a', labels: [{ name: 'area:ui', color: '#000' }] }),
			makeIssue({ id: 'b', labels: [{ name: 'area:ui-testing', color: '#000' }] }),
		];
		const result = applyDependencyFilter(issues, {
			...DEFAULT_DEPENDENCY_FILTER,
			area: 'area:ui',
		});
		expect(result.map((i) => i.id)).toEqual(['a']);
	});

	it('showClosed=false with labelSearch still hides archived non-matching', () => {
		const issues = [
			makeIssue({
				id: 'a',
				status: 'archived',
				labels: [{ name: 'AFK', color: '#000' }],
			}),
			makeIssue({
				id: 'b',
				status: 'active',
				labels: [{ name: 'AFK', color: '#000' }],
			}),
		];
		const result = applyDependencyFilter(issues, {
			...DEFAULT_DEPENDENCY_FILTER,
			showClosed: false,
			labelSearch: 'AFK',
		});
		expect(result.map((i) => i.id)).toEqual(['b']);
	});

	it('empty labelSearch matches all labels', () => {
		const issues = [
			makeIssue({ id: 'a', labels: [{ name: 'bug', color: '#000' }] }),
			makeIssue({ id: 'b', labels: [] }),
		];
		const result = applyDependencyFilter(issues, {
			...DEFAULT_DEPENDENCY_FILTER,
			labelSearch: '',
		});
		expect(result.map((i) => i.id)).toEqual(['a', 'b']);
	});

	it('labelSearch with whitespace is trimmed', () => {
		const issues = [
			makeIssue({ id: 'a', labels: [{ name: 'bug', color: '#000' }] }),
			makeIssue({ id: 'b', labels: [{ name: 'feature', color: '#000' }] }),
		];
		const result = applyDependencyFilter(issues, {
			...DEFAULT_DEPENDENCY_FILTER,
			labelSearch: '  bug  ',
		});
		expect(result.map((i) => i.id)).toEqual(['a']);
	});
});

describe('extractAreaLabels', () => {
	it('returns sorted unique area labels', () => {
		const issues = [
			makeIssue({
				id: 'a',
				labels: [
					{ name: 'area:ui', color: '#000' },
					{ name: 'AFK', color: '#000' },
				],
			}),
			makeIssue({
				id: 'b',
				labels: [
					{ name: 'area:db', color: '#000' },
					{ name: 'area:ui', color: '#000' },
				],
			}),
		];
		expect(extractAreaLabels(issues)).toEqual(['area:db', 'area:ui']);
	});

	it('returns empty array when no area labels', () => {
		const issues = [makeIssue({ id: 'a', labels: [{ name: 'AFK', color: '#000' }] })];
		expect(extractAreaLabels(issues)).toEqual([]);
	});
});
