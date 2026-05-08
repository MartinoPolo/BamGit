<script lang="ts">
	import type { ChatMessage } from '$lib/modules/chat/index.js';
	import { TOOL_STATUS } from '$lib/modules/chat/index.js';
	import CheckIcon from '@lucide/svelte/icons/check';
	import XIcon from '@lucide/svelte/icons/x';
	import * as Card from '$lib/components/ui/card/index.js';
	import {
		extractToolDetail,
		extractToolOutput,
		getToolAccentColor,
		getToolIcon,
	} from './tool_card_utils.js';

	interface Props {
		message: ChatMessage;
		onCollapse?: () => void;
	}

	let { message, onCollapse }: Props = $props();

	const IconComponent = $derived(getToolIcon(message.toolName ?? ''));
	const detail = $derived(extractToolDetail(message));
	const output = $derived(extractToolOutput(message));
	const accentColor = $derived(getToolAccentColor(message.toolName ?? ''));
</script>

<Card.Card
	padding="none"
	class="overflow-hidden"
	role="region"
	aria-label="Tool card: {message.toolName}"
>
	<!-- Header (36px, same as L1) -->
	<button
		class="flex h-9 w-full cursor-pointer items-center gap-2 border-b border-border bg-surface-2 px-2.5"
		onclick={onCollapse}
		type="button"
	>
		<IconComponent class="size-[13px] shrink-0" style="color: {accentColor}" />
		<span class="text-xs font-semibold">{message.toolName ?? 'Tool'}</span>
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
	</button>

	<!-- Content panel with accent border -->
	<div class="flex">
		<div
			class="w-[3px] shrink-0"
			style="background: {(message.isError ?? false) ? 'var(--status-danger)' : accentColor}"
		></div>
		<pre
			class="m-0 max-h-[260px] flex-1 overflow-auto break-all whitespace-pre-wrap px-3 py-2.5 font-mono text-[11.5px] leading-[1.55] text-foreground-muted">{output ||
				detail}</pre>
	</div>
</Card.Card>
