<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import SessionSidebar from './SessionSidebar.svelte';

	const { Story } = defineMeta({
		title: 'Blocks/Session/SessionSidebar',
		component: SessionSidebar,
		tags: ['autodocs'],
	});
</script>

<script lang="ts">
	import type { Session } from '$lib/types/generated/Session.js';

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
	const erroredSession = makeMockSession({ state: 'errored', cost_usd: 12.45 });
	const finishedSession = makeMockSession({
		state: 'finished',
		ended_at: new Date().toISOString(),
		cost_usd: 2.15,
		token_count: 22400,
	});
</script>

<Story name="Expanded — Running">
	{#snippet template()}
		<div class="flex h-150">
			<div class="flex-1 bg-background p-4">
				<span class="text-sm text-foreground-muted">Chat area</span>
			</div>
			<SessionSidebar
				session={runningSession}
				contextPercent={54}
				quota5hPercent={42}
				quota7dPercent={18}
				subAgentCount={0}
			/>
		</div>
	{/snippet}
</Story>

<Story name="Quota Warning">
	{#snippet template()}
		<div class="flex h-150">
			<div class="flex-1 bg-background p-4">
				<span class="text-sm text-foreground-muted">Chat area</span>
			</div>
			<SessionSidebar
				session={runningSession}
				contextPercent={72}
				quota5hPercent={88}
				quota7dPercent={65}
				subAgentCount={3}
			/>
		</div>
	{/snippet}
</Story>

<Story name="Errored Session">
	{#snippet template()}
		<div class="flex h-150">
			<div class="flex-1 bg-background p-4">
				<span class="text-sm text-foreground-muted">Chat area</span>
			</div>
			<SessionSidebar
				session={erroredSession}
				contextPercent={95}
				quota5hPercent={50}
				quota7dPercent={10}
			/>
		</div>
	{/snippet}
</Story>

<Story name="With Sub-Agents">
	{#snippet template()}
		<div class="flex h-150">
			<div class="flex-1 bg-background p-4">
				<span class="text-sm text-foreground-muted">Chat area</span>
			</div>
			<SessionSidebar
				session={runningSession}
				contextPercent={61}
				quota5hPercent={55}
				quota7dPercent={30}
				subAgentCount={5}
			/>
		</div>
	{/snippet}
</Story>

<Story name="Idle Session">
	{#snippet template()}
		<div class="flex h-150">
			<div class="flex-1 bg-background p-4">
				<span class="text-sm text-foreground-muted">Chat area</span>
			</div>
			<SessionSidebar
				session={finishedSession}
				contextPercent={38}
				quota5hPercent={25}
				quota7dPercent={8}
			/>
		</div>
	{/snippet}
</Story>
