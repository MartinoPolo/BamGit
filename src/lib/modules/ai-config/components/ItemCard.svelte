<script lang="ts">
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import FileTextIcon from '@lucide/svelte/icons/file-text';
	import FolderOpenIcon from '@lucide/svelte/icons/folder-open';
	import { openPath } from '@tauri-apps/plugin-opener';
	import type {
		SkillConfig,
		AgentConfig,
		HookConfig,
		McpServerConfig,
		MemoryConfig,
		RuleConfig,
		CustomDiscoveryPath,
	} from '$lib/types/generated';
	import {
		deriveLanguage,
		getParentDir,
		getItemTitle,
		getItemDescription,
		getItemFilePath,
		getItemLineCount,
		getItemFileSizeLabel,
		type AnyItem,
		type ItemKind,
	} from '../ai_config.helpers.js';
	import SkillOverrideControl from './SkillOverrideControl.svelte';
	import { cn } from '$lib/utils.js';
	import { useAiConfig } from '../ai_config.context.svelte.js';

	// ─── Types ───────────────────────────────────────────────────────────────

	interface Props {
		item: AnyItem;
		kind: ItemKind;
		onSelect: () => void;
	}

	// ─── Props ───────────────────────────────────────────────────────────────

	let { item, kind, onSelect }: Props = $props();

	// ─── Context ─────────────────────────────────────────────────────────────

	const aiConfig = useAiConfig();

	// ─── Derived ─────────────────────────────────────────────────────────────

	const title = $derived(getItemTitle(item, kind));

	const description = $derived(getItemDescription(item, kind));

	const filePath = $derived(getItemFilePath(item, kind));

	const parentDir = $derived(getParentDir(filePath));

	const isDeprecated = $derived(item.deprecated);

	const sourceLabel = $derived.by((): string => {
		const source = (item as { source?: string }).source;
		if (source === 'custom') {
			const matchingPath = aiConfig.customPaths.find(
				(p: CustomDiscoveryPath) => filePath !== null && filePath.startsWith(p.path),
			);
			return matchingPath !== undefined ? `Custom (${matchingPath.label})` : 'Custom';
		}
		return source === 'user' ? 'User' : 'Project';
	});

	const sourceVariant = $derived.by(() => {
		const source = (item as { source?: string }).source;
		if (source === 'user') {
			return 'info' as const;
		}
		if (source === 'project') {
			return 'success' as const;
		}
		return 'amber' as const;
	});

	const lineCount = $derived(getItemLineCount(item));

	const fileSizeLabel = $derived(getItemFileSizeLabel(item, kind));

	const skillItem = $derived(kind === 'skill' ? (item as SkillConfig) : null);

	// ─── Functions ───────────────────────────────────────────────────────────

	async function handleOpenFile(event: MouseEvent): Promise<void> {
		event.stopPropagation();
		if (filePath === null) {
			return;
		}
		try {
			await openPath(filePath);
		} catch {
			// Silently fail — file may not have an associated app
		}
	}

	async function handleOpenFolder(event: MouseEvent): Promise<void> {
		event.stopPropagation();
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

<div
	role="button"
	tabindex="0"
	data-deprecated={isDeprecated ? 'true' : undefined}
	class={cn(
		'group flex cursor-pointer flex-col gap-2 rounded-lg border border-border bg-surface p-3 text-left transition-colors hover:bg-surface-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring',
		isDeprecated && 'opacity-60',
	)}
	onclick={onSelect}
	onkeydown={(e) => {
		if (e.key === 'Enter' || e.key === ' ') {
			e.preventDefault();
			onSelect();
		}
	}}
>
	<!-- Header -->
	<div class="flex flex-wrap items-start gap-1.5">
		<span class="mr-auto text-sm font-semibold text-foreground">{title}</span>

		<div class="flex flex-wrap items-center gap-1">
			<Badge variant={sourceVariant} size="compact">{sourceLabel}</Badge>

			{#if kind === 'skill' && skillItem !== null}
				{#if skillItem.category}
					<Badge variant="default" size="compact">{skillItem.category}</Badge>
				{/if}
			{:else if kind === 'agent'}
				{@const agentItem = item as AgentConfig}
				{#if agentItem.model}
					<Badge variant="mono" size="compact">{agentItem.model}</Badge>
				{/if}
			{:else if kind === 'hook'}
				{@const hookItem = item as HookConfig}
				<Badge variant="default" size="compact">{hookItem.event_type}</Badge>
				{#if hookItem.matcher}
					<Badge variant="default" size="compact" class="max-w-30 truncate">
						{hookItem.matcher}
					</Badge>
				{/if}
			{:else if kind === 'mcp'}
				{@const mcpItem = item as McpServerConfig}
				<Badge variant={mcpItem.enabled ? 'success' : 'danger'} size="compact">
					{mcpItem.enabled ? 'Enabled' : 'Disabled'}
				</Badge>
				<Badge variant="mono" size="compact">{mcpItem.transport_type}</Badge>
			{:else if kind === 'memory'}
				{@const memItem = item as MemoryConfig}
				{#if memItem.memory_type}
					<Badge variant="default" size="compact">{memItem.memory_type}</Badge>
				{/if}
			{:else if kind === 'instruction'}
				{#if fileSizeLabel !== null}
					<Badge variant="mono" size="compact">{fileSizeLabel}</Badge>
				{/if}
			{:else if kind === 'rule'}
				{@const ruleItem = item as RuleConfig}
				{@const lang =
					ruleItem.language ??
					(ruleItem.filename ? deriveLanguage(ruleItem.filename) : null)}
				{#if lang}
					<Badge variant="default" size="compact">{lang}</Badge>
				{/if}
			{/if}

			{#if isDeprecated}
				<Badge variant="warning" size="compact">Deprecated</Badge>
			{/if}

			{#if skillItem !== null && skillItem.skill_override !== null && skillItem.skill_override !== undefined}
				<div
					onclick={(e) => e.stopPropagation()}
					onkeydown={(e) => e.stopPropagation()}
					role="presentation"
				>
					<SkillOverrideControl
						skillName={skillItem.name}
						currentValue={skillItem.skill_override}
						workspaceRoot={aiConfig.workspaceRoot}
						variant="chip"
					/>
				</div>
			{/if}
		</div>
	</div>

	<!-- Description -->
	{#if description}
		<p class="line-clamp-2 text-sm text-foreground-muted">{description}</p>
	{/if}

	<!-- Footer -->
	<div class="flex items-center justify-between">
		<div class="flex items-center gap-0.5">
			{#if filePath !== null}
				<Button
					variant="ghost"
					size="icon-sm"
					aria-label="Open file"
					onclick={handleOpenFile}
					class="h-6 w-6 opacity-0 transition-opacity group-hover:opacity-100"
				>
					<FileTextIcon class="size-3" />
				</Button>
			{/if}
			{#if parentDir !== null}
				<Button
					variant="ghost"
					size="icon-sm"
					aria-label="Open folder"
					onclick={handleOpenFolder}
					class="h-6 w-6 opacity-0 transition-opacity group-hover:opacity-100"
				>
					<FolderOpenIcon class="size-3" />
				</Button>
			{/if}
		</div>

		{#if lineCount !== null}
			<span class="font-mono text-xs text-foreground-muted">{lineCount} lines</span>
		{/if}
	</div>
</div>
