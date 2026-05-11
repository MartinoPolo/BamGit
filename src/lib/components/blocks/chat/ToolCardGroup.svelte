<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { ChatMessage as ChatMessageType } from '$lib/modules/chat/index.js';
	import ChevronRightIcon from '@lucide/svelte/icons/chevron-right';
	import ToolCardCompact from './ToolCardCompact.svelte';

	interface Props {
		messages: ChatMessageType[];
		renderCard?: Snippet<[ChatMessageType]>;
	}

	let { messages, renderCard }: Props = $props();

	let expanded = $state(false);
</script>

{#if expanded}
	<div class="flex flex-col gap-1.5">
		<button
			class="flex cursor-pointer items-center gap-1.5 px-2.5 py-1 text-[11px] font-medium text-foreground-subtle"
			onclick={() => (expanded = false)}
			type="button"
		>
			<ChevronRightIcon size={12} strokeWidth={2} class="rotate-90 transition-transform" />
			<span>{messages.length} tool calls</span>
			<div class="h-px flex-1 bg-border"></div>
		</button>
		{#each messages as message (message.id)}
			{#if renderCard}
				{@render renderCard(message)}
			{:else}
				<ToolCardCompact {message} />
			{/if}
		{/each}
	</div>
{:else}
	<button
		class="flex cursor-pointer items-center gap-1.5 px-2.5 py-1 text-[11px] font-medium text-foreground-subtle"
		onclick={() => (expanded = true)}
		type="button"
	>
		<ChevronRightIcon size={12} strokeWidth={2} />
		<span>{messages.length} tool calls</span>
		<div class="h-px flex-1 bg-border"></div>
	</button>
{/if}
