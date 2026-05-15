import { describe, it, expect } from 'vitest';
import { mockInvoke } from './tauri_mock.js';
import type {
	Action,
	ColorPalette,
	Dashboard,
	GitStatusCache,
	Issue,
	IssueDependency,
	LabelShapeMapping,
	NotificationConfig,
	OverviewWorkspaceData,
	SyncAllResult,
} from '$lib/types/generated';

describe('mockInvoke', () => {
	describe('read commands return typed data', () => {
		it('get_dashboards returns non-empty array of dashboards', async () => {
			const result = await mockInvoke<Dashboard[]>('get_dashboards');
			expect(result.length).toBeGreaterThan(0);
			expect(result[0]).toHaveProperty('id');
			expect(result[0]).toHaveProperty('name');
			expect(result[0]).toHaveProperty('type');
		});

		it('get_issues_for_dashboard filters by dashboardId', async () => {
			const dashboards = await mockInvoke<Dashboard[]>('get_dashboards');
			const dashboardId = dashboards[0].id;
			const issues = await mockInvoke<Issue[]>('get_issues_for_dashboard', {
				dashboardId,
				includeArchived: true,
			});
			expect(issues.length).toBeGreaterThan(0);
			for (const issue of issues) {
				expect(issue.dashboard_id).toBe(dashboardId);
			}
		});

		it('get_all_color_palettes returns palettes with colors array', async () => {
			const result = await mockInvoke<ColorPalette[]>('get_all_color_palettes');
			expect(result.length).toBeGreaterThan(0);
			expect(result[0].colors.length).toBeGreaterThan(0);
		});

		it('get_actions_for_dashboard filters by dashboardId', async () => {
			const dashboards = await mockInvoke<Dashboard[]>('get_dashboards');
			const actions = await mockInvoke<Action[]>('get_actions_for_dashboard', {
				dashboardId: dashboards[0].id,
			});
			expect(actions.length).toBeGreaterThan(0);
			expect(actions[0]).toHaveProperty('command_template');
		});

		it('get_all_git_statuses_for_dashboard returns statuses for issues in dashboard', async () => {
			const dashboards = await mockInvoke<Dashboard[]>('get_dashboards');
			const statuses = await mockInvoke<GitStatusCache[]>(
				'get_all_git_statuses_for_dashboard',
				{ dashboardId: dashboards[0].id },
			);
			expect(statuses.length).toBeGreaterThan(0);
			expect(statuses[0]).toHaveProperty('issue_id');
			expect(statuses[0]).toHaveProperty('pr_state');
		});

		it('check_gh_availability returns available', async () => {
			const result = await mockInvoke<string>('check_gh_availability');
			expect(result).toBe('available');
		});

		it('get_issue_dependencies returns dependencies', async () => {
			const dashboards = await mockInvoke<Dashboard[]>('get_dashboards');
			const deps = await mockInvoke<IssueDependency[]>('get_issue_dependencies', {
				dashboardId: dashboards[0].id,
			});
			expect(Array.isArray(deps)).toBe(true);
		});

		it('get_label_shape_mappings returns mappings for dashboard', async () => {
			const dashboards = await mockInvoke<Dashboard[]>('get_dashboards');
			const mappings = await mockInvoke<LabelShapeMapping[]>('get_label_shape_mappings', {
				dashboardId: dashboards[0].id,
			});
			expect(mappings.length).toBeGreaterThan(0);
			expect(mappings[0]).toHaveProperty('tree_shape');
		});

		it('get_notification_configs returns all event types', async () => {
			const configs = await mockInvoke<NotificationConfig[]>('get_notification_configs');
			expect(configs.length).toBeGreaterThan(0);
			const eventTypes = configs.map((c) => c.event_type);
			expect(eventTypes).toContain('session.needs-input');
			expect(eventTypes).toContain('session.end');
		});

		it('get_overview_data returns workspace data', async () => {
			const data = await mockInvoke<OverviewWorkspaceData[]>('get_overview_data');
			expect(data.length).toBeGreaterThan(0);
			expect(data[0]).toHaveProperty('open_issue_count');
		});

		it('sync_all_github_state returns sync result', async () => {
			const result = await mockInvoke<SyncAllResult>('sync_all_github_state', {
				dashboardId: 'x',
				owner: 'o',
				repo: 'r',
			});
			expect(result).toHaveProperty('synced_count');
			expect(result).toHaveProperty('errors');
		});
	});

	describe('write commands return without error', () => {
		it('create_dashboard returns object with id', async () => {
			const result = await mockInvoke<Dashboard>('create_dashboard', {
				request: { name: 'Test', type: 'repo' },
			});
			expect(result).toHaveProperty('id');
		});

		it('delete_dashboard returns null', async () => {
			const result = await mockInvoke('delete_dashboard', { id: 'x' });
			expect(result).toBeNull();
		});

		it('create_issue returns object with id and status', async () => {
			const result = await mockInvoke<Issue>('create_issue', {
				request: { name: 'New issue', dashboard_id: 'x' },
			});
			expect(result).toHaveProperty('id');
			expect(result.status).toBe('active');
		});

		it('setup_worktree returns a path string', async () => {
			const result = await mockInvoke<string>('setup_worktree', { request: {} });
			expect(typeof result).toBe('string');
		});

		it('execute_action returns empty string', async () => {
			const result = await mockInvoke<string>('execute_action', {
				actionId: 'x',
				issueId: 'y',
			});
			expect(result).toBe('');
		});
	});

	describe('unknown commands', () => {
		it('returns undefined for unhandled commands', async () => {
			const result = await mockInvoke('nonexistent_command', {});
			expect(result).toBeUndefined();
		});
	});
});
