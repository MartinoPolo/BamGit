import type {
	Action,
	AssignedIssue,
	AssignedIssuesResult,
	ColorPalette,
	Dashboard,
	GitStatusCache,
	Issue,
	IssueDependency,
	KeyboardShortcut,
	LabelShapeMapping,
	NotificationConfig,
	OverviewWorkspaceData,
	PrunableIssue,
	Session,
	SyncAllResult,
	WindowWorkspaceBinding,
} from '$lib/types/generated';

// ─── Stable IDs ───────────────────────────────────────────────────────────────

const DASHBOARD_GROVEKEEPER = 'mock-dash-grovekeeper';
const DASHBOARD_PORTFOLIO = 'mock-dash-portfolio';

const ISSUE_AUTH_MIDDLEWARE = 'mock-issue-auth';
const ISSUE_DARK_MODE = 'mock-issue-dark-mode';
const ISSUE_PERF_AUDIT = 'mock-issue-perf';
const ISSUE_CI_PIPELINE = 'mock-issue-ci';
const ISSUE_ONBOARDING = 'mock-issue-onboarding';
const ISSUE_ARCHIVED = 'mock-issue-archived';
const ISSUE_API_GATEWAY = 'mock-issue-api-gateway';
const ISSUE_INTEGRATION_TESTS = 'mock-issue-integration-tests';

const PALETTE_VIVID = 'palette-vivid';

// ─── Dashboards ───────────────────────────────────────────────────────────────

export const MOCK_DASHBOARDS: Dashboard[] = [
	{
		id: DASHBOARD_GROVEKEEPER,
		name: 'Grovekeeper',
		type: 'repo',
		github_repo: 'MartinoPolo/Grovekeeper',
		local_folder: 'C:/_MP_projects/Grovekeeper',
		default_base_branch: 'dev',
		worktree_parent_folder: 'C:/_MP_projects/worktrees',
		color_palette_id: PALETTE_VIVID,
		default_shape: 'oak',
		priorities_enabled: true,
	},
	{
		id: DASHBOARD_PORTFOLIO,
		name: 'All Projects',
		type: 'portfolio',
		github_repo: null,
		local_folder: null,
		default_base_branch: null,
		worktree_parent_folder: null,
		color_palette_id: null,
		default_shape: 'pine',
		priorities_enabled: true,
	},
];

// ─── Issues ───────────────────────────────────────────────────────────────────

export const MOCK_ISSUES: Issue[] = [
	{
		id: ISSUE_AUTH_MIDDLEWARE,
		dashboard_id: DASHBOARD_GROVEKEEPER,
		name: 'Refactor auth middleware for OAuth2',
		priority: 'high',
		color: '#ef4444',
		status: 'active',
		github_issue_url: 'https://github.com/MartinoPolo/Grovekeeper/issues/42',
		github_issue_number: 42,
		branch_name: '42-refactor-auth-middleware',
		base_branch: 'dev',
		worktree_folder: 'C:/_MP_projects/worktrees/42-refactor-auth-middleware',
		worktree_state: 'active',
		parent_issue_id: null,
		editor_folder: null,
		dev_server_command: null,
		dev_server_port: null,
		dev_server_pid: null,
		browser_url: null,
		labels: '[{"name":"auth","color":"#ef4444"},{"name":"security","color":"#f59e0b"}]',
		sort_order: 0,
		created_at: '2026-04-28T10:00:00Z',
	},
	{
		id: ISSUE_DARK_MODE,
		dashboard_id: DASHBOARD_GROVEKEEPER,
		name: 'Implement dark mode toggle',
		priority: 'medium',
		color: '#8b5cf6',
		status: 'active',
		github_issue_url: 'https://github.com/MartinoPolo/Grovekeeper/issues/55',
		github_issue_number: 55,
		branch_name: '55-dark-mode-toggle',
		base_branch: 'dev',
		worktree_folder: 'C:/_MP_projects/worktrees/55-dark-mode-toggle',
		worktree_state: 'active',
		parent_issue_id: null,
		editor_folder: null,
		dev_server_command: 'pnpm dev',
		dev_server_port: 1420,
		dev_server_pid: null,
		browser_url: 'http://localhost:1420',
		labels: '[{"name":"ui","color":"#8b5cf6"},{"name":"theme","color":"#6366f1"}]',
		sort_order: 1,
		created_at: '2026-04-29T14:30:00Z',
	},
	{
		id: ISSUE_PERF_AUDIT,
		dashboard_id: DASHBOARD_GROVEKEEPER,
		name: 'Performance audit: reduce bundle size',
		priority: 'low',
		color: '#f97316',
		status: 'active',
		github_issue_url: 'https://github.com/MartinoPolo/Grovekeeper/issues/63',
		github_issue_number: 63,
		branch_name: '63-perf-audit-bundle',
		base_branch: 'dev',
		worktree_folder: null,
		worktree_state: 'none',
		parent_issue_id: null,
		editor_folder: null,
		dev_server_command: null,
		dev_server_port: null,
		dev_server_pid: null,
		browser_url: null,
		labels: '[{"name":"performance","color":"#f97316"}]',
		sort_order: 2,
		created_at: '2026-04-30T09:15:00Z',
	},
	{
		id: ISSUE_CI_PIPELINE,
		dashboard_id: DASHBOARD_GROVEKEEPER,
		name: 'Fix CI pipeline timeout on E2E tests',
		priority: 'high',
		color: '#ef4444',
		status: 'active',
		github_issue_url: 'https://github.com/MartinoPolo/Grovekeeper/issues/71',
		github_issue_number: 71,
		branch_name: '71-ci-timeout-fix',
		base_branch: 'dev',
		worktree_folder: 'C:/_MP_projects/worktrees/71-ci-timeout-fix',
		worktree_state: 'active',
		parent_issue_id: null,
		editor_folder: null,
		dev_server_command: null,
		dev_server_port: null,
		dev_server_pid: null,
		browser_url: null,
		labels: '[{"name":"ci","color":"#06b6d4"},{"name":"testing","color":"#14b8a6"}]',
		sort_order: 3,
		created_at: '2026-05-01T08:00:00Z',
	},
	{
		id: ISSUE_ONBOARDING,
		dashboard_id: DASHBOARD_GROVEKEEPER,
		name: 'Add onboarding wizard for new users',
		priority: 'medium',
		color: '#10b981',
		status: 'active',
		github_issue_url: 'https://github.com/MartinoPolo/Grovekeeper/issues/78',
		github_issue_number: 78,
		branch_name: null,
		base_branch: 'dev',
		worktree_folder: null,
		worktree_state: 'none',
		parent_issue_id: null,
		editor_folder: null,
		dev_server_command: null,
		dev_server_port: null,
		dev_server_pid: null,
		browser_url: null,
		labels: '[{"name":"ui","color":"#8b5cf6"},{"name":"onboarding","color":"#10b981"}]',
		sort_order: 4,
		created_at: '2026-05-02T11:45:00Z',
	},
	{
		id: ISSUE_API_GATEWAY,
		dashboard_id: DASHBOARD_GROVEKEEPER,
		name: 'Build API gateway with rate limiting',
		priority: 'medium',
		color: '#8b5cf6',
		status: 'active',
		github_issue_url: 'https://github.com/MartinoPolo/Grovekeeper/issues/85',
		github_issue_number: 85,
		branch_name: '85-api-gateway',
		base_branch: 'dev',
		worktree_folder: null,
		worktree_state: 'none',
		parent_issue_id: null,
		editor_folder: null,
		dev_server_command: null,
		dev_server_port: null,
		dev_server_pid: null,
		browser_url: null,
		labels: '[{"name":"backend","color":"#8b5cf6"}]',
		sort_order: 5,
		created_at: '2026-05-03T10:00:00Z',
	},
	{
		id: ISSUE_INTEGRATION_TESTS,
		dashboard_id: DASHBOARD_GROVEKEEPER,
		name: 'Add integration test suite for API',
		priority: 'low',
		color: '#06b6d4',
		status: 'active',
		github_issue_url: 'https://github.com/MartinoPolo/Grovekeeper/issues/92',
		github_issue_number: 92,
		branch_name: null,
		base_branch: 'dev',
		worktree_folder: null,
		worktree_state: 'none',
		parent_issue_id: null,
		editor_folder: null,
		dev_server_command: null,
		dev_server_port: null,
		dev_server_pid: null,
		browser_url: null,
		labels: '[{"name":"testing","color":"#14b8a6"}]',
		sort_order: 6,
		created_at: '2026-05-04T14:00:00Z',
	},
	{
		id: ISSUE_ARCHIVED,
		dashboard_id: DASHBOARD_GROVEKEEPER,
		name: 'Migrate to Tailwind v4',
		priority: null,
		color: '#6b7280',
		status: 'archived',
		github_issue_url: 'https://github.com/MartinoPolo/Grovekeeper/issues/30',
		github_issue_number: 30,
		branch_name: '30-tailwind-v4-migration',
		base_branch: 'dev',
		worktree_folder: null,
		worktree_state: 'none',
		parent_issue_id: null,
		editor_folder: null,
		dev_server_command: null,
		dev_server_port: null,
		dev_server_pid: null,
		browser_url: null,
		labels: '[{"name":"refactor","color":"#6b7280"}]',
		sort_order: 5,
		created_at: '2026-04-15T16:00:00Z',
	},
];

// ─── Issue Dependencies ───────────────────────────────────────────────────────

export const MOCK_ISSUE_DEPENDENCIES: IssueDependency[] = [
	{
		id: 'mock-dep-1',
		blocker_issue_id: ISSUE_AUTH_MIDDLEWARE,
		blocked_issue_id: ISSUE_ONBOARDING,
	},
	{
		id: 'mock-dep-2',
		blocker_issue_id: ISSUE_AUTH_MIDDLEWARE,
		blocked_issue_id: ISSUE_API_GATEWAY,
	},
	{
		id: 'mock-dep-3',
		blocker_issue_id: ISSUE_API_GATEWAY,
		blocked_issue_id: ISSUE_INTEGRATION_TESTS,
	},
];

// ─── Sessions ─────────────────────────────────────────────────────────────────

export const MOCK_SESSIONS: Session[] = [
	{
		id: 'mock-session-running',
		issue_id: ISSUE_AUTH_MIDDLEWARE,
		provider: 'claude-code',
		state: 'running',
		pid: 12345,
		cli_session_id: 'ses_abc123',
		started_at: '2026-05-03T09:00:00Z',
		ended_at: null,
		cost_usd: 0.42,
		token_count: 15200,
		original_intent: 'Refactor the auth middleware to use OAuth2 tokens',
		last_prompt: 'Continue with the token refresh logic',
		last_response_summary: 'Implementing token refresh with exponential backoff...',
		execution_phase: 'tdd',
		source: 'spawned',
		working_directory: 'C:/_MP_projects/worktrees/42-refactor-auth-middleware',
	},
	{
		id: 'mock-session-needs-input',
		issue_id: ISSUE_DARK_MODE,
		provider: 'claude-code',
		state: 'needs-input',
		pid: 12346,
		cli_session_id: 'ses_def456',
		started_at: '2026-05-03T08:30:00Z',
		ended_at: null,
		cost_usd: 0.28,
		token_count: 9800,
		original_intent: 'Add dark mode toggle component',
		last_prompt: null,
		last_response_summary: 'Should the toggle persist preference to localStorage or DB?',
		execution_phase: 'analyzing',
		source: 'spawned',
		working_directory: 'C:/_MP_projects/worktrees/55-dark-mode-toggle',
	},
	{
		id: 'mock-session-finished',
		issue_id: ISSUE_CI_PIPELINE,
		provider: 'claude-code',
		state: 'finished',
		pid: null,
		cli_session_id: 'ses_ghi789',
		started_at: '2026-05-02T14:00:00Z',
		ended_at: '2026-05-02T14:45:00Z',
		cost_usd: 1.05,
		token_count: 42000,
		original_intent: 'Fix E2E test timeouts in CI',
		last_prompt: null,
		last_response_summary:
			'Increased Playwright timeout and added retry logic for flaky tests.',
		execution_phase: 'none',
		source: 'adopted',
		working_directory: 'C:/_MP_projects/worktrees/71-ci-timeout-fix',
	},
];

// ─── Actions ──────────────────────────────────────────────────────────────────

export const MOCK_ACTIONS: Action[] = [
	{
		id: 'mock-action-editor',
		dashboard_id: DASHBOARD_GROVEKEEPER,
		name: 'Open in VS Code',
		icon: 'code',
		command_template: 'code {{worktree_folder}}',
		sort_order: 0,
		visible: true,
	},
	{
		id: 'mock-action-tests',
		dashboard_id: DASHBOARD_GROVEKEEPER,
		name: 'Run Tests',
		icon: 'test-tube',
		command_template: 'cd {{worktree_folder}} && pnpm test',
		sort_order: 1,
		visible: true,
	},
	{
		id: 'mock-action-deploy',
		dashboard_id: DASHBOARD_GROVEKEEPER,
		name: 'Deploy Preview',
		icon: 'rocket',
		command_template: 'cd {{worktree_folder}} && pnpm deploy:preview',
		sort_order: 2,
		visible: true,
	},
];

// ─── Color Palettes ──────────────────────────────────────────────────────────

export const MOCK_COLOR_PALETTES: ColorPalette[] = [
	{
		id: PALETTE_VIVID,
		name: 'Vivid',
		colors: [
			'#ef4444',
			'#f97316',
			'#eab308',
			'#22c55e',
			'#10b981',
			'#06b6d4',
			'#3b82f6',
			'#8b5cf6',
		],
		is_built_in: true,
	},
	{
		id: 'palette-pastel',
		name: 'Pastel',
		colors: [
			'#fca5a5',
			'#fdba74',
			'#fde047',
			'#86efac',
			'#6ee7b7',
			'#67e8f9',
			'#93c5fd',
			'#c4b5fd',
		],
		is_built_in: true,
	},
];

// ─── Git Status Caches ───────────────────────────────────────────────────────

export const MOCK_GIT_STATUSES: GitStatusCache[] = [
	{
		issue_id: ISSUE_AUTH_MIDDLEWARE,
		branch_status: 'active',
		pr_state: 'open',
		pr_number: 101,
		pr_url: 'https://github.com/MartinoPolo/Grovekeeper/pull/101',
		github_issue_state: 'open',
		behind_base_count: 2,
		merge_conflict: false,
		has_local_changes: true,
		ahead_remote_count: 3,
		fetched_at: '2026-05-03T09:00:00Z',
	},
	{
		issue_id: ISSUE_DARK_MODE,
		branch_status: 'active',
		pr_state: 'draft',
		pr_number: 105,
		pr_url: 'https://github.com/MartinoPolo/Grovekeeper/pull/105',
		github_issue_state: 'open',
		behind_base_count: 0,
		merge_conflict: false,
		has_local_changes: false,
		ahead_remote_count: 0,
		fetched_at: '2026-05-03T08:30:00Z',
	},
	{
		issue_id: ISSUE_CI_PIPELINE,
		branch_status: 'active',
		pr_state: 'approved',
		pr_number: 110,
		pr_url: 'https://github.com/MartinoPolo/Grovekeeper/pull/110',
		github_issue_state: 'open',
		behind_base_count: 0,
		merge_conflict: false,
		has_local_changes: false,
		ahead_remote_count: 0,
		fetched_at: '2026-05-03T08:00:00Z',
	},
];

// ─── Label Shape Mappings ─────────────────────────────────────────────────────

export const MOCK_LABEL_SHAPE_MAPPINGS: LabelShapeMapping[] = [
	{
		id: 'mock-lsm-auth',
		dashboard_id: DASHBOARD_GROVEKEEPER,
		label_name: 'auth',
		tree_shape: 'oak',
		color: '#ef4444',
		priority_order: 0,
	},
	{
		id: 'mock-lsm-ui',
		dashboard_id: DASHBOARD_GROVEKEEPER,
		label_name: 'ui',
		tree_shape: 'birch',
		color: '#8b5cf6',
		priority_order: 1,
	},
	{
		id: 'mock-lsm-perf',
		dashboard_id: DASHBOARD_GROVEKEEPER,
		label_name: 'performance',
		tree_shape: 'willow',
		color: '#f97316',
		priority_order: 2,
	},
];

// ─── Notification Configs ─────────────────────────────────────────────────────

export const MOCK_NOTIFICATION_CONFIGS: NotificationConfig[] = [
	{
		event_type: 'needs-input',
		sound_enabled: true,
		sound_file: null,
		toast_enabled: true,
		window_flash_enabled: true,
	},
	{
		event_type: 'needs-review',
		sound_enabled: true,
		sound_file: null,
		toast_enabled: true,
		window_flash_enabled: false,
	},
	{
		event_type: 'finished',
		sound_enabled: true,
		sound_file: null,
		toast_enabled: true,
		window_flash_enabled: false,
	},
	{
		event_type: 'errored',
		sound_enabled: true,
		sound_file: null,
		toast_enabled: true,
		window_flash_enabled: true,
	},
	{
		event_type: 'pr-ready',
		sound_enabled: false,
		sound_file: null,
		toast_enabled: true,
		window_flash_enabled: false,
	},
];

// ─── Assigned Issues ──────────────────────────────────────────────────────────

const MOCK_ASSIGNED_ISSUES: AssignedIssue[] = [
	{
		number: 42,
		title: 'Refactor auth middleware for OAuth2',
		state: 'open',
		url: 'https://github.com/MartinoPolo/Grovekeeper/issues/42',
		labels: [{ name: 'auth', color: 'ef4444' }],
	},
	{
		number: 55,
		title: 'Implement dark mode toggle',
		state: 'open',
		url: 'https://github.com/MartinoPolo/Grovekeeper/issues/55',
		labels: [
			{ name: 'ui', color: '8b5cf6' },
			{ name: 'theme', color: '6366f1' },
		],
	},
	{
		number: 78,
		title: 'Add onboarding wizard for new users',
		state: 'open',
		url: 'https://github.com/MartinoPolo/Grovekeeper/issues/78',
		labels: [{ name: 'ui', color: '8b5cf6' }],
	},
];

export const MOCK_ASSIGNED_ISSUES_RESULT: AssignedIssuesResult = {
	issues: MOCK_ASSIGNED_ISSUES,
	has_more: false,
};

// ─── Overview Data ────────────────────────────────────────────────────────────

export const MOCK_OVERVIEW_DATA: OverviewWorkspaceData[] = [
	{
		dashboard_id: DASHBOARD_GROVEKEEPER,
		name: 'Grovekeeper',
		github_repo: 'MartinoPolo/Grovekeeper',
		local_folder: 'C:/_MP_projects/Grovekeeper',
		color_palette_id: PALETTE_VIVID,
		open_issue_count: 5,
		active_session_count: 2,
		last_activity: '2026-05-03T09:05:00Z',
		total_cost_usd: 1.75,
	},
];

// ─── Window Bindings ──────────────────────────────────────────────────────────

export const MOCK_WINDOW_BINDINGS: WindowWorkspaceBinding[] = [];

// ─── Keyboard Shortcuts ───────────────────────────────────────────────────────

export const MOCK_CUSTOM_BINDINGS: KeyboardShortcut[] = [];

// ─── Prunable Issues ──────────────────────────────────────────────────────────

export const MOCK_PRUNABLE_ISSUES: PrunableIssue[] = [];

// ─── Sync Result ──────────────────────────────────────────────────────────────

export const MOCK_SYNC_RESULT: SyncAllResult = { synced_count: 3, errors: [] };
