import { describe, expect, it } from 'vitest';
import type { OverviewWorkspaceData } from '$lib/types/generated';
import {
	calculateOverviewWorkspaceTotals,
	deriveRecentWorkspaceActivities,
	estimateMonthlyCacheSavings,
	getMaximumToolCallCount,
} from './overview_summary.js';

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

describe('deriveRecentWorkspaceActivities', () => {
	it('returns newest valid activity first and respects limit', () => {
		const activities = deriveRecentWorkspaceActivities(
			[
				makeWorkspace({ dashboard_id: 'older', last_activity: '2026-05-20T10:00:00Z' }),
				makeWorkspace({ dashboard_id: 'none', last_activity: null }),
				makeWorkspace({ dashboard_id: 'invalid', last_activity: 'not-a-date' }),
				makeWorkspace({ dashboard_id: 'newer', last_activity: '2026-05-22T10:00:00Z' }),
			],
			1,
		);

		expect(activities).toHaveLength(1);
		expect(activities[0].workspace.dashboard_id).toBe('newer');
	});
});

describe('calculateOverviewWorkspaceTotals', () => {
	it('rolls workspace health and cost totals together', () => {
		expect(
			calculateOverviewWorkspaceTotals([
				makeWorkspace({
					active_session_count: 2,
					open_issue_count: 8,
					hitl_count: 1,
					prs_needing_attention: 3,
					cost_today_usd: 2.5,
				}),
				makeWorkspace({
					active_session_count: 1,
					open_issue_count: 4,
					hitl_count: 2,
					prs_needing_attention: 0,
					cost_today_usd: null,
				}),
			]),
		).toEqual({
			activeSessionCount: 3,
			attentionCount: 6,
			openIssueCount: 12,
			todayCostUsd: 2.5,
		});
	});
});

describe('estimateMonthlyCacheSavings', () => {
	it('uses the usage page savings heuristic', () => {
		expect(estimateMonthlyCacheSavings(10, 50)).toBe(4.5);
	});
});

describe('getMaximumToolCallCount', () => {
	it('returns one for empty tool usage so bars keep a stable denominator', () => {
		expect(getMaximumToolCallCount([])).toBe(1);
	});
});
