<script lang="ts">
	import type { ChatMessage as ChatMessageType } from '$lib/modules/chat/index.js';
	import { MESSAGE_ROLE } from '$lib/modules/chat/index.js';
	import UserBubble from './UserBubble.svelte';
	import AssistantMessage from './AssistantMessage.svelte';
	import SystemMessage from './SystemMessage.svelte';
	import ToolCardCompact from './ToolCardCompact.svelte';

	interface Props {
		message: ChatMessageType;
		streaming?: boolean;
	}

	let { message, streaming = false }: Props = $props();
</script>

{#if message.role === MESSAGE_ROLE.user}
	<UserBubble content={message.content} />
{:else if message.role === MESSAGE_ROLE.assistant}
	<AssistantMessage content={message.content} {streaming} />
{:else if message.role === MESSAGE_ROLE.tool}
	<ToolCardCompact {message} />
{:else if message.role === MESSAGE_ROLE.system}
	<SystemMessage content={message.content} />
{/if}
