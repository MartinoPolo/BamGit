<script lang="ts">
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import * as Alert from '$lib/components/ui/alert/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import TriangleAlertIcon from '@lucide/svelte/icons/triangle-alert';
	import { openPath } from '@tauri-apps/plugin-opener';
	import { invoke } from '$lib/tauri.js';
	import { useAiConfig } from '../ai_config.context.svelte.js';
	import { makeMcpKey, getParentDir, type ItemKind } from '../ai_config.helpers.js';
	import type { SymlinkInfo, HookConfig, McpServerConfig } from '$lib/types/generated';

	// ─── Context ─────────────────────────────────────────────────────────────

	const aiConfig = useAiConfig();

	// ─── State ────────────────────────────────────────────────────────────────

	let isDeleting = $state(false);
	let symlinkInfo = $state<SymlinkInfo | null>(null);

	// ─── Derived ─────────────────────────────────────────────────────────────

	const isOpen = $derived(aiConfig.deletingItemPath !== null);

	const deletingPath = $derived(aiConfig.deletingItemPath);

	// fallow-ignore-next-line complexity
	const deletingItem = $derived.by(() => {
		const path = deletingPath;
		const result = aiConfig.discoveryResult;
		if (path === null || result === null) {
			return null;
		}
		return (
			result.skills.find((s) => s.file_path === path) ??
			result.agents.find((a) => a.file_path === path) ??
			result.memories.find((m) => m.file_path === path) ??
			result.instructions.find((i) => i.file_path === path) ??
			result.rules.find((r) => r.file_path === path) ??
			result.hooks.find((h) => h.file_path === path) ??
			result.mcp_servers.find((s) => makeMcpKey(s) === path) ??
			null
		);
	});

	// fallow-ignore-next-line complexity
	const kind = $derived.by((): ItemKind | null => {
		const path = deletingPath;
		const result = aiConfig.discoveryResult;
		if (path === null || result === null) {
			return null;
		}
		if (result.skills.some((s) => s.file_path === path)) {
			return 'skill';
		}
		if (result.agents.some((a) => a.file_path === path)) {
			return 'agent';
		}
		if (result.memories.some((m) => m.file_path === path)) {
			return 'memory';
		}
		if (result.instructions.some((i) => i.file_path === path)) {
			return 'instruction';
		}
		if (result.rules.some((r) => r.file_path === path)) {
			return 'rule';
		}
		if (result.hooks.some((h) => h.file_path === path)) {
			return 'hook';
		}
		if (result.mcp_servers.some((s) => makeMcpKey(s) === path)) {
			return 'mcp';
		}
		return null;
	});

	const itemName = $derived.by((): string => {
		const item = deletingItem;
		if (item === null) {
			return '';
		}
		if ('filename' in item) {
			return item.filename;
		}
		return (item as { name: string }).name;
	});

	const sourceLabel = $derived.by((): string => {
		const item = deletingItem;
		if (item === null) {
			return '';
		}
		const source = (item as { source?: string }).source;
		if (source === 'user') {
			return 'User config';
		}
		if (source === 'project') {
			return 'Project config';
		}
		if (source === 'custom') {
			return 'Custom config';
		}
		return '';
	});

	const isUserLevel = $derived.by((): boolean => {
		const item = deletingItem;
		if (item === null) {
			return false;
		}
		return (item as { source?: string }).source === 'user';
	});

	const content = $derived.by((): string | null => {
		const item = deletingItem;
		if (item === null || !('content' in item)) {
			return null;
		}
		return item.content as string;
	});

	// fallow-ignore-next-line complexity
	const kindLabel = $derived.by((): string => {
		switch (kind) {
			case 'skill':
				return 'Skill';
			case 'agent':
				return 'Agent';
			case 'memory':
				return 'Memory';
			case 'instruction':
				return 'Instruction';
			case 'rule':
				return 'Rule';
			case 'hook':
				return 'Hook';
			case 'mcp':
				return 'MCP Server';
			default:
				return 'Item';
		}
	});

	const canDelete = $derived(
		kind === 'skill' ||
			kind === 'agent' ||
			kind === 'memory' ||
			kind === 'rule' ||
			kind === 'hook' ||
			kind === 'mcp',
	);

	const disabledReason = $derived.by((): string | null => {
		if (kind === 'instruction') {
			return 'Instructions cannot be deleted from this view.';
		}
		return null;
	});

	const parentDir = $derived(getParentDir(deletingPath));

	// ─── Hook settings path heuristic ────────────────────────────────────────

	function resolveHookSettingsPath(): string {
		const item = deletingItem as HookConfig | null;
		if (item === null) {
			return '';
		}
		if (item.source === 'project') {
			const workspaceRoot = aiConfig.workspaceRoot ?? '';
			return `${workspaceRoot}/.claude/settings.json`.replace(/\\/g, '/');
		}
		// User source — prefer settings.local.json (most common)
		const userProvider = aiConfig.installedProviders.find((p) => p.kind === aiConfig.provider);
		const userDir = userProvider?.user_dir ?? '';
		return `${userDir}/settings.local.json`.replace(/\\/g, '/');
	}

	// ─── MCP delete kind + path heuristic ────────────────────────────────────

	// fallow-ignore-next-line complexity
	function resolveMcpDeleteArgs(): { filePath: string; kind: string } {
		const item = deletingItem as McpServerConfig | null;
		if (item === null) {
			return { filePath: '', kind: 'mcp-servers' };
		}

		const workspaceRoot = aiConfig.workspaceRoot ?? '';
		const userProvider = aiConfig.installedProviders.find((p) => p.kind === aiConfig.provider);
		const userDir = userProvider?.user_dir ?? '';

		let deleteKind: string;
		let filePath: string;

		if (item.transport_type === 'cloud') {
			deleteKind = 'enabled-plugins';
		} else if (aiConfig.provider === 'claude-code' && item.source === 'project') {
			deleteKind = 'mcp-json-file';
		} else {
			deleteKind = 'mcp-servers';
		}

		if (deleteKind === 'mcp-json-file') {
			filePath = `${workspaceRoot}/.mcp.json`.replace(/\\/g, '/');
		} else if (item.source === 'project') {
			filePath = `${workspaceRoot}/.claude/settings.json`.replace(/\\/g, '/');
		} else {
			filePath = `${userDir}/settings.json`.replace(/\\/g, '/');
		}

		return { filePath, kind: deleteKind };
	}

	// ─── Effects ─────────────────────────────────────────────────────────────

	$effect(() => {
		const path = deletingPath;
		if (path !== null && !path.startsWith('mcp://')) {
			symlinkInfo = null;
			void invoke<SymlinkInfo>('inspect_symlink', { path })
				.then((info) => {
					symlinkInfo = info;
				})
				.catch(() => {
					symlinkInfo = null;
				});
		} else {
			symlinkInfo = null;
		}
	});

	// ─── Functions ───────────────────────────────────────────────────────────

	async function handleDelete(): Promise<void> {
		const path = deletingPath;
		if (path === null || !canDelete) {
			return;
		}
		isDeleting = true;
		try {
			if (kind === 'hook') {
				const hookItem = deletingItem as HookConfig;
				const settingsPath = resolveHookSettingsPath();
				await aiConfig.deleteHook(
					settingsPath,
					hookItem.event_type,
					hookItem.matcher ?? '',
					hookItem.command,
				);
			} else if (kind === 'mcp') {
				const mcpItem = deletingItem as McpServerConfig;
				const { filePath, kind: mcpKind } = resolveMcpDeleteArgs();
				await aiConfig.deleteMcp(filePath, mcpKind, mcpItem.name);
			} else {
				await aiConfig.deleteFile(path);
			}
			aiConfig.deletingItemPath = null;
		} finally {
			isDeleting = false;
		}
	}

	async function handleOpenFolder(): Promise<void> {
		const dir = parentDir;
		if (dir === null) {
			return;
		}
		try {
			await openPath(dir);
		} catch {
			// Silently fail
		}
	}
</script>

<Dialog.Root
	open={isOpen}
	onOpenChange={(open) => {
		if (open === false) {
			aiConfig.deletingItemPath = null;
		}
	}}
>
	<Dialog.Content class="max-w-lg">
		{#if deletingItem !== null && kind !== null}
			<Dialog.Header>
				<Dialog.Title>Delete {itemName}?</Dialog.Title>
				<Dialog.Description>
					{kindLabel} from {sourceLabel}
				</Dialog.Description>
			</Dialog.Header>

			<Dialog.Body class="flex flex-col gap-3">
				{#if deletingPath !== null && !deletingPath.startsWith('mcp://')}
					<button
						type="button"
						class="break-all text-left font-mono text-xs text-foreground-muted hover:text-foreground hover:underline"
						onclick={handleOpenFolder}
					>
						{deletingPath}
					</button>
				{/if}

				{#if content !== null}
					<pre
						class="max-h-[300px] overflow-y-auto whitespace-pre-wrap rounded-md bg-surface-2 p-2 font-mono text-xs">{content}</pre>
				{/if}

				<p class="text-sm text-foreground-muted">This action cannot be undone.</p>

				{#if isUserLevel}
					<Alert.Root>
						<TriangleAlertIcon />
						<Alert.Title>Global configuration</Alert.Title>
						<Alert.Description>
							This will modify your global configuration and affect all projects.
						</Alert.Description>
					</Alert.Root>
				{/if}

				{#if symlinkInfo?.is_symlink === true && symlinkInfo.resolved_path !== null}
					<Alert.Root>
						<TriangleAlertIcon />
						<Alert.Title>Symlink target</Alert.Title>
						<Alert.Description>
							This will delete the symlink target file at {symlinkInfo.resolved_path}.
						</Alert.Description>
					</Alert.Root>
				{/if}
			</Dialog.Body>

			<Dialog.Footer>
				<Button
					variant="ghost"
					onclick={() => {
						aiConfig.deletingItemPath = null;
					}}
				>
					Cancel
				</Button>

				{#if canDelete}
					<Button variant="danger" disabled={isDeleting} onclick={handleDelete}>
						{isDeleting ? 'Deleting…' : 'Delete'}
					</Button>
				{:else}
					<Button variant="danger" disabled title={disabledReason ?? ''}>Delete</Button>
				{/if}
			</Dialog.Footer>
		{/if}
	</Dialog.Content>
</Dialog.Root>
