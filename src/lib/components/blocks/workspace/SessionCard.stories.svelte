<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import { fn } from 'storybook/test';
	import SessionCard from './SessionCard.svelte';
	import SessionCardStoryWrapper from './SessionCardStoryWrapper.svelte';
	import type { Session } from '$lib/types/generated';
	import { MOCK_SESSIONS } from '$lib/tauri_mock_data.js';

	const { Story } = defineMeta({
		title: 'Blocks/Workspace/SessionCard',
		component: SessionCard,
		tags: ['autodocs'],
	});

	function makeSession(overrides: Partial<Session> = {}): Session {
		return { ...MOCK_SESSIONS[0], ...overrides };
	}

	const onClick = fn();
	const onTerminate = fn();
</script>

<Story name="Running" args={{ session: makeSession(), onClick, onTerminate }}>
	{#snippet template(args: {
		session: Session;
		onClick: (session: Session) => void;
		onTerminate: (id: string) => void;
	})}
		<SessionCardStoryWrapper>
			<div class="max-w-lg p-8">
				<SessionCard
					session={args.session}
					onClick={args.onClick}
					onTerminate={args.onTerminate}
				/>
			</div>
		</SessionCardStoryWrapper>
	{/snippet}
</Story>

<Story
	name="Needs Input"
	args={{
		session: makeSession({
			id: 'story-needs-input',
			state: 'needs-input',
			original_intent: 'Add dark mode toggle component',
			last_response_summary: 'Should the toggle persist preference to localStorage or DB?',
			cost_usd: 0.28,
			token_count: 9800,
		}),
		onClick,
		onTerminate,
	}}
>
	{#snippet template(args: {
		session: Session;
		onClick: (session: Session) => void;
		onTerminate: (id: string) => void;
	})}
		<SessionCardStoryWrapper>
			<div class="max-w-lg p-8">
				<SessionCard
					session={args.session}
					onClick={args.onClick}
					onTerminate={args.onTerminate}
				/>
			</div>
		</SessionCardStoryWrapper>
	{/snippet}
</Story>

<Story
	name="Errored"
	args={{
		session: makeSession({
			id: 'story-errored',
			state: 'errored',
			original_intent: 'Database migration script',
			last_response_summary: 'Fatal: connection refused to database host',
			cost_usd: 0.05,
			token_count: 1200,
		}),
		onClick,
		onTerminate,
	}}
>
	{#snippet template(args: {
		session: Session;
		onClick: (session: Session) => void;
		onTerminate: (id: string) => void;
	})}
		<SessionCardStoryWrapper>
			<div class="max-w-lg p-8">
				<SessionCard
					session={args.session}
					onClick={args.onClick}
					onTerminate={args.onTerminate}
				/>
			</div>
		</SessionCardStoryWrapper>
	{/snippet}
</Story>

<Story
	name="Finished"
	args={{
		session: makeSession({
			id: 'story-finished',
			state: 'finished',
			original_intent: 'Fix E2E test timeouts in CI',
			last_response_summary:
				'Increased Playwright timeout and added retry logic for flaky tests.',
			cost_usd: 1.05,
			token_count: 42000,
			ended_at: '2026-05-02T14:45:00Z',
		}),
		onClick,
		onTerminate,
	}}
>
	{#snippet template(args: {
		session: Session;
		onClick: (session: Session) => void;
		onTerminate: (id: string) => void;
	})}
		<SessionCardStoryWrapper>
			<div class="max-w-lg p-8">
				<SessionCard
					session={args.session}
					onClick={args.onClick}
					onTerminate={args.onTerminate}
				/>
			</div>
		</SessionCardStoryWrapper>
	{/snippet}
</Story>

<Story
	name="With Cost"
	args={{
		session: makeSession({
			id: 'story-with-cost',
			cost_usd: 3.847,
			token_count: 128500,
		}),
		onClick,
		onTerminate,
	}}
>
	{#snippet template(args: {
		session: Session;
		onClick: (session: Session) => void;
		onTerminate: (id: string) => void;
	})}
		<SessionCardStoryWrapper>
			<div class="max-w-lg p-8">
				<SessionCard
					session={args.session}
					onClick={args.onClick}
					onTerminate={args.onTerminate}
				/>
			</div>
		</SessionCardStoryWrapper>
	{/snippet}
</Story>

<Story
	name="With Issue Linked"
	args={{
		session: makeSession({
			id: 'story-with-issue',
			issue_id: 'mock-issue-auth',
		}),
		onClick,
		onTerminate,
	}}
>
	{#snippet template(args: {
		session: Session;
		onClick: (session: Session) => void;
		onTerminate: (id: string) => void;
	})}
		<SessionCardStoryWrapper>
			<div class="max-w-lg p-8">
				<SessionCard
					session={args.session}
					onClick={args.onClick}
					onTerminate={args.onTerminate}
				/>
			</div>
		</SessionCardStoryWrapper>
	{/snippet}
</Story>

<Story name="All States">
	{#snippet template()}
		<SessionCardStoryWrapper>
			<div class="flex max-w-lg flex-col gap-4 p-8">
				<SessionCard
					session={makeSession({ id: 'all-running', state: 'running' })}
					onClick={fn()}
					onTerminate={fn()}
				/>
				<SessionCard
					session={makeSession({
						id: 'all-needs-input',
						state: 'needs-input',
						original_intent: 'Needs input session',
						last_response_summary: 'Waiting for user decision...',
					})}
					onClick={fn()}
					onTerminate={fn()}
				/>
				<SessionCard
					session={makeSession({
						id: 'all-needs-review',
						state: 'needs-review',
						original_intent: 'Needs review session',
						last_response_summary: 'Changes ready for review',
					})}
					onClick={fn()}
					onTerminate={fn()}
				/>
				<SessionCard
					session={makeSession({
						id: 'all-paused',
						state: 'paused',
						original_intent: 'Paused session',
						last_response_summary: 'Session paused by user',
					})}
					onClick={fn()}
					onTerminate={fn()}
				/>
				<SessionCard
					session={makeSession({
						id: 'all-finished',
						state: 'finished',
						original_intent: 'Finished session',
						last_response_summary: 'All tasks completed successfully.',
					})}
					onClick={fn()}
					onTerminate={fn()}
				/>
				<SessionCard
					session={makeSession({
						id: 'all-errored',
						state: 'errored',
						original_intent: 'Errored session',
						last_response_summary: 'Fatal error occurred',
					})}
					onClick={fn()}
					onTerminate={fn()}
				/>
			</div>
		</SessionCardStoryWrapper>
	{/snippet}
</Story>
