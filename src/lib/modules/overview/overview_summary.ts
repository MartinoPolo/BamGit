import type { OverviewWorkspaceData, ToolUsageBreakdown } from '$lib/types/generated';

export interface OverviewWorkspaceActivity {
	workspace: OverviewWorkspaceData;
	activityAt: Date;
}

export interface OverviewWorkspaceTotals {
	activeSessionCount: number;
	attentionCount: number;
	openIssueCount: number;
	todayCostUsd: number;
}

export function deriveRecentWorkspaceActivities(
	workspaces: OverviewWorkspaceData[],
	limit = 4,
): OverviewWorkspaceActivity[] {
	return workspaces
		.flatMap((workspace) => {
			if (workspace.last_activity == null) {
				return [];
			}
			const activityAt = new Date(workspace.last_activity);
			if (Number.isNaN(activityAt.getTime())) {
				return [];
			}
			return [{ workspace, activityAt }];
		})
		.sort((left, right) => right.activityAt.getTime() - left.activityAt.getTime())
		.slice(0, limit);
}

export function calculateOverviewWorkspaceTotals(
	workspaces: OverviewWorkspaceData[],
): OverviewWorkspaceTotals {
	return workspaces.reduce<OverviewWorkspaceTotals>(
		(totals, workspace) => ({
			activeSessionCount: totals.activeSessionCount + workspace.active_session_count,
			attentionCount:
				totals.attentionCount + workspace.prs_needing_attention + workspace.hitl_count,
			openIssueCount: totals.openIssueCount + workspace.open_issue_count,
			todayCostUsd: totals.todayCostUsd + (workspace.cost_today_usd ?? 0),
		}),
		{
			activeSessionCount: 0,
			attentionCount: 0,
			openIssueCount: 0,
			todayCostUsd: 0,
		},
	);
}

export function estimateMonthlyCacheSavings(totalCostUsd: number, cacheHitRatio: number): number {
	return totalCostUsd * (cacheHitRatio / 100) * 0.9;
}

export function getMaximumToolCallCount(toolUsage: ToolUsageBreakdown[]): number {
	return Math.max(...toolUsage.map((tool) => tool.call_count), 1);
}
