<script lang="ts">
	import * as Dialog from '$lib/components/shadcn/dialog/index.js';
	import { Badge } from '$lib/components/shadcn/badge/index.js';
	import { Button } from '$lib/components/shadcn/button/index.js';
	import FileTextIcon from '@lucide/svelte/icons/file-text';
	import FolderOpenIcon from '@lucide/svelte/icons/folder-open';
	import { openPath } from '@tauri-apps/plugin-opener';
	import { useAiConfig } from '../ai_config.context.svelte.js';
	import {
		deriveLanguage,
		findKindByPath,
		getParentDir,
		type ItemKind,
	} from '../ai_config.helpers.js';
	import SkillOverrideControl from './SkillOverrideControl.svelte';
	import type {
		SkillConfig,
		AgentConfig,
		HookConfig,
		McpServerConfig,
		MemoryConfig,
		RuleConfig,
		CustomDiscoveryPath,
	} from '$lib/types/generated';

	// ─── Context ─────────────────────────────────────────────────────────────

	const aiConfig = useAiConfig();

	// ─── Derived ─────────────────────────────────────────────────────────────

	const isOpen = $derived(aiConfig.selectedItemPath !== null);

	const kind = $derived.by((): ItemKind | null => {
		const direct = findKindByPath(aiConfig.discoveryResult, aiConfig.selectedItemPath);
		if (direct !== null) {
			return direct;
		}
		if (aiConfig.selectedItem !== null && 'transport_type' in aiConfig.selectedItem) {
			return 'mcp';
		}
		return null;
	});

	const item = $derived(aiConfig.selectedItem);

	const title = $derived.by((): string => {
		if (item === null) {
			return '';
		}
		if ('filename' in item) {
			return item.filename;
		}
		return (item as SkillConfig | AgentConfig | McpServerConfig | MemoryConfig).name;
	});

	const filePath = $derived.by((): string | null => {
		if (item === null || kind === 'mcp') {
			return null;
		}
		return (item as Exclude<typeof item, McpServerConfig>)?.file_path ?? null;
	});

	const parentDir = $derived(getParentDir(filePath));

	const sourceLabel = $derived.by((): string => {
		if (item === null || kind === 'memory') {
			return '';
		}
		const source = (item as Exclude<typeof item, MemoryConfig>).source;
		if (source === 'custom') {
			const matchingPath = aiConfig.customPaths.find(
				(p: CustomDiscoveryPath) => filePath !== null && filePath.startsWith(p.path),
			);
			return matchingPath !== undefined ? `Custom (${matchingPath.label})` : 'Custom';
		}
		return source === 'user' ? 'User' : 'Project';
	});

	const sourceTone = $derived.by(() => {
		if (item === null || kind === 'memory') {
			return 'neutral' as const;
		}
		const source = (item as Exclude<typeof item, MemoryConfig>).source;
		if (source === 'user') {
			return 'info' as const;
		}
		if (source === 'project') {
			return 'success' as const;
		}
		return 'accent' as const;
	});

	const content = $derived.by((): string | null => {
		if (item === null || !('content' in item)) {
			return null;
		}
		return item.content as string;
	});

	const isEditable = $derived(
		kind === 'skill' ||
			kind === 'agent' ||
			kind === 'memory' ||
			kind === 'instruction' ||
			kind === 'rule',
	);

	// ─── Functions ───────────────────────────────────────────────────────────

	async function handleOpenFile(): Promise<void> {
		if (filePath === null) {
			return;
		}
		try {
			await openPath(filePath);
		} catch {
			// Silently fail
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

	function handleEdit(): void {
		if (filePath !== null) {
			aiConfig.editingItemPath = filePath;
		}
	}

	function handleDelete(): void {
		if (filePath !== null) {
			aiConfig.deletingItemPath = filePath;
		}
	}
</script>

<Dialog.Root
	open={isOpen}
	onOpenChange={(open) => {
		if (open === false) {
			aiConfig.selectedItemPath = null;
		}
	}}
>
	<Dialog.Content class="flex h-[80vh] max-w-2xl flex-col overflow-hidden p-0">
		{#if item !== null && kind !== null}
			<Dialog.Header class="shrink-0">
				<div class="flex flex-col gap-1.5">
					<Dialog.Title>{title}</Dialog.Title>
					<div class="flex flex-wrap items-center gap-1">
						{#if kind !== 'memory'}
							<Badge tone={sourceTone} size="compact">{sourceLabel}</Badge>
						{/if}

						{#if kind === 'skill'}
							{@const skillItem = item as SkillConfig}
							{#if skillItem.category}
								<Badge tone="neutral" size="compact">{skillItem.category}</Badge>
							{/if}
							{#if skillItem.deprecated}
								<Badge tone="warning" size="compact">Deprecated</Badge>
							{/if}
						{:else if kind === 'agent'}
							{@const agentItem = item as AgentConfig}
							{#if agentItem.model}
								<Badge format="mono" size="compact">{agentItem.model}</Badge>
							{/if}
							{#if agentItem.deprecated}
								<Badge tone="warning" size="compact">Deprecated</Badge>
							{/if}
						{:else if kind === 'hook'}
							{@const hookItem = item as HookConfig}
							<Badge tone="neutral" size="compact">{hookItem.event_type}</Badge>
							{#if hookItem.matcher}
								<Badge tone="neutral" size="compact">{hookItem.matcher}</Badge>
							{/if}
						{:else if kind === 'mcp'}
							{@const mcpItem = item as McpServerConfig}
							<Badge tone={mcpItem.enabled ? 'success' : 'danger'} size="compact">
								{mcpItem.enabled ? 'Enabled' : 'Disabled'}
							</Badge>
							<Badge format="mono" size="compact">{mcpItem.transport_type}</Badge>
						{:else if kind === 'memory'}
							{@const memItem = item as MemoryConfig}
							{#if memItem.memory_type}
								<Badge tone="neutral" size="compact">{memItem.memory_type}</Badge>
							{/if}
						{:else if kind === 'rule'}
							{@const ruleItem = item as RuleConfig}
							{@const lang =
								ruleItem.language ??
								(ruleItem.filename ? deriveLanguage(ruleItem.filename) : null)}
							{#if lang}
								<Badge tone="neutral" size="compact">{lang}</Badge>
							{/if}
						{/if}
					</div>
				</div>
			</Dialog.Header>

			<Dialog.Body class="flex flex-1 flex-col gap-4 overflow-y-auto">
				<!-- Skill override control -->
				{#if kind === 'skill'}
					{@const skillItem = item as SkillConfig}
					<SkillOverrideControl
						skillName={skillItem.name}
						currentValue={skillItem.skill_override ?? null}
						workspaceRoot={aiConfig.workspaceRoot}
						variant="full"
					/>
				{/if}

				<!-- MCP server details -->
				{#if kind === 'mcp'}
					{@const mcpItem = item as McpServerConfig}
					<div class="flex flex-col gap-2">
						<span
							class="text-xs font-semibold uppercase tracking-wide text-foreground-muted"
						>
							Server details
						</span>
						<div class="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm">
							<span class="text-foreground-muted">Provider</span>
							<span class="font-mono">{mcpItem.provider_name}</span>
							{#if mcpItem.command}
								<span class="text-foreground-muted">Command</span>
								<span class="font-mono">{mcpItem.command}</span>
							{/if}
							{#if mcpItem.url}
								<span class="text-foreground-muted">URL</span>
								<span class="font-mono">{mcpItem.url}</span>
							{/if}
							{#if mcpItem.args && mcpItem.args.length > 0}
								<span class="text-foreground-muted">Args</span>
								<span class="font-mono">{mcpItem.args.join(' ')}</span>
							{/if}
							{#if mcpItem.env_var_names && mcpItem.env_var_names.length > 0}
								<span class="text-foreground-muted">Env vars</span>
								<span class="font-mono">{mcpItem.env_var_names.join(', ')}</span>
							{/if}
						</div>
					</div>
				{/if}

				<!-- Content preview -->
				{#if content !== null}
					<pre
						class="whitespace-pre-wrap rounded-md bg-surface-2 p-3 font-mono text-xs leading-relaxed">{content}</pre>
				{/if}
			</Dialog.Body>

			<Dialog.Footer class="shrink-0 justify-between">
				<div class="flex gap-1">
					{#if filePath !== null}
						<Button intent="ghost" size="sm" onclick={handleOpenFile}>
							<FileTextIcon class="size-3.5" />
							Open file
						</Button>
					{/if}
					{#if parentDir !== null}
						<Button intent="ghost" size="sm" onclick={handleOpenFolder}>
							<FolderOpenIcon class="size-3.5" />
							Open folder
						</Button>
					{/if}
				</div>

				<div class="flex gap-2">
					{#if filePath !== null}
						<Button intent="ghost" size="sm" onclick={handleOpenFile}>
							Open in Editor
						</Button>
					{/if}
					{#if isEditable}
						<Button intent="primary" size="sm" onclick={handleEdit}>Edit</Button>
					{/if}
					{#if kind !== 'hook' && kind !== 'mcp' && kind !== 'instruction'}
						<Button intent="danger" size="sm" onclick={handleDelete}>Delete</Button>
					{/if}
				</div>
			</Dialog.Footer>
		{/if}
	</Dialog.Content>
</Dialog.Root>
