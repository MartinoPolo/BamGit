<script lang="ts">
	import type { ChatMessage as ChatMessageType } from '$lib/modules/chat/index.js';
	import { MESSAGE_ROLE, INTERACTION_TYPE } from '$lib/modules/chat/index.js';
	import UserBubble from './UserBubble.svelte';
	import AssistantMessage from './AssistantMessage.svelte';
	import SystemMessage from './SystemMessage.svelte';
	import ToolCardCompact from './ToolCardCompact.svelte';
	import ToolCardExpanded from './ToolCardExpanded.svelte';
	import ToolCardPermission from './ToolCardPermission.svelte';
	import ToolCardElicitation from './ToolCardElicitation.svelte';
	import ToolCardAskUser from './ToolCardAskUser.svelte';

	interface Props {
		message: ChatMessageType;
		streaming?: boolean;
	}

	let { message, streaming = false }: Props = $props();

	let expanded = $state(false);
</script>

{#if message}
	{#if message.role === MESSAGE_ROLE.user}
		<UserBubble content={message.content} />
	{:else if message.role === MESSAGE_ROLE.assistant}
		<AssistantMessage content={message.content} {streaming} />
	{:else if message.role === MESSAGE_ROLE.tool}
		{#if message.interactionType === INTERACTION_TYPE.permission}
			<ToolCardPermission {message} />
		{:else if message.interactionType === INTERACTION_TYPE.elicitation}
			<ToolCardElicitation {message} />
		{:else if message.interactionType === INTERACTION_TYPE.askUser}
			<ToolCardAskUser {message} />
		{:else if expanded}
			<ToolCardExpanded {message} onCollapse={() => (expanded = false)} />
		{:else}
			<ToolCardCompact {message} onExpand={() => (expanded = true)} />
		{/if}
	{:else if message.role === MESSAGE_ROLE.system}
		<SystemMessage content={message.content} />
	{/if}
{/if}
