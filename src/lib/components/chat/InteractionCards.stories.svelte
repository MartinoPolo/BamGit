<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import ToolCardPermission from './ToolCardPermission.svelte';
	import ThemeDecorator from '$lib/storybook/ThemeDecorator.svelte';

	const { Story } = defineMeta({
		title: 'Blocks/Chat/InteractionCards',
		// @ts-expect-error — Storybook decorator typing doesn't match Svelte 5 Component type
		decorators: [() => ThemeDecorator],
	});
</script>

<script lang="ts">
	import ToolCardElicitation from './ToolCardElicitation.svelte';
	import ToolCardAskUser from './ToolCardAskUser.svelte';
	import type { ChatMessage } from '$lib/modules/chat/index.js';

	const permissionMessage: ChatMessage = {
		id: 'perm-1',
		role: 'tool',
		content: 'Permission needed for Bash',
		timestamp: Date.now(),
		toolName: 'Bash',
		toolStatus: 'running',
		toolInput: {
			command: 'rm -rf target/debug/build/grovekeeper-*\ncargo build --release',
		},
		interactionType: 'permission',
		requestId: 'req_1',
	};

	const elicitationMessage: ChatMessage = {
		id: 'elicit-1',
		role: 'tool',
		content:
			'The query requires access to the production database. Please provide the connection string or confirm the environment to use.',
		timestamp: Date.now(),
		toolStatus: 'running',
		toolInput: { server: 'postgres' },
		interactionType: 'elicitation',
		requestId: 'req_2',
	};

	const askUserMessage: ChatMessage = {
		id: 'ask-1',
		role: 'tool',
		content: '',
		timestamp: Date.now(),
		toolStatus: 'running',
		toolInput: {
			question:
				'I found two approaches for the authentication refactor. Which would you prefer?',
			options: [
				'Option A: Full OAuth2 PKCE with refresh tokens (more secure, more complex)',
				'Option B: API key with session tokens (simpler, adequate for dev tools)',
				'Other (describe your preference)',
			],
		},
		interactionType: 'ask-user',
		requestId: 'req_3',
	};
</script>

<Story name="Permission Prompt">
	{#snippet template()}
		<div class="mx-auto max-w-225 p-4">
			<ToolCardPermission message={permissionMessage} />
		</div>
	{/snippet}
</Story>

<Story name="Elicitation Prompt">
	{#snippet template()}
		<div class="mx-auto max-w-225 p-4">
			<ToolCardElicitation message={elicitationMessage} />
		</div>
	{/snippet}
</Story>

<Story name="Ask User (Options)">
	{#snippet template()}
		<div class="mx-auto max-w-225 p-4">
			<ToolCardAskUser message={askUserMessage} />
		</div>
	{/snippet}
</Story>

<Story name="All L3 Types">
	{#snippet template()}
		<div class="mx-auto max-w-225 space-y-3 p-4">
			<ToolCardPermission message={permissionMessage} />
			<ToolCardElicitation message={elicitationMessage} />
			<ToolCardAskUser message={askUserMessage} />
		</div>
	{/snippet}
</Story>
