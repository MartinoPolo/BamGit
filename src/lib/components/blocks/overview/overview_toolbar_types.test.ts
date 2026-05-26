import { describe, expect, it } from 'vitest';
import type { OverviewWorkspaceData } from '$lib/types/generated';
import {
	sortWorkspaces,
	filterWorkspaces,
	searchWorkspaces,
	isOverviewSortMode,
	isOverviewSortDirection,
	isOverviewFilterMode,
	isOverviewFooterContent,
} from './overview_toolbar_types.js';

function makeWorkspace(overrides: Partial<OverviewWorkspaceData>): OverviewWorkspaceData {
	return {
		dashboard_id: 'dashboard',
		name: 'Workspace',
		github_repo: null,
		local_folder: null,
		color_palette_id: null,
		accent_color: null,
		open_issue_count: 0,
		active_session_count: 0,
		last_activity: null,
		total_cost_usd: null,
		cost_today_usd: null,
		cost_week_usd: null,
		hitl_count: 0,
		open_pr_count: 0,
		prs_needing_attention: 0,
		afk_loop_status: 'off',
		default_branch: 'main',
		worktree_count: 0,
		afk_ready_count: 0,
		prd_count: 0,
		prd_completed_subs: 0,
		prd_total_subs: 0,
		status: 'active',
		...overrides,
	};
}

describe('sortWorkspaces', () => {
	it('sorts by name ascending (A→Z, case-insensitive)', () => {
		const workspaces = [
			makeWorkspace({ name: 'Zebra' }),
			makeWorkspace({ name: 'apple' }),
			makeWorkspace({ name: 'Mango' }),
		];
		const result = sortWorkspaces(workspaces, 'name', 'ascending');
		expect(result.map((w) => w.name)).toEqual(['apple', 'Mango', 'Zebra']);
	});

	it('sorts by name descending (Z→A)', () => {
		const workspaces = [
			makeWorkspace({ name: 'apple' }),
			makeWorkspace({ name: 'Zebra' }),
			makeWorkspace({ name: 'Mango' }),
		];
		const result = sortWorkspaces(workspaces, 'name', 'descending');
		expect(result.map((w) => w.name)).toEqual(['Zebra', 'Mango', 'apple']);
	});

	it('sorts by activity descending (most recent first, nulls last)', () => {
		const workspaces = [
			makeWorkspace({ name: 'old', last_activity: '2024-01-01T00:00:00Z' }),
			makeWorkspace({ name: 'none', last_activity: null }),
			makeWorkspace({ name: 'new', last_activity: '2026-05-20T00:00:00Z' }),
		];
		const result = sortWorkspaces(workspaces, 'activity', 'descending');
		expect(result.map((w) => w.name)).toEqual(['new', 'old', 'none']);
	});

	it('sorts by activity ascending (oldest first, nulls last)', () => {
		const workspaces = [
			makeWorkspace({ name: 'new', last_activity: '2026-05-20T00:00:00Z' }),
			makeWorkspace({ name: 'none', last_activity: null }),
			makeWorkspace({ name: 'old', last_activity: '2024-01-01T00:00:00Z' }),
		];
		const result = sortWorkspaces(workspaces, 'activity', 'ascending');
		expect(result.map((w) => w.name)).toEqual(['old', 'new', 'none']);
	});

	it('sorts by issue-count descending (highest first)', () => {
		const workspaces = [
			makeWorkspace({ name: 'low', open_issue_count: 2 }),
			makeWorkspace({ name: 'high', open_issue_count: 15 }),
			makeWorkspace({ name: 'mid', open_issue_count: 7 }),
		];
		const result = sortWorkspaces(workspaces, 'issue-count', 'descending');
		expect(result.map((w) => w.name)).toEqual(['high', 'mid', 'low']);
	});

	it('sorts by cost descending (highest first, nulls treated as 0)', () => {
		const workspaces = [
			makeWorkspace({ name: 'free', cost_today_usd: null }),
			makeWorkspace({ name: 'expensive', cost_today_usd: 100 }),
			makeWorkspace({ name: 'cheap', cost_today_usd: 5 }),
		];
		const result = sortWorkspaces(workspaces, 'cost', 'descending');
		expect(result.map((w) => w.name)).toEqual(['expensive', 'cheap', 'free']);
	});

	it('does not mutate the input array', () => {
		const workspaces = [makeWorkspace({ name: 'B' }), makeWorkspace({ name: 'A' })];
		const original = [...workspaces];
		sortWorkspaces(workspaces, 'name', 'ascending');
		expect(workspaces).toEqual(original);
	});
});

describe('filterWorkspaces', () => {
	it('all — returns all workspaces unchanged', () => {
		const workspaces = [makeWorkspace({ name: 'A' }), makeWorkspace({ name: 'B' })];
		const result = filterWorkspaces(workspaces, 'all');
		expect(result).toHaveLength(2);
	});

	it('active — returns only workspaces with active sessions', () => {
		const workspaces = [
			makeWorkspace({ name: 'active', active_session_count: 3 }),
			makeWorkspace({ name: 'idle', active_session_count: 0 }),
		];
		const result = filterWorkspaces(workspaces, 'active');
		expect(result.map((w) => w.name)).toEqual(['active']);
	});

	it('needs-attention — returns workspaces with hitl_count > 0 or prs_needing_attention > 0', () => {
		const workspaces = [
			makeWorkspace({ name: 'hitl', hitl_count: 2, prs_needing_attention: 0 }),
			makeWorkspace({ name: 'prs', hitl_count: 0, prs_needing_attention: 1 }),
			makeWorkspace({ name: 'fine', hitl_count: 0, prs_needing_attention: 0 }),
		];
		const result = filterWorkspaces(workspaces, 'needs-attention');
		expect(result.map((w) => w.name)).toEqual(['hitl', 'prs']);
	});

	it('dormant — returns workspaces with null or >7-day-old last_activity AND no sessions', () => {
		const workspaces = [
			makeWorkspace({ name: 'null-activity', last_activity: null, active_session_count: 0 }),
			makeWorkspace({
				name: 'old-activity',
				last_activity: '2020-01-01T00:00:00Z',
				active_session_count: 0,
			}),
			makeWorkspace({
				name: 'recent',
				last_activity: new Date().toISOString(),
				active_session_count: 0,
			}),
		];
		const result = filterWorkspaces(workspaces, 'dormant');
		expect(result.map((w) => w.name)).toEqual(['null-activity', 'old-activity']);
	});

	it('dormant excludes workspaces with active sessions even if activity is old', () => {
		const workspaces = [
			makeWorkspace({
				name: 'old-but-active',
				last_activity: '2020-01-01T00:00:00Z',
				active_session_count: 1,
			}),
			makeWorkspace({
				name: 'old-and-idle',
				last_activity: '2020-01-01T00:00:00Z',
				active_session_count: 0,
			}),
		];
		const result = filterWorkspaces(workspaces, 'dormant');
		expect(result.map((w) => w.name)).toEqual(['old-and-idle']);
	});
});

describe('searchWorkspaces', () => {
	it('matches partial substrings', () => {
		const workspaces = [
			makeWorkspace({ name: 'My Workspace' }),
			makeWorkspace({ name: 'Other Project' }),
		];
		const result = searchWorkspaces(workspaces, 'work');
		expect(result.map((w) => w.name)).toEqual(['My Workspace']);
	});

	it('matches case-insensitively', () => {
		const workspaces = [makeWorkspace({ name: 'workspace' }), makeWorkspace({ name: 'Other' })];
		const result = searchWorkspaces(workspaces, 'WORK');
		expect(result.map((w) => w.name)).toEqual(['workspace']);
	});

	it('returns all workspaces for empty query', () => {
		const workspaces = [makeWorkspace({ name: 'A' }), makeWorkspace({ name: 'B' })];
		const result = searchWorkspaces(workspaces, '');
		expect(result).toHaveLength(2);
	});

	it('returns all workspaces for whitespace-only query', () => {
		const workspaces = [makeWorkspace({ name: 'A' }), makeWorkspace({ name: 'B' })];
		const result = searchWorkspaces(workspaces, '   ');
		expect(result).toHaveLength(2);
	});
});

describe('type guards', () => {
	it('accepts valid values', () => {
		expect(isOverviewSortMode('name')).toBe(true);
		expect(isOverviewSortMode('activity')).toBe(true);
		expect(isOverviewSortMode('issue-count')).toBe(true);
		expect(isOverviewSortMode('cost')).toBe(true);

		expect(isOverviewSortDirection('ascending')).toBe(true);
		expect(isOverviewSortDirection('descending')).toBe(true);

		expect(isOverviewFilterMode('all')).toBe(true);
		expect(isOverviewFilterMode('active')).toBe(true);
		expect(isOverviewFilterMode('needs-attention')).toBe(true);
		expect(isOverviewFilterMode('dormant')).toBe(true);

		expect(isOverviewFooterContent('cost-today')).toBe(true);
		expect(isOverviewFooterContent('cost-week')).toBe(true);
		expect(isOverviewFooterContent('cost-total')).toBe(true);
		expect(isOverviewFooterContent('sessions')).toBe(true);
		expect(isOverviewFooterContent('last-activity')).toBe(true);
	});

	it('rejects invalid values', () => {
		expect(isOverviewSortMode('invalid')).toBe(false);
		expect(isOverviewSortMode(123)).toBe(false);
		expect(isOverviewSortMode(null)).toBe(false);

		expect(isOverviewSortDirection('sideways')).toBe(false);
		expect(isOverviewSortDirection(undefined)).toBe(false);

		expect(isOverviewFilterMode('archived')).toBe(false);
		expect(isOverviewFilterMode('')).toBe(false);

		expect(isOverviewFooterContent('cost-month')).toBe(false);
		expect(isOverviewFooterContent(42)).toBe(false);
	});
});
