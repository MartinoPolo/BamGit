<script lang="ts">
	import type { ChatMessage } from '$lib/modules/chat/index.js';
	import { TOOL_STATUS } from '$lib/modules/chat/index.js';
	import CheckIcon from '@lucide/svelte/icons/check';
	import XIcon from '@lucide/svelte/icons/x';
	import { extractToolDetail, getToolIcon } from './tool_card_utils.js';

	interface Props {
		message: ChatMessage;
		onExpand?: () => void;
	}

	let { message, onExpand }: Props = $props();

	const IconComponent = $derived(getToolIcon(message.toolName ?? ''));
	const detail = $derived(extractToolDetail(message));
</script>

<div
	class="flex h-9 cursor-pointer items-center gap-2 rounded-md border border-border bg-surface-2 px-2.5 opacity-80 transition-opacity duration-120 hover:opacity-100"
	class:border-l-2={message.isError === true}
	class:border-l-status-danger={message.isError === true}
	onclick={onExpand}
	onkeydown={(e) => {
		if (e.key === 'Enter' || e.key === ' ') {
			e.preventDefault();
			onExpand?.();
		}
	}}
	role="button"
	tabindex="0"
	aria-label="Expand {message.toolName} tool card"
>
	<IconComponent class="size-3.25 shrink-0 text-foreground-muted" />
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
