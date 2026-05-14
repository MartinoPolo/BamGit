<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import SessionChatView from './SessionChatView.svelte';

	const { Story } = defineMeta({
		title: 'Blocks/Session/SessionChatView',
		component: SessionChatView,
		tags: ['autodocs'],
	});
</script>

<script lang="ts">
	import { fn } from 'storybook/test';
	import type { Session } from '$lib/types/generated/Session.js';
	import SessionChatViewStoryWrapper from './SessionChatViewStoryWrapper.svelte';

	function makeMockSession(overrides: Partial<Session> = {}): Session {
		return {
			id: 'mock-session-1',
			issue_id: null,
			provider: 'claude-code',
			state: 'running',
			pid: 12345,
			cli_session_id: 'ses_01HXK4mZ',
			started_at: new Date().toISOString(),
			ended_at: null,
			cost_usd: 4.387,
			token_count: 48200,
			original_intent: 'Implement the OpenCode provider trait',
			last_prompt: null,
			last_response_summary: null,
			execution_phase: 'none',
			source: 'spawned',
			working_directory: '/projects/grovekeeper',
			...overrides,
		};
	}

	const runningSession = makeMockSession();
	const emptySession = makeMockSession({ id: 'mock-empty', cost_usd: 0, token_count: 0 });
	const needsInputSession = makeMockSession({ id: 'mock-needs-input', state: 'needs-input' });
	const erroredSession = makeMockSession({
		id: 'mock-errored',
		state: 'errored',
		ended_at: new Date().toISOString(),
	});
	const onBack = fn();
</script>

<Story name="Running">
	{#snippet template()}
		<SessionChatViewStoryWrapper>
			<div class="h-[600px] w-full bg-background">
				<SessionChatView session={runningSession} />
			</div>
		</SessionChatViewStoryWrapper>
	{/snippet}
</Story>

<Story name="Empty Session">
	{#snippet template()}
		<SessionChatViewStoryWrapper>
			<div class="h-[600px] w-full bg-background">
				<SessionChatView session={emptySession} />
			</div>
		</SessionChatViewStoryWrapper>
	{/snippet}
</Story>

<Story name="Needs Input">
	{#snippet template()}
		<SessionChatViewStoryWrapper>
			<div class="h-[600px] w-full bg-background">
				<SessionChatView session={needsInputSession} />
			</div>
		</SessionChatViewStoryWrapper>
	{/snippet}
</Story>

<Story name="Errored">
	{#snippet template()}
		<SessionChatViewStoryWrapper>
			<div class="h-[600px] w-full bg-background">
				<SessionChatView session={erroredSession} />
			</div>
		</SessionChatViewStoryWrapper>
	{/snippet}
</Story>

<Story name="With Back Button">
	{#snippet template()}
		<SessionChatViewStoryWrapper>
			<div class="h-[600px] w-full bg-background">
				<SessionChatView session={runningSession} {onBack} />
			</div>
		</SessionChatViewStoryWrapper>
	{/snippet}
</Story>
