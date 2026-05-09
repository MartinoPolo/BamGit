import { showMockToast } from '$lib/modules/toasts/mock_toast_bridge.js';
import { MockDesktopOnlyError } from '$lib/mock_desktop_only_error.js';
import {
	MOCK_ACHIEVEMENTS,
	MOCK_ACTIONS,
	MOCK_ASSIGNED_ISSUES_RESULT,
	MOCK_COLOR_PALETTES,
	MOCK_CUSTOM_BINDINGS,
	MOCK_DASHBOARDS,
	MOCK_GIT_STATUSES,
	MOCK_IMPORT_SUMMARY,
	MOCK_ISSUE_DEPENDENCIES,
	MOCK_ISSUES,
	MOCK_LABEL_SHAPE_MAPPINGS,
	MOCK_NOTIFICATION_CONFIGS,
	MOCK_OVERVIEW_DATA,
	MOCK_PRUNABLE_ISSUES,
	MOCK_SESSIONS,
	MOCK_SYNC_RESULT,
	MOCK_USAGE_DASHBOARD,
	MOCK_WINDOW_BINDINGS,
	MOCK_WORKSPACE_COMMANDS,
} from './tauri_mock_data.js';

type MockHandler = (args: Record<string, unknown>) => unknown;

const TAURI_ONLY_COMMANDS = new Set([
	'setup_worktree',
	'remove_worktree',
	'open_terminal',
	'terminate_session',
	'interrupt_session',
	'send_message',
	'adopt_session',
	'spawn_session',
	'respond_to_request',
	'respond_to_user_input',
	'sync_all_github_state',
	'execute_action',
	'open_workspace_window',
	'update_peacock_color',
	'pick_folder',
	'discover_ai_config',
	'run_workspace_command',
	'kill_workspace_process',
	'github_device_flow_start',
	'github_device_flow_poll',
	'test_notification_sound',
]);

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

	// ─── Workspace commands ───────────────────────────────────────────────────
	get_workspace_commands_for_dashboard: ({ dashboardId }) =>
		MOCK_WORKSPACE_COMMANDS.filter((c) => c.dashboard_id === dashboardId),
	create_workspace_command: ({ request }) => ({
		id: `mock-cmd-${Date.now()}`,
		dashboard_id: (request as Record<string, unknown>).dashboard_id,
		category: (request as Record<string, unknown>).category,
		name: (request as Record<string, unknown>).name,
		command: (request as Record<string, unknown>).command,
		port_pattern: (request as Record<string, unknown>).port_pattern ?? null,
		expected_exit_code: (request as Record<string, unknown>).expected_exit_code ?? 0,
		sort_order: (request as Record<string, unknown>).sort_order ?? 0,
	}),
	update_workspace_command: ({ request }) => request,
	delete_workspace_command: () => null,
	reorder_workspace_commands: () => null,

	// ─── Dashboard archive/delete ─────────────────────────────────────────────
	archive_dashboard: () => null,
	unarchive_dashboard: () => null,

	// ─── Process management ───────────────────────────────────────────────────
	get_running_processes: () => [],
	get_processes_for_issue: () => [],
	get_process_logs: () => [],

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
	github_auth_status: () => ({
		status: 'oauth-connected',
		user: { login: 'MockUser', avatar_url: 'https://avatars.githubusercontent.com/u/0?v=4' },
	}),
	github_logout: () => null,
	fetch_assigned_issues: () => MOCK_ASSIGNED_ISSUES_RESULT,
	get_deleted_assigned_issue_numbers: () => [],
	sync_all_github_state: () => MOCK_SYNC_RESULT,

	// ─── Notifications reads ──────────────────────────────────────────────────
	get_notification_configs: () => MOCK_NOTIFICATION_CONFIGS,
	get_notification_volume: () => 0.8,
	get_sound_volume_override: () => 1.0,
	get_all_sound_volume_overrides: () => [],
	list_sound_packs: () => [
		{
			name: 'grove',
			display_name: 'Grove',
			version: '1.0.0',
			author: 'Grovekeeper',
			avatar: null,
			event_count: 15,
			path: 'resources/sounds/grove',
		},
	],

	// ─── Keyboard shortcuts reads ─────────────────────────────────────────────
	get_custom_bindings: () => MOCK_CUSTOM_BINDINGS,

	// ─── Window reads ─────────────────────────────────────────────────────────
	get_window_bindings: () => MOCK_WINDOW_BINDINGS,
	get_overview_data: () => MOCK_OVERVIEW_DATA,
	get_app_setting: () => null,

	// ─── Metrics reads ───────────────────────────────────────────────────────
	get_usage_dashboard: () => MOCK_USAGE_DASHBOARD,
	get_achievements: () => MOCK_ACHIEVEMENTS,
	import_historical_sessions: () => MOCK_IMPORT_SUMMARY,
	get_exchange_rates: () => ({
		EUR: 0.92,
		GBP: 0.79,
		CZK: 22.5,
		JPY: 149.8,
		CAD: 1.36,
	}),

	// ─── Dialog ──────────────────────────────────────────────────────────────
	pick_folder: () => 'C:/mock/selected-folder',

	// ─── Repo search ─────────────────────────────────────────────────────────
	list_user_repos: () => [
		{
			name: 'grovekeeper',
			owner: 'MartinoPolo',
			description: 'Agent orchestration GUI',
			is_private: false,
		},
		{
			name: 'low-poly-2d-trees',
			owner: 'MartinoPolo',
			description: '2D tree rendering library',
			is_private: false,
		},
		{
			name: 'my-private-app',
			owner: 'MartinoPolo',
			description: 'Private project',
			is_private: true,
		},
		{
			name: 'react-dashboard',
			owner: 'MartinoPolo',
			description: 'Dashboard template',
			is_private: false,
		},
		{
			name: 'api-gateway',
			owner: 'acme-corp',
			description: 'API gateway service',
			is_private: true,
		},
	],
	search_github_repos: () => [
		{
			name: 'svelte',
			owner: 'sveltejs',
			description: 'Cybernetically enhanced web apps',
			is_private: false,
		},
		{
			name: 'tauri',
			owner: 'tauri-apps',
			description: 'Build smaller, faster apps',
			is_private: false,
		},
	],

	// ─── Search ───────────────────────────────────────────────────────────────
	search_github_issues: () => [],
	read_raw_requirements: () => '',

	// ─── AI Config reads ─────────────────────────────────────────────────────
	discover_ai_config: () => ({
		skills: [
			{
				name: 'mp-execute',
				description: 'Execute work with TDD methodology',
				file_path: 'C:/Users/snapy/.claude/commands/mp-execute/SKILL.md',
				source: 'user',
				argument_hint: '#42 or inline task',
				allowed_tools: ['Bash', 'Read', 'Write', 'Edit', 'Grep', 'Glob'],
				disable_model_invocation: false,
				author: 'MartinP',
				version: '2.1',
				category: 'execution',
				content: '# Execute Work\n\nUnified execution skill with TDD methodology.',
			},
			{
				name: 'mp-hitl',
				description: 'Resolve human decisions in HITL-labeled issues',
				file_path: 'C:/Users/snapy/.claude/commands/mp-hitl/SKILL.md',
				source: 'user',
				argument_hint: 'PRD number',
				allowed_tools: ['Bash', 'Read', 'Grep', 'Glob'],
				disable_model_invocation: false,
				author: 'MartinP',
				version: '1.0',
				category: 'planning',
				content: '# HITL Resolution\n\nGrill open decisions in GitHub issues.',
			},
			{
				name: 'mp-check-fix',
				description: 'Run checks and fix failures',
				file_path: 'C:/Users/snapy/.claude/commands/mp-check-fix/SKILL.md',
				source: 'user',
				argument_hint: null,
				allowed_tools: ['Bash', 'Read', 'Grep', 'Glob'],
				disable_model_invocation: false,
				author: 'MartinP',
				version: '1.2',
				category: 'quality',
				content: '# Check & Fix\n\nRun all checks and fix issues.',
			},
		],
		agents: [
			{
				name: 'mp-executor',
				description: 'Executes grouped task chunks with clear scope',
				file_path: 'C:/Users/snapy/.claude/agents/mp-executor.md',
				source: 'user',
				model: 'sonnet',
				tools: ['Read', 'Write', 'Edit', 'Bash', 'Grep', 'Glob'],
				color: '#3b82f6',
				content: '# Executor\n\nImplementation agent for scoped tasks.',
			},
			{
				name: 'mp-reviewer-full',
				description: 'Thorough read-only code reviewer across six dimensions',
				file_path: 'C:/Users/snapy/.claude/agents/mp-reviewer-full.md',
				source: 'user',
				model: 'sonnet',
				tools: ['Read', 'Grep', 'Glob', 'Bash'],
				color: '#f97316',
				content: '# Full Reviewer\n\nReviews code across quality, security, performance.',
			},
		],
		hooks: [
			{
				filename: 'pre-commit-gate.js',
				file_path: 'C:/Users/snapy/.claude/hooks/pre-commit-gate.js',
				source: 'user',
				event_type: 'PreToolUse',
				matcher: 'Bash|PowerShell',
				timeout: 10000,
				description: 'Blocks dangerous commands like rm -rf and force push to main',
			},
			{
				filename: 'post-write-formatter.js',
				file_path: 'C:/Users/snapy/.claude/hooks/post-write-formatter.js',
				source: 'user',
				event_type: 'PostToolUse',
				matcher: 'Write|Edit',
				timeout: 5000,
				description: 'Auto-formats files after write operations',
			},
		],
		mcp_servers: [
			{
				name: 'context7',
				source: 'user',
				provider: 'claude-code',
				transport_type: 'stdio',
				enabled: true,
				command: 'npx',
				url: null,
				args: ['-y', '@anthropic/context7-mcp'],
				env_var_names: null,
			},
			{
				name: 'chrome-devtools',
				source: 'project',
				provider: 'claude-code',
				transport_type: 'stdio',
				enabled: true,
				command: 'npx',
				url: null,
				args: ['chrome-devtools-mcp'],
				env_var_names: null,
			},
			{
				name: 'svelte',
				source: 'user',
				provider: 'claude-code',
				transport_type: 'cloud',
				enabled: true,
				command: null,
				url: null,
				args: null,
				env_var_names: null,
			},
		],
		memories: [
			{
				name: 'User dev workflow',
				description: 'Parallel sessions, Peacock, terminal tabs',
				file_path: 'C:/Users/snapy/.claude/projects/abc123/memory/user_workflow.md',
				memory_type: 'user',
				content: 'User prefers parallel Claude Code sessions with Peacock color coding.',
			},
			{
				name: 'No single-line if',
				description: 'Always use braces + multi-line blocks on if statements',
				file_path:
					'C:/Users/snapy/.claude/projects/abc123/memory/feedback_no_single_line_if.md',
				memory_type: 'feedback',
				content: 'Always use braces and multi-line blocks for if statements.',
			},
			{
				name: 'PRD Architecture',
				description: '10-PRD structure, module map, multi-window singleton',
				file_path:
					'C:/Users/snapy/.claude/projects/abc123/memory/project_prd_architecture.md',
				memory_type: 'project',
				content: 'The project uses a 10-PRD structure with module map.',
			},
		],
		instructions: [
			{
				filename: 'CLAUDE.md',
				file_path: 'C:/projects/grovekeeper/CLAUDE.md',
				source: 'project',
				content:
					'# Project Instructions\n\n## Stack\n\nTauri v2 + SvelteKit + Vite\n\n## Commands\n\n`pnpm tauri dev` -- full dev',
				file_size: 2048,
				last_modified: '2026-05-08T10:00:00Z',
			},
			{
				filename: 'AGENTS.md',
				file_path: 'C:/projects/grovekeeper/AGENTS.md',
				source: 'project',
				content: '# Agent Instructions\n\nBe concise. DRY. Verbose naming.',
				file_size: 512,
				last_modified: '2026-05-07T14:30:00Z',
			},
		],
	}),
	get_custom_discovery_paths: () => [],
	set_custom_discovery_paths: () => null,

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
		character_pack_id: null,
		character_avatar: null,
		is_sound_muted: false,
		...(request as object),
	}),
	update_issue: ({ request }) => request,
	update_issue_character: ({ issueId }) => {
		const issue = MOCK_ISSUES.find((i) => i.id === issueId);
		return issue ?? null;
	},
	toggle_issue_sound_mute: ({ issueId }) => {
		const issue = MOCK_ISSUES.find((i) => i.id === issueId);
		return issue ? { ...issue, is_sound_muted: !issue.is_sound_muted } : null;
	},
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
	respond_to_request: () => null,
	respond_to_user_input: () => null,
	adopt_session: () => `mock-session-${crypto.randomUUID().slice(0, 8)}`,
	update_notification_config: ({ request }) => request,
	test_notification_sound: () => null,
	set_notification_volume: () => null,
	set_sound_volume_override: () => null,
	install_sound_pack: () => ({
		name: 'mock-pack',
		display_name: 'Mock Pack',
		version: '1.0.0',
		author: 'Mock',
		avatar: null,
		event_count: 0,
		path: '',
	}),
	remove_sound_pack: () => null,
	upsert_custom_binding: () => null,
	delete_custom_binding: () => null,
	open_workspace_window: () => null,
	close_workspace_window: () => null,
	save_window_geometry: () => null,
	set_app_setting: () => null,
	open_terminal: () => null,
	update_peacock_color: () => null,
	run_workspace_command: () => null,
	kill_workspace_process: () => null,
	write_raw_requirements: () => null,
	seed_demo_workspace: () => null,
	delete_demo_workspace: () => null,
};

export async function mockInvoke<T>(command: string, args?: Record<string, unknown>): Promise<T> {
	const handler = MOCK_COMMAND_HANDLERS[command];
	if (TAURI_ONLY_COMMANDS.has(command)) {
		showMockToast(command, args);
		if (handler === undefined) {
			throw new MockDesktopOnlyError(command);
		}
		return handler(args ?? {}) as T;
	}
	if (handler === undefined) {
		console.warn(`[tauri-mock] Unhandled command: "${command}"`, args);
		return undefined as T;
	}
	return handler(args ?? {}) as T;
}
