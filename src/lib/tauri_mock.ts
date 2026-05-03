import {
	MOCK_ACTIONS,
	MOCK_ASSIGNED_ISSUES_RESULT,
	MOCK_COLOR_PALETTES,
	MOCK_CUSTOM_BINDINGS,
	MOCK_DASHBOARDS,
	MOCK_GIT_STATUSES,
	MOCK_ISSUE_DEPENDENCIES,
	MOCK_ISSUES,
	MOCK_LABEL_SHAPE_MAPPINGS,
	MOCK_NOTIFICATION_CONFIGS,
	MOCK_OVERVIEW_DATA,
	MOCK_PRUNABLE_ISSUES,
	MOCK_SESSIONS,
	MOCK_SYNC_RESULT,
	MOCK_WINDOW_BINDINGS,
} from './tauri_mock_data.js';

type MockHandler = (args: Record<string, unknown>) => unknown;

const MOCK_COMMAND_HANDLERS: Record<string, MockHandler> = {
	// ─── Board / Dashboard reads ──────────────────────────────────────────────
	get_dashboards: () => MOCK_DASHBOARDS,
	get_all_color_palettes: () => MOCK_COLOR_PALETTES,
	get_next_available_color: () => '#3b82f6',
	get_used_colors_for_dashboard: () => ['#ef4444', '#8b5cf6', '#f97316'],
	get_label_shape_mappings: ({ dashboardId }) =>
		MOCK_LABEL_SHAPE_MAPPINGS.filter((m) => m.dashboard_id === dashboardId),

	// ─── Issues reads ─────────────────────────────────────────────────────────
	get_issues_for_dashboard: ({ dashboardId }) =>
		MOCK_ISSUES.filter((i) => i.dashboard_id === dashboardId),
	get_issue_dependencies: ({ dashboardId }) =>
		MOCK_ISSUE_DEPENDENCIES.filter((d) => {
			const blockerIssue = MOCK_ISSUES.find((i) => i.id === d.blocker_issue_id);
			return blockerIssue?.dashboard_id === dashboardId;
		}),
	get_prunable_issues: () => MOCK_PRUNABLE_ISSUES,

	// ─── Actions reads ────────────────────────────────────────────────────────
	get_actions_for_dashboard: ({ dashboardId }) =>
		MOCK_ACTIONS.filter((a) => a.dashboard_id === dashboardId),
	get_action: ({ id }) => MOCK_ACTIONS.find((a) => a.id === id) ?? null,

	// ─── Sessions reads ───────────────────────────────────────────────────────
	get_sessions: () => MOCK_SESSIONS,

	// ─── Version control reads ────────────────────────────────────────────────
	get_all_git_statuses_for_dashboard: ({ dashboardId }) =>
		MOCK_GIT_STATUSES.filter((s) => {
			const issue = MOCK_ISSUES.find((i) => i.id === s.issue_id);
			return issue?.dashboard_id === dashboardId;
		}),
	refresh_git_status: ({ issueId }) =>
		MOCK_GIT_STATUSES.find((s) => s.issue_id === issueId) ?? {
			issue_id: issueId,
			branch_status: null,
			pr_state: null,
			pr_number: null,
			pr_url: null,
			github_issue_state: null,
			behind_base_count: null,
			merge_conflict: null,
			fetched_at: null,
		},
	check_gh_availability: () => 'available',
	fetch_assigned_issues: () => MOCK_ASSIGNED_ISSUES_RESULT,
	get_deleted_assigned_issue_numbers: () => [],
	sync_all_github_state: () => MOCK_SYNC_RESULT,

	// ─── Notifications reads ──────────────────────────────────────────────────
	get_notification_configs: () => MOCK_NOTIFICATION_CONFIGS,

	// ─── Keyboard shortcuts reads ─────────────────────────────────────────────
	get_custom_bindings: () => MOCK_CUSTOM_BINDINGS,

	// ─── Window reads ─────────────────────────────────────────────────────────
	get_window_bindings: () => MOCK_WINDOW_BINDINGS,
	get_overview_data: () => MOCK_OVERVIEW_DATA,
	get_app_setting: () => null,

	// ─── Search ───────────────────────────────────────────────────────────────
	search_github_issues: () => [],
	read_raw_requirements: () => '',

	// ─── Write commands (no-ops) ──────────────────────────────────────────────
	create_dashboard: ({ request }) => ({
		id: `mock-${crypto.randomUUID().slice(0, 8)}`,
		...(request as object),
	}),
	update_dashboard: ({ request }) => request,
	delete_dashboard: () => null,
	add_repo_to_portfolio: () => ({
		id: `mock-ptr-${crypto.randomUUID().slice(0, 8)}`,
		portfolio_dashboard_id: '',
		repo_dashboard_id: '',
		sort_order: 0,
	}),
	remove_repo_from_portfolio: () => null,
	create_color_palette: ({ request }) => ({
		id: `mock-pal-${crypto.randomUUID().slice(0, 8)}`,
		...(request as object),
	}),
	update_color_palette: ({ request }) => request,
	delete_color_palette: () => null,
	upsert_label_shape_mapping: (args) => ({
		id: `mock-lsm-${crypto.randomUUID().slice(0, 8)}`,
		dashboard_id: args.dashboardId ?? '',
		label_name: args.labelName ?? '',
		tree_shape: args.treeShape ?? 'oak',
		color: args.color ?? null,
		priority_order: args.priorityOrder ?? 0,
	}),
	create_issue: ({ request }) => ({
		id: `mock-issue-${crypto.randomUUID().slice(0, 8)}`,
		status: 'active',
		worktree_state: 'none',
		sort_order: 99,
		created_at: new Date().toISOString(),
		...(request as object),
	}),
	update_issue: ({ request }) => request,
	delete_issue: () => null,
	archive_issue: ({ id }) => {
		const issue = MOCK_ISSUES.find((i) => i.id === id);
		return issue ? { ...issue, status: 'archived' } : null;
	},
	unarchive_issue: ({ id }) => {
		const issue = MOCK_ISSUES.find((i) => i.id === id);
		return issue ? { ...issue, status: 'active' } : null;
	},
	setup_worktree: () => 'C:/_MP_projects/worktrees/mock-worktree',
	remove_worktree: () => null,
	create_action: ({ request }) => ({
		id: `mock-action-${crypto.randomUUID().slice(0, 8)}`,
		sort_order: 99,
		visible: true,
		...(request as object),
	}),
	update_action: ({ request }) => request,
	delete_action: () => null,
	reorder_actions: () => null,
	execute_action: () => '',
	spawn_session: () => `mock-session-${crypto.randomUUID().slice(0, 8)}`,
	terminate_session: () => null,
	interrupt_session: () => null,
	send_message: () => null,
	adopt_session: () => `mock-session-${crypto.randomUUID().slice(0, 8)}`,
	update_notification_config: ({ request }) => request,
	test_notification_sound: () => null,
	upsert_custom_binding: () => null,
	delete_custom_binding: () => null,
	open_workspace_window: () => null,
	close_workspace_window: () => null,
	save_window_geometry: () => null,
	set_app_setting: () => null,
	open_terminal: () => null,
	write_raw_requirements: () => null,
	seed_demo_workspace: () => null,
	delete_demo_workspace: () => null,
};

export async function mockInvoke<T>(command: string, args?: Record<string, unknown>): Promise<T> {
	const handler = MOCK_COMMAND_HANDLERS[command];
	if (handler === undefined) {
		console.warn(`[tauri-mock] Unhandled command: "${command}"`, args);
		return undefined as T;
	}
	return handler(args ?? {}) as T;
}
