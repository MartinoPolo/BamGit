<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import SessionTopBar from './SessionTopBar.svelte';
	import ThemeDecorator from '$lib/storybook/ThemeDecorator.svelte';

	const { Story } = defineMeta({
		title: 'Blocks/Session/Layout',
		// @ts-expect-error — Storybook decorator typing doesn't match Svelte 5 Component type
		decorators: [() => ThemeDecorator],
	});
</script>

<script lang="ts">
	import SessionSidebar from './SessionSidebar.svelte';
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
	const needsInputSession = makeMockSession({ state: 'needs-input' });
	const erroredSession = makeMockSession({ state: 'errored', cost_usd: 12.45 });
</script>

<Story name="Top Bar — Running">
	{#snippet template()}
		<div class="w-full">
			<SessionTopBar
				session={runningSession}
				branchName="feat/session-ui"
				issueNumber={90}
				prNumber={5}
			/>
		</div>
	{/snippet}
</Story>

<Story name="Top Bar — Needs Input">
	{#snippet template()}
		<div class="w-full">
			<SessionTopBar
				session={needsInputSession}
				branchName="fix/auth-flow"
				issueNumber={42}
			/>
		</div>
	{/snippet}
</Story>

<Story name="Top Bar — Errored">
	{#snippet template()}
		<div class="w-full">
			<SessionTopBar session={erroredSession} branchName="feat/broken" />
		</div>
	{/snippet}
</Story>

<Story name="Sidebar — Expanded">
	{#snippet template()}
		<div class="flex h-150">
			<div class="flex-1 bg-background p-4">
				<span class="text-sm text-foreground-muted">Chat content area</span>
			</div>
			<SessionSidebar
				session={runningSession}
				contextPercent={54}
				quota5hPercent={42}
				quota7dPercent={18}
				subAgentCount={5}
			/>
		</div>
	{/snippet}
</Story>

<Story name="Sidebar — Quota Warning">
	{#snippet template()}
		<div class="flex h-150">
			<div class="flex-1 bg-background p-4">
				<span class="text-sm text-foreground-muted">Chat content area</span>
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

<Story name="Sidebar — Errored Session">
	{#snippet template()}
		<div class="flex h-150">
			<div class="flex-1 bg-background p-4">
				<span class="text-sm text-foreground-muted">Chat content area</span>
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

<Story name="Full Layout">
	{#snippet template()}
		<div class="flex h-175 w-full flex-col">
			<SessionTopBar
				session={runningSession}
				branchName="feat/session-ui"
				issueNumber={90}
				prNumber={5}
			/>
			<div class="flex flex-1 overflow-hidden">
				<div class="relative flex-1 overflow-auto bg-background p-6">
					<div class="mx-auto max-w-225">
						<p class="text-sm text-foreground-muted">
							Chat message stream content would appear here...
						</p>
					</div>
				</div>
				<SessionSidebar
					session={runningSession}
					contextPercent={54}
					quota5hPercent={42}
					quota7dPercent={18}
					subAgentCount={5}
				/>
			</div>
		</div>
	{/snippet}
</Story>
