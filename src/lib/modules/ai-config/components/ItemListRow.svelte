<script lang="ts">
	import { Badge } from '$lib/components/shadcn/badge/index.js';
	import { Button } from '$lib/components/shadcn/button/index.js';
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
	} from '$lib/types/generated';
	import {
		deriveLanguage,
		getParentDir,
		getItemTitle,
		getItemFilePath,
		getItemLineCount,
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

	const filePath = $derived(getItemFilePath(item, kind));

	const parentDir = $derived(getParentDir(filePath));

	const sourceDotClass = $derived.by((): string => {
		if (kind === 'memory') {
			return 'bg-foreground-muted/40';
		}
		const source = (item as Exclude<AnyItem, MemoryConfig>).source;
		if (source === 'user') {
			return 'bg-blue-500/80';
		}
		if (source === 'project') {
			return 'bg-green-500/80';
		}
		return 'bg-amber-500/80';
	});

	const lineCount = $derived(getItemLineCount(item));

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
			// Silently fail
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

<button
	type="button"
	class={cn(
		'group flex w-full items-center gap-2 rounded-md px-3 py-2 text-left hover:bg-surface-2',
		item.deprecated && 'opacity-60',
	)}
	onclick={onSelect}
>
	<!-- Source dot -->
	<span class={cn('size-1.5 shrink-0 rounded-full', sourceDotClass)}></span>

	<!-- Title -->
	<span class="min-w-0 flex-1 truncate text-sm text-foreground">{title}</span>

	<!-- Right side badges -->
	<div class="flex shrink-0 items-center gap-1.5">
		{#if kind === 'hook'}
			{@const hookItem = item as HookConfig}
			<Badge variant="default" size="compact">{hookItem.event_type}</Badge>
		{:else if kind === 'mcp'}
			{@const mcpItem = item as McpServerConfig}
			<Badge variant={mcpItem.enabled ? 'success' : 'danger'} size="compact">
				{mcpItem.enabled ? 'Enabled' : 'Disabled'}
			</Badge>
		{:else if kind === 'rule'}
			{@const ruleItem = item as RuleConfig}
			{@const lang =
				ruleItem.language ?? (ruleItem.filename ? deriveLanguage(ruleItem.filename) : null)}
			{#if lang}
				<Badge variant="default" size="compact">{lang}</Badge>
			{/if}
		{:else if kind === 'agent'}
			{@const agentItem = item as AgentConfig}
			{#if agentItem.model}
				<Badge variant="mono" size="compact">{agentItem.model}</Badge>
			{/if}
		{/if}

		{#if item.deprecated}
			<Badge variant="warning" size="compact">Deprecated</Badge>
		{/if}

		{#if lineCount !== null}
			<span class="font-mono text-xs text-foreground-muted">{lineCount} lines</span>
		{/if}

		{#if skillItem !== null}
			<div
				onclick={(e) => e.stopPropagation()}
				onkeydown={(e) => e.stopPropagation()}
				role="presentation"
			>
				<SkillOverrideControl
					skillName={skillItem.name}
					currentValue={skillItem.skill_override ?? null}
					workspaceRoot={aiConfig.workspaceRoot}
					variant="chip"
				/>
			</div>
		{/if}

		<div class="flex items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
			{#if filePath !== null}
				<Button
					variant="ghost"
					size="icon-sm"
					aria-label="Open file"
					onclick={handleOpenFile}
					class="h-5 w-5"
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
					class="h-5 w-5"
				>
					<FolderOpenIcon class="size-3" />
				</Button>
			{/if}
		</div>
	</div>
</button>
