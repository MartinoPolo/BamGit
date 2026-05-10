import type { ProviderKind } from '$lib/types/generated';

// ─── Types ───────────────────────────────────────────────────────────────────

type SettingControl =
	| { type: 'toggle' }
	| { type: 'text' }
	| { type: 'number'; min?: number; max?: number; step?: number }
	| { type: 'slider'; min: number; max: number; step?: number; suffix?: string }
	| { type: 'select'; options: { label: string; value: string }[] }
	| { type: 'segmented'; options: { label: string; value: string }[] };

export interface SettingDefinition {
	key: string;
	label: string;
	description: string;
	control: SettingControl;
	default?: unknown;
}

// ─── Claude Code settings (REQ-56) ──────────────────────────────────────────

const CLAUDE_CODE_SETTINGS: SettingDefinition[] = [
	{
		key: 'model',
		label: 'Model',
		description: 'The Claude model used for inference.',
		control: {
			type: 'select',
			options: [
				{ label: 'claude-opus-4-5', value: 'claude-opus-4-5' },
				{ label: 'claude-sonnet-4-5', value: 'claude-sonnet-4-5' },
				{ label: 'claude-haiku-4-5', value: 'claude-haiku-4-5' },
				{ label: 'claude-opus-4', value: 'claude-opus-4' },
				{ label: 'claude-sonnet-4', value: 'claude-sonnet-4' },
				{ label: 'claude-3-7-sonnet-20250219', value: 'claude-3-7-sonnet-20250219' },
				{ label: 'claude-3-5-sonnet-20241022', value: 'claude-3-5-sonnet-20241022' },
				{ label: 'claude-3-5-haiku-20241022', value: 'claude-3-5-haiku-20241022' },
			],
		},
	},
	{
		key: 'permissions.defaultMode',
		label: 'Default permission mode',
		description: 'Controls how tool-use permissions are handled by default.',
		control: {
			type: 'select',
			options: [
				{ label: 'Allowed', value: 'allowed' },
				{ label: 'Plan', value: 'plan' },
				{ label: 'Denied', value: 'denied' },
			],
		},
		default: 'allowed',
	},
	{
		key: 'env.ENABLE_TOOL_SEARCH',
		label: 'Tool search',
		description: 'Controls whether the agent searches for available tools before invoking.',
		control: {
			type: 'select',
			options: [
				{ label: 'Disabled', value: 'disabled' },
				{ label: 'Auto', value: 'auto' },
				{ label: 'Auto (5 tools)', value: 'auto:5' },
				{ label: 'Auto (15 tools)', value: 'auto:15' },
				{ label: 'Auto (20 tools)', value: 'auto:20' },
			],
		},
		default: 'disabled',
	},
	{
		key: 'env.CLAUDE_AUTOCOMPACT_PCT_OVERRIDE',
		label: 'Auto-compact threshold',
		description: 'Context window percentage at which auto-compact is triggered.',
		control: { type: 'slider', min: 50, max: 99, step: 1, suffix: '%' },
	},
	{
		key: 'autoCompactWindow',
		label: 'Auto-compact window',
		description: 'Number of recent messages to keep when auto-compacting context.',
		control: { type: 'number', min: 1, step: 1 },
	},
	{
		key: 'autoMemoryEnabled',
		label: 'Auto memory',
		description: 'Automatically persist important information to memory files.',
		control: { type: 'toggle' },
		default: true,
	},
	{
		key: 'includeGitInstructions',
		label: 'Include git instructions',
		description: 'Prepend git workflow instructions to the system prompt.',
		control: { type: 'toggle' },
		default: true,
	},
	{
		key: 'fileCheckpointingEnabled',
		label: 'File checkpointing',
		description: 'Save file snapshots before edits so they can be reverted.',
		control: { type: 'toggle' },
		default: true,
	},
	{
		key: 'disableAllHooks',
		label: 'Disable all hooks',
		description: 'Globally disable lifecycle hook execution.',
		control: { type: 'toggle' },
		default: false,
	},
	{
		key: 'enableAllProjectMcpServers',
		label: 'Enable all project MCP servers',
		description: 'Automatically enable every MCP server discovered in the project.',
		control: { type: 'toggle' },
		default: false,
	},
	{
		key: 'sandbox.enabled',
		label: 'Sandbox',
		description: 'Run tool calls in an isolated sandbox environment.',
		control: { type: 'toggle' },
		default: false,
	},
	{
		key: 'alwaysThinkingEnabled',
		label: 'Always thinking',
		description: 'Force extended thinking on every response.',
		control: { type: 'toggle' },
		default: false,
	},
	{
		key: 'viewMode',
		label: 'View mode',
		description: 'Default UI layout for the Claude Code workspace.',
		control: {
			type: 'select',
			options: [
				{ label: 'Auto', value: 'auto' },
				{ label: 'Side-by-side', value: 'side-by-side' },
				{ label: 'Full', value: 'full' },
			],
		},
	},
	{
		key: 'editorMode',
		label: 'Editor mode',
		description: 'Controls the keybinding mode for the built-in editor.',
		control: {
			type: 'select',
			options: [
				{ label: 'Default', value: 'default' },
				{ label: 'Vim', value: 'vim' },
				{ label: 'Emacs', value: 'emacs' },
			],
		},
	},
	{
		key: 'attribution.commit',
		label: 'Commit attribution',
		description: 'Template string added to git commit messages to attribute AI assistance.',
		control: { type: 'text' },
	},
	{
		key: 'effortLevel',
		label: 'Effort level',
		description: 'Controls how much compute budget is spent per request.',
		control: {
			type: 'segmented',
			options: [
				{ label: 'Low', value: 'low' },
				{ label: 'Medium', value: 'medium' },
				{ label: 'High', value: 'high' },
				{ label: 'XHigh', value: 'xhigh' },
			],
		},
		default: 'medium',
	},
	{
		key: 'showThinkingSummaries',
		label: 'Show thinking summaries',
		description: 'Show condensed thinking blocks in the message stream.',
		control: { type: 'toggle' },
	},
];

// ─── OpenCode settings (REQ-57) ──────────────────────────────────────────────

const OPEN_CODE_SETTINGS: SettingDefinition[] = [
	{
		key: 'model',
		label: 'Model',
		description: 'The AI model used for inference (e.g. "anthropic/claude-opus-4").',
		control: { type: 'text' },
	},
	{
		key: 'small_model',
		label: 'Small model',
		description:
			'A faster, cheaper model used for lightweight tasks like summarization and routing.',
		control: { type: 'text' },
	},
	{
		key: 'default_agent',
		label: 'Default agent',
		description: 'Name of the agent profile to use when no explicit agent is specified.',
		control: { type: 'text' },
	},
	{
		key: 'compaction.auto',
		label: 'Auto-compact',
		description: "Auto-compact context when approaching the model's window.",
		control: { type: 'toggle' },
		default: true,
	},
	{
		key: 'compaction.prune',
		label: 'Prune on compact',
		description: 'Prune older messages during auto-compaction to free more space.',
		control: { type: 'toggle' },
		default: true,
	},
	{
		key: 'snapshot',
		label: 'Session snapshots',
		description: 'Take session snapshots so you can undo and replay steps.',
		control: { type: 'toggle' },
	},
	{
		key: 'share',
		label: 'Share sessions',
		description: 'Allow sharing sessions to opencode.ai for review and collaboration.',
		control: { type: 'toggle' },
	},
	{
		key: 'autoupdate',
		label: 'Auto-update',
		description: 'Automatically update OpenCode CLI to the latest version.',
		control: { type: 'toggle' },
	},
];

// ─── Codex settings (REQ-58) ─────────────────────────────────────────────────

const CODEX_SETTINGS: SettingDefinition[] = [
	{
		key: 'model',
		label: 'Model',
		description: 'The model used for inference (e.g. "o4-mini", "o3").',
		control: { type: 'text' },
	},
	{
		key: 'model_reasoning_effort',
		label: 'Reasoning effort',
		description: 'Controls the reasoning compute budget for o-series models.',
		control: {
			type: 'segmented',
			options: [
				{ label: 'Low', value: 'low' },
				{ label: 'Medium', value: 'medium' },
				{ label: 'High', value: 'high' },
				{ label: 'XHigh', value: 'xhigh' },
			],
		},
		default: 'medium',
	},
	{
		key: 'model_verbosity',
		label: 'Verbosity',
		description: 'Controls how much detail the model includes in its responses.',
		control: {
			type: 'segmented',
			options: [
				{ label: 'Low', value: 'low' },
				{ label: 'Medium', value: 'medium' },
				{ label: 'High', value: 'high' },
			],
		},
		default: 'medium',
	},
	{
		key: 'approval_policy',
		label: 'Approval policy',
		description: 'Controls when the agent pauses to request user approval.',
		control: {
			type: 'select',
			options: [
				{ label: 'Auto', value: 'auto' },
				{ label: 'On request', value: 'on-request' },
				{ label: 'Never', value: 'never' },
			],
		},
	},
	{
		key: 'sandbox_mode',
		label: 'Sandbox mode',
		description: 'Execution sandbox applied to shell commands run by the agent.',
		control: {
			type: 'select',
			options: [
				{ label: 'Read-only', value: 'read-only' },
				{ label: 'Write allowed', value: 'write-allowed' },
				{ label: 'Network allowed', value: 'network-allowed' },
				{ label: 'Unrestricted', value: 'unrestricted' },
			],
		},
	},
	{
		key: 'web_search',
		label: 'Web search',
		description: 'Allow the agent to perform live web searches during tasks.',
		control: { type: 'toggle' },
	},
	{
		key: 'personality',
		label: 'Personality',
		description: 'Optional persona prompt injected into the system prompt.',
		control: { type: 'text' },
	},
	{
		key: 'shell_snapshot',
		label: 'Shell snapshot',
		description: 'Snapshot the shell environment before each command for safer rollback.',
		control: { type: 'toggle' },
	},
	{
		key: 'memories',
		label: 'Memories',
		description: 'Enable persistent memory files that survive across sessions.',
		control: { type: 'toggle' },
	},
	{
		key: 'multi_agent',
		label: 'Multi-agent',
		description: 'Allow spawning sub-agents to tackle tasks in parallel.',
		control: { type: 'toggle' },
	},
	{
		key: 'undo',
		label: 'Undo support',
		description: 'Enable undo for file edits made by the agent.',
		control: { type: 'toggle' },
	},
	{
		key: 'fast_mode',
		label: 'Fast mode',
		description: 'Use a faster, lower-latency model tier when available.',
		control: { type: 'toggle' },
	},
];

// ─── Cursor settings (REQ-59) ────────────────────────────────────────────────

const CURSOR_SETTINGS: SettingDefinition[] = [
	{
		key: 'attribution.attributeCommitsToAgent',
		label: 'Attribute commits to agent',
		description: 'Add an attribution trailer to git commits authored by the AI agent.',
		control: { type: 'toggle' },
	},
	{
		key: 'attribution.attributePRsToAgent',
		label: 'Attribute PRs to agent',
		description: 'Mark pull requests as AI-authored when opened by the agent.',
		control: { type: 'toggle' },
	},
	{
		key: 'network.useHttp1ForAgent',
		label: 'Use HTTP/1 for agent',
		description: 'Force HTTP/1.1 for agent network requests (helps with some proxies).',
		control: { type: 'toggle' },
	},
	{
		key: 'mcp.allowlist',
		label: 'MCP allowlist',
		description: 'Comma-separated list of MCP server names the agent is permitted to use.',
		control: { type: 'text' },
	},
	{
		key: 'terminal.allowlist',
		label: 'Terminal allowlist',
		description: 'Comma-separated list of terminal commands the agent is permitted to run.',
		control: { type: 'text' },
	},
];

// ─── Export ──────────────────────────────────────────────────────────────────

export const SETTINGS_BY_PROVIDER: Record<ProviderKind, SettingDefinition[]> = {
	'claude-code': CLAUDE_CODE_SETTINGS,
	'open-code': OPEN_CODE_SETTINGS,
	codex: CODEX_SETTINGS,
	cursor: CURSOR_SETTINGS,
};
