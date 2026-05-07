<script lang="ts">
	import type { ChatMessage } from '$lib/modules/chat/index.js';
	import { TOOL_STATUS } from '$lib/modules/chat/index.js';
	import CheckIcon from '@lucide/svelte/icons/check';
	import XIcon from '@lucide/svelte/icons/x';
	import TerminalIcon from '@lucide/svelte/icons/terminal';
	import EyeIcon from '@lucide/svelte/icons/eye';
	import PencilIcon from '@lucide/svelte/icons/pencil';
	import CodeIcon from '@lucide/svelte/icons/code';
	import FolderSearchIcon from '@lucide/svelte/icons/folder-search';
	import SearchIcon from '@lucide/svelte/icons/search';
	import CpuIcon from '@lucide/svelte/icons/cpu';
	import GlobeIcon from '@lucide/svelte/icons/globe';
	import ArrowDownIcon from '@lucide/svelte/icons/arrow-down';
	import ListIcon from '@lucide/svelte/icons/list';
	import SettingsIcon from '@lucide/svelte/icons/settings';

	interface Props {
		message: ChatMessage;
	}

	let { message }: Props = $props();

	const TOOL_ICON_MAP: Record<string, typeof TerminalIcon> = {
		Bash: TerminalIcon,
		Read: EyeIcon,
		Write: PencilIcon,
		Edit: CodeIcon,
		Glob: FolderSearchIcon,
		Grep: SearchIcon,
		Agent: CpuIcon,
		WebSearch: GlobeIcon,
		WebFetch: ArrowDownIcon,
		TodoWrite: ListIcon,
		Task: SettingsIcon,
	};

	const IconComponent = $derived(TOOL_ICON_MAP[message.toolName ?? ''] ?? TerminalIcon);

	// fallow-ignore-next-line complexity
	const detail = $derived.by(() => {
		if (message.toolInput === undefined || message.toolInput === null) {
			return '';
		}
		if (typeof message.toolInput === 'object' && !Array.isArray(message.toolInput)) {
			const input = message.toolInput as Record<string, unknown>;
			if (typeof input.file_path === 'string') {
				return input.file_path;
			}
			if (typeof input.command === 'string') {
				return `$ ${input.command}`;
			}
			if (typeof input.pattern === 'string') {
				return input.pattern;
			}
		}
		return '';
	});
</script>

<div
	class="flex h-9 items-center gap-2 rounded-md border border-border bg-surface-2 px-2.5 opacity-80 transition-opacity duration-[120ms] hover:opacity-100"
	class:border-l-2={message.isError === true}
	class:border-l-status-danger={message.isError === true}
>
	<IconComponent class="size-[13px] shrink-0 text-foreground-muted" />
	<span class="text-xs font-semibold text-foreground">{message.toolName ?? 'Tool'}</span>
	{#if detail}
		<span class="flex-1 truncate font-mono text-[11px] text-foreground-muted">
			{detail}
		</span>
	{:else}
		<span class="flex-1"></span>
	{/if}
	{#if message.toolStatus === TOOL_STATUS.running}
		<span
			class="size-2.5 shrink-0 animate-spin rounded-full border-2 border-foreground-muted border-t-transparent"
		></span>
	{:else if message.toolStatus === TOOL_STATUS.error}
		<XIcon class="size-3 shrink-0 text-status-danger" />
	{:else}
		<CheckIcon class="size-3 shrink-0 text-status-success" />
	{/if}
</div>
