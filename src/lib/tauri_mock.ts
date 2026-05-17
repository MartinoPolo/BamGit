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
	MOCK_USER_SETTINGS,
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
	'open_file',
	'save_file',
	'write_ai_config_file',
	'delete_ai_config_file',
	'delete_hook_from_settings',
	'delete_mcp_from_settings',
	'set_skill_override',
	'write_provider_settings',
	'upload_character_avatar',
	'scan_folder_for_characters',
	'bulk_import_characters',
	'import_sound_files',
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

	// ─── Character packs ─────────────────────────────────────────────────────
	get_character_packs: () => [
		{
			id: 'mock-pack-grove',
			name: 'grove',
			display_name: 'Grove',
			language: 'en',
			avatar_path: null,
			is_bundled: true,
			is_enabled: true,
			is_complete: true,
			created_at: '2026-01-01T00:00:00',
		},
		{
			id: 'mock-pack-peon',
			name: 'peon',
			display_name: 'Peon',
			language: 'en',
			avatar_path: null,
			is_bundled: true,
			is_enabled: true,
			is_complete: true,
			created_at: '2026-01-01T00:00:00',
		},
		{
			id: 'mock-pack-custom',
			name: 'my-character',
			display_name: 'My Character',
			language: 'cz',
			avatar_path: null,
			is_bundled: false,
			is_enabled: false,
			is_complete: false,
			created_at: '2026-05-10T12:00:00',
		},
	],
	get_character_pack_with_sounds: ({ packId }: Record<string, unknown>) => ({
		id: packId,
		name: 'grove',
		display_name: 'Grove',
		language: 'en',
		avatar_path: null,
		is_bundled: true,
		is_enabled: true,
		is_complete: true,
		created_at: '2026-01-01T00:00:00',
		sounds: [
			{
				id: 'mock-sound-1',
				character_pack_id: packId,
				event_type: 'session.needs-input',
				sound_file: 'needs_input.wav',
				label: 'Needs Input',
				sort_order: 0,
			},
			{
				id: 'mock-sound-2',
				character_pack_id: packId,
				event_type: 'session.end',
				sound_file: 'session_end.wav',
				label: 'Session End',
				sort_order: 0,
			},
		],
	}),
	create_character_pack: ({ request }: Record<string, unknown>) => ({
		id: `mock-pack-${Date.now()}`,
		...(request as Record<string, unknown>),
		avatar_path: null,
		is_bundled: false,
		is_enabled: false,
		is_complete: false,
		created_at: new Date().toISOString(),
	}),
	update_character_pack: ({ request }: Record<string, unknown>) => ({
		id: (request as Record<string, unknown>).id,
		name: (request as Record<string, unknown>).name ?? 'updated',
		display_name: (request as Record<string, unknown>).display_name ?? 'Updated',
		language: (request as Record<string, unknown>).language ?? null,
		avatar_path: null,
		is_bundled: false,
		is_enabled: true,
		is_complete: true,
		created_at: new Date().toISOString(),
	}),
	delete_character_pack: () => null,
	toggle_character_pack_enabled: () => null,
	save_character_pack_sounds: () => null,

	// ─── Keyboard shortcuts reads ─────────────────────────────────────────────
	get_custom_bindings: () => MOCK_CUSTOM_BINDINGS,

	// ─── Window reads ─────────────────────────────────────────────────────────
	get_window_bindings: () => MOCK_WINDOW_BINDINGS,
	get_overview_data: () => MOCK_OVERVIEW_DATA,
	get_user_setting: (args: Record<string, unknown>) => {
		const key = args.key as string;
		if (key in MOCK_USER_SETTINGS) {
			return { key, value: MOCK_USER_SETTINGS[key] };
		}
		return null;
	},
	set_user_setting: () => null,
	delete_user_setting: () => null,
	get_all_user_settings: () =>
		Object.entries(MOCK_USER_SETTINGS).map(([key, value]) => ({ key, value })),
	get_workspace_setting: () => null,
	set_workspace_setting: () => null,
	delete_workspace_setting: () => null,
	get_all_workspace_settings: () => [],
	get_workspace_overridden_keys: () => [],
	get_resolved_setting: (args: Record<string, unknown>) => {
		const key = args.key as string;
		return MOCK_USER_SETTINGS[key] ?? null;
	},

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
	discover_ai_config: ({ provider }) => {
		if (provider === 'open-code') {
			return {
				skills: [
					{
						name: 'opencode-skill-a',
						description: 'OpenCode skill A',
						file_path: 'C:/Users/snapy/.config/opencode/skills/skill-a.md',
						source: 'user',
						provider: 'open-code',
						argument_hint: null,
						allowed_tools: null,
						disable_model_invocation: null,
						author: null,
						version: null,
						category: null,
						content: '# Skill A',
						deprecated: false,
						skill_override: null,
					},
					{
						name: 'opencode-skill-b',
						description: 'OpenCode skill B',
						file_path: 'C:/Users/snapy/.config/opencode/skills/skill-b.md',
						source: 'user',
						provider: 'open-code',
						argument_hint: null,
						allowed_tools: null,
						disable_model_invocation: null,
						author: null,
						version: null,
						category: null,
						content: '# Skill B',
						deprecated: false,
						skill_override: null,
					},
				],
				agents: [],
				hooks: [],
				mcp_servers: [
					{
						name: 'opencode-mcp',
						source: 'user',
						provider: 'open-code',
						provider_name: 'opencode',
						transport_type: 'stdio',
						enabled: true,
						command: 'npx',
						url: null,
						args: ['-y', 'opencode-mcp'],
						env_var_names: null,
						deprecated: false,
					},
				],
				memories: [],
				instructions: [
					{
						filename: 'AGENTS.md',
						file_path: 'C:/projects/grovekeeper/AGENTS.md',
						source: 'project',
						provider: 'open-code',
						content: '# Agent Instructions',
						file_size: 256,
						last_modified: '2026-05-08T10:00:00Z',
						deprecated: false,
					},
				],
				rules: [],
				sources: [
					{
						provider: 'open-code',
						label: 'User config',
						path: 'C:/Users/snapy/.config/opencode',
						source_type: 'user',
					},
				],
			};
		}

		if (provider === 'codex') {
			return {
				skills: [
					{
						name: 'codex-skill',
						description: 'Codex skill',
						file_path: 'C:/Users/snapy/.codex/skills/codex-skill.md',
						source: 'user',
						provider: 'codex',
						argument_hint: null,
						allowed_tools: null,
						disable_model_invocation: null,
						author: null,
						version: null,
						category: null,
						content: '# Codex Skill',
						deprecated: false,
						skill_override: null,
					},
				],
				agents: [],
				hooks: [],
				mcp_servers: [
					{
						name: 'codex-mcp',
						source: 'user',
						provider: 'codex',
						provider_name: 'codex',
						transport_type: 'stdio',
						enabled: true,
						command: 'npx',
						url: null,
						args: ['-y', 'codex-mcp'],
						env_var_names: null,
						deprecated: false,
					},
				],
				memories: [],
				instructions: [
					{
						filename: 'AGENTS.md',
						file_path: 'C:/projects/grovekeeper/AGENTS.md',
						source: 'project',
						provider: 'codex',
						content: '# Agent Instructions',
						file_size: 256,
						last_modified: '2026-05-08T10:00:00Z',
						deprecated: false,
					},
				],
				rules: [],
				sources: [
					{
						provider: 'codex',
						label: 'User config',
						path: 'C:/Users/snapy/.codex',
						source_type: 'user',
					},
				],
			};
		}

		if (provider === 'cursor') {
			return {
				skills: [
					{
						name: 'cursor-skill',
						description: 'Cursor skill',
						file_path: 'C:/Users/snapy/.cursor/skills/cursor-skill.md',
						source: 'user',
						provider: 'cursor',
						argument_hint: null,
						allowed_tools: null,
						disable_model_invocation: null,
						author: null,
						version: null,
						category: null,
						content: '# Cursor Skill',
						deprecated: false,
						skill_override: null,
					},
				],
				agents: [],
				hooks: [],
				mcp_servers: [
					{
						name: 'cursor-mcp',
						source: 'user',
						provider: 'cursor',
						provider_name: 'cursor',
						transport_type: 'stdio',
						enabled: true,
						command: 'npx',
						url: null,
						args: ['-y', 'cursor-mcp'],
						env_var_names: null,
						deprecated: false,
					},
				],
				memories: [],
				instructions: [],
				rules: [
					{
						filename: 'cursor-rule.md',
						file_path: 'C:/Users/snapy/.cursor/rules/cursor-rule.md',
						source: 'user',
						provider: 'cursor',
						language: null,
						description: 'Cursor rule',
						always_apply: true,
						globs: null,
						content: '# Cursor Rule',
						deprecated: false,
					},
				],
				sources: [
					{
						provider: 'cursor',
						label: 'User config',
						path: 'C:/Users/snapy/.cursor',
						source_type: 'user',
					},
				],
			};
		}

		// Default: claude-code
		return {
			skills: [
				{
					name: 'mp-execute',
					description: 'Execute work with TDD methodology',
					file_path: 'C:/Users/snapy/.claude/commands/mp-execute/SKILL.md',
					source: 'user',
					provider: 'claude-code',
					argument_hint: '#42 or inline task',
					allowed_tools: ['Bash', 'Read', 'Write', 'Edit', 'Grep', 'Glob'],
					disable_model_invocation: false,
					author: 'MartinP',
					version: '2.1',
					category: 'execution',
					content: '# Execute Work\n\nUnified execution skill with TDD methodology.',
					deprecated: false,
					skill_override: null,
				},
				{
					name: 'mp-hitl',
					description: 'Resolve human decisions in HITL-labeled issues',
					file_path: 'C:/Users/snapy/.claude/commands/mp-hitl/SKILL.md',
					source: 'user',
					provider: 'claude-code',
					argument_hint: 'PRD number',
					allowed_tools: ['Bash', 'Read', 'Grep', 'Glob'],
					disable_model_invocation: false,
					author: 'MartinP',
					version: '1.0',
					category: 'planning',
					content: '# HITL Resolution\n\nGrill open decisions in GitHub issues.',
					deprecated: false,
					skill_override: null,
				},
				{
					name: 'mp-check-fix',
					description: 'Run checks and fix failures',
					file_path: 'C:/Users/snapy/.claude/commands/mp-check-fix/SKILL.md',
					source: 'user',
					provider: 'claude-code',
					argument_hint: null,
					allowed_tools: ['Bash', 'Read', 'Grep', 'Glob'],
					disable_model_invocation: false,
					author: 'MartinP',
					version: '1.2',
					category: 'quality',
					content: '# Check & Fix\n\nRun all checks and fix issues.',
					deprecated: false,
					skill_override: null,
				},
			],
			agents: [
				{
					name: 'mp-executor',
					description: 'Executes grouped task chunks with clear scope',
					file_path: 'C:/Users/snapy/.claude/agents/mp-executor.md',
					source: 'user',
					provider: 'claude-code',
					model: 'sonnet',
					tools: ['Read', 'Write', 'Edit', 'Bash', 'Grep', 'Glob'],
					color: '#3b82f6',
					content: '# Executor\n\nImplementation agent for scoped tasks.',
					deprecated: false,
				},
				{
					name: 'mp-reviewer-full',
					description: 'Thorough read-only code reviewer across six dimensions',
					file_path: 'C:/Users/snapy/.claude/agents/mp-reviewer-full.md',
					source: 'user',
					provider: 'claude-code',
					model: 'sonnet',
					tools: ['Read', 'Grep', 'Glob', 'Bash'],
					color: '#f97316',
					content:
						'# Full Reviewer\n\nReviews code across quality, security, performance.',
					deprecated: false,
				},
			],
			hooks: [
				{
					filename: 'pre-commit-gate.js',
					file_path: 'C:/Users/snapy/.claude/hooks/pre-commit-gate.js',
					source: 'user',
					provider: 'claude-code',
					event_type: 'PreToolUse',
					matcher: 'Bash|PowerShell',
					timeout: 10000,
					description: 'Blocks dangerous commands like rm -rf and force push to main',
					deprecated: false,
				},
				{
					filename: 'post-write-formatter.js',
					file_path: 'C:/Users/snapy/.claude/hooks/post-write-formatter.js',
					source: 'user',
					provider: 'claude-code',
					event_type: 'PostToolUse',
					matcher: 'Write|Edit',
					timeout: 5000,
					description: 'Auto-formats files after write operations',
					deprecated: false,
				},
			],
			mcp_servers: [
				{
					name: 'context7',
					source: 'user',
					provider: 'claude-code',
					provider_name: 'claude-code',
					transport_type: 'stdio',
					enabled: true,
					command: 'npx',
					url: null,
					args: ['-y', '@anthropic/context7-mcp'],
					env_var_names: null,
					deprecated: false,
				},
				{
					name: 'chrome-devtools',
					source: 'project',
					provider: 'claude-code',
					provider_name: 'claude-code',
					transport_type: 'stdio',
					enabled: true,
					command: 'npx',
					url: null,
					args: ['chrome-devtools-mcp'],
					env_var_names: null,
					deprecated: false,
				},
				{
					name: 'svelte',
					source: 'user',
					provider: 'claude-code',
					provider_name: 'cloud',
					transport_type: 'cloud',
					enabled: true,
					command: null,
					url: null,
					args: null,
					env_var_names: null,
					deprecated: false,
				},
			],
			memories: [
				{
					name: 'User dev workflow',
					description: 'Parallel sessions, Peacock, terminal tabs',
					file_path: 'C:/Users/snapy/.claude/projects/abc123/memory/user_workflow.md',
					source: 'user',
					provider: 'claude-code',
					memory_type: 'user',
					content:
						'User prefers parallel Claude Code sessions with Peacock color coding.',
					deprecated: false,
				},
				{
					name: 'No single-line if',
					description: 'Always use braces + multi-line blocks on if statements',
					file_path:
						'C:/Users/snapy/.claude/projects/abc123/memory/feedback_no_single_line_if.md',
					source: 'user',
					provider: 'claude-code',
					memory_type: 'feedback',
					content: 'Always use braces and multi-line blocks for if statements.',
					deprecated: false,
				},
				{
					name: 'PRD Architecture',
					description: '10-PRD structure, module map, multi-window singleton',
					file_path:
						'C:/Users/snapy/.claude/projects/abc123/memory/project_prd_architecture.md',
					source: 'user',
					provider: 'claude-code',
					memory_type: 'project',
					content: 'The project uses a 10-PRD structure with module map.',
					deprecated: false,
				},
			],
			instructions: [
				{
					filename: 'CLAUDE.md',
					file_path: 'C:/projects/grovekeeper/CLAUDE.md',
					source: 'project',
					provider: 'claude-code',
					content:
						'# Project Instructions\n\n## Stack\n\nTauri v2 + SvelteKit + Vite\n\n## Commands\n\n`pnpm tauri dev` -- full dev',
					file_size: 2048,
					last_modified: '2026-05-08T10:00:00Z',
					deprecated: false,
				},
				{
					filename: 'AGENTS.md',
					file_path: 'C:/projects/grovekeeper/AGENTS.md',
					source: 'project',
					provider: 'claude-code',
					content: '# Agent Instructions\n\nBe concise. DRY. Verbose naming.',
					file_size: 512,
					last_modified: '2026-05-07T14:30:00Z',
					deprecated: false,
				},
			],
			rules: [
				{
					filename: 'svelte.md',
					file_path: 'C:/_MP_projects/mpx-claude-code/rules/svelte.md',
					source: 'user',
					provider: 'claude-code',
					language: null,
					description: 'Svelte 5 best practices',
					always_apply: true,
					globs: null,
					content: '# Svelte 5 Rules',
					deprecated: false,
				},
				{
					filename: 'typescript.md',
					file_path: 'C:/_MP_projects/mpx-claude-code/rules/typescript.md',
					source: 'user',
					provider: 'claude-code',
					language: null,
					description: 'TypeScript strict rules',
					always_apply: true,
					globs: null,
					content: '# TypeScript Rules',
					deprecated: false,
				},
			],
			sources: [
				{
					provider: 'claude-code',
					label: 'User skills',
					path: 'C:/Users/snapy/.claude/skills',
					source_type: 'user',
				},
				{
					provider: 'claude-code',
					label: 'Project skills',
					path: '.claude/skills',
					source_type: 'project',
				},
				{
					provider: 'claude-code',
					label: 'User agents',
					path: 'C:/Users/snapy/.claude/agents',
					source_type: 'user',
				},
				{
					provider: 'claude-code',
					label: 'User hooks',
					path: 'C:/Users/snapy/.claude/hooks',
					source_type: 'user',
				},
				{
					provider: 'claude-code',
					label: 'User memories',
					path: 'C:/Users/snapy/.claude/projects/abc123/memory',
					source_type: 'user',
				},
			],
		};
	},
	get_custom_discovery_paths: () => [],
	set_custom_discovery_paths: () => null,
	detect_installed_providers: () => [
		{
			kind: 'claude-code',
			installed: true,
			user_dir: 'C:/Users/snapy/.claude',
			project_dir: null,
			binary_path: 'C:/Program Files/nodejs/claude.cmd',
		},
		{
			kind: 'open-code',
			installed: true,
			user_dir: 'C:/Users/snapy/.config/opencode',
			project_dir: null,
			binary_path: null,
		},
		{
			kind: 'codex',
			installed: false,
			user_dir: null,
			project_dir: null,
			binary_path: null,
		},
		{
			kind: 'cursor',
			installed: true,
			user_dir: 'C:/Users/snapy/.cursor',
			project_dir: null,
			binary_path: null,
		},
	],
	inspect_symlink: () => ({ is_symlink: false, resolved_path: null, target_exists: true }),
	write_ai_config_file: () => null,
	delete_ai_config_file: () => null,
	delete_hook_from_settings: () => null,
	delete_mcp_from_settings: () => null,
	set_skill_override: () => null,
	read_provider_settings: ({ provider }) => {
		if (provider === 'claude-code') {
			return {
				model: 'claude-opus-4-7',
				effortLevel: 'medium',
				alwaysThinkingEnabled: false,
			};
		}
		if (provider === 'open-code') {
			return { model: 'gpt-5', autoupdate: true };
		}
		if (provider === 'codex') {
			return { model: 'gpt-5', approval_policy: 'on-request' };
		}
		if (provider === 'cursor') {
			return {};
		}
		return {};
	},
	write_provider_settings: () => null,

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
