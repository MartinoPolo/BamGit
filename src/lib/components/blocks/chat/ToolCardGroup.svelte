<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { ChatMessage as ChatMessageType } from '$lib/modules/chat/index.js';
	import * as Collapsible from '$lib/components/shadcn/collapsible/index.js';
	import ChevronRightIcon from '@lucide/svelte/icons/chevron-right';
	import ToolCardCompact from './ToolCardCompact.svelte';
	import { cn } from '$lib/utils.js';

	interface Props {
		messages: ChatMessageType[];
		renderCard?: Snippet<[ChatMessageType]>;
	}

	let { messages, renderCard }: Props = $props();

	let expanded = $state(false);
</script>

<Collapsible.Root bind:open={expanded} class="flex flex-col gap-1.5">
	<Collapsible.Trigger
		class="flex w-full cursor-pointer items-center gap-1.5 px-2.5 py-1 text-[11px] font-medium text-foreground-subtle"
	>
		<ChevronRightIcon
			size={12}
			strokeWidth={2}
			class={cn('transition-transform duration-2', expanded && 'rotate-90')}
		/>
		<span>{messages.length} tool calls</span>
		<div class="h-px flex-1 bg-border"></div>
	</Collapsible.Trigger>
	<Collapsible.Content>
		{#each messages as message (message.id)}
			{#if renderCard}
				{@render renderCard(message)}
			{:else}
				<ToolCardCompact {message} />
			{/if}
		{/each}
	</Collapsible.Content>
</Collapsible.Root>
