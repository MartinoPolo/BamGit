<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import FloatingInputPanel from './FloatingInputPanel.svelte';
	import ThemeDecorator from '$lib/storybook/ThemeDecorator.svelte';

	const { Story } = defineMeta({
		title: 'Blocks/Session/FloatingInputPanel',
		// @ts-expect-error — Storybook decorator typing doesn't match Svelte 5 Component type
		decorators: [() => ThemeDecorator],
	});
</script>

<script lang="ts">
	import SendStopButton from './SendStopButton.svelte';
	import SkillChipsRow from './SkillChipsRow.svelte';
	import type { Session } from '$lib/types/generated/Session.js';

	function makeMockSession(overrides: Partial<Session> = {}): Session {
		return {
			id: 'mock-session-1',
			issue_id: null,
			provider: 'claude-code',
			state: 'needs-input',
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

	const idleSession = makeMockSession({ state: 'needs-input' });
	const runningSession = makeMockSession({ state: 'running' });
</script>

<Story name="Idle — Ready for Input">
	{#snippet template()}
		<div class="relative h-75 w-full bg-background">
			<FloatingInputPanel session={idleSession} />
		</div>
	{/snippet}
</Story>

<Story name="Running — Stop Available">
	{#snippet template()}
		<div class="relative h-75 w-full bg-background">
			<FloatingInputPanel session={runningSession} />
		</div>
	{/snippet}
</Story>

<Story name="Send / Stop Button States">
	{#snippet template()}
		<div class="flex items-center gap-4 p-4">
			<div class="flex flex-col items-center gap-1">
				<SendStopButton isRunning={false} disabled={false} />
				<span class="text-[10px] text-foreground-subtle">Send</span>
			</div>
			<div class="flex flex-col items-center gap-1">
				<SendStopButton isRunning={false} disabled={true} />
				<span class="text-[10px] text-foreground-subtle">Disabled</span>
			</div>
			<div class="flex flex-col items-center gap-1">
				<SendStopButton isRunning={true} />
				<span class="text-[10px] text-foreground-subtle">Stop</span>
			</div>
		</div>
	{/snippet}
</Story>

<Story name="Skill Chips Row">
	{#snippet template()}
		<div class="w-full max-w-225 rounded-lg border border-border bg-surface p-0">
			<SkillChipsRow />
		</div>
	{/snippet}
</Story>
