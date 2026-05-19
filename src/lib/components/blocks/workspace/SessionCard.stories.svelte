<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import { expect, fn, userEvent, within } from 'storybook/test';
	import SessionCard from './SessionCard.svelte';
	import SessionCardStoryWrapper from './SessionCardStoryWrapper.svelte';
	import type { Session } from '$lib/types/generated';
	import { MOCK_SESSIONS } from '$lib/tauri_mock_data.js';

	const { Story } = defineMeta({
		title: 'Blocks/Workspace/SessionCard',
		component: SessionCard,
		tags: ['autodocs'],
	});

	interface PlayContext {
		canvasElement: HTMLElement;
		args: { onClick: unknown; onTerminate: unknown };
	}

	function makeSession(overrides: Partial<Session> = {}): Session {
		return { ...MOCK_SESSIONS[0], ...overrides };
	}

	const onClick = fn();
	const onTerminate = fn();

	// --- play() interaction tests ---

	/** Click on card body → onClick fires with the session object. */
	const playCardClickFiresOnClick = async ({ canvasElement, args }: PlayContext) => {
		const canvas = within(canvasElement);
		const onClickSpy = args.onClick as ReturnType<typeof fn>;
		onClickSpy.mockClear();

		const title = canvas.getByText('Refactor the auth middleware to use OAuth2 tokens');
		await userEvent.click(title);

		await expect(onClickSpy).toHaveBeenCalledOnce();
	};

	/**
	 * The card uses a div[role="button"] wrapper whose accessible name includes all text.
	 * Query the actual <button> element for the Stop button to avoid ambiguous matches.
	 */
	function findStopButton(canvasElement: HTMLElement): HTMLButtonElement | null {
		const buttons = canvasElement.querySelectorAll<HTMLButtonElement>('button');
		return Array.from(buttons).find((btn) => /stop/i.test(btn.textContent ?? '')) ?? null;
	}

	/** Click terminate button → onTerminate fires, onClick does NOT fire (stopPropagation). */
	const playTerminateStopsPropagation = async ({ canvasElement, args }: PlayContext) => {
		const onClickSpy = args.onClick as ReturnType<typeof fn>;
		const onTerminateSpy = args.onTerminate as ReturnType<typeof fn>;
		onClickSpy.mockClear();
		onTerminateSpy.mockClear();

		const terminateButton = findStopButton(canvasElement);
		await expect(terminateButton).not.toBeNull();
		await userEvent.click(terminateButton!);

		await expect(onTerminateSpy).toHaveBeenCalledOnce();
		await expect(onClickSpy).not.toHaveBeenCalled();
	};

	/** Running state: badge visible, terminate button present. */
	const playRunningStateRendered = async ({ canvasElement }: PlayContext) => {
		const canvas = within(canvasElement);

		await expect(canvas.getByText('Running')).toBeVisible();
		// Running badge has a pulsing dot
		const pulsingDot = canvasElement.querySelector('.animate-pulse');
		await expect(pulsingDot).not.toBeNull();
		// Terminate button should be present for active sessions
		await expect(findStopButton(canvasElement)).not.toBeNull();
	};

	/** Needs-input state: correct badge, terminate button present. */
	const playNeedsInputStateRendered = async ({ canvasElement }: PlayContext) => {
		const canvas = within(canvasElement);

		await expect(canvas.getByText('Needs Input')).toBeVisible();
		await expect(findStopButton(canvasElement)).not.toBeNull();
		// Summary text visible
		await expect(
			canvas.getByText('Should the toggle persist preference to localStorage or DB?'),
		).toBeVisible();
	};

	/** Errored state: correct badge, no terminate button (inactive). */
	const playErroredStateRendered = async ({ canvasElement }: PlayContext) => {
		const canvas = within(canvasElement);

		await expect(canvas.getByText('Errored')).toBeVisible();
		// Errored is inactive — no terminate button
		await expect(findStopButton(canvasElement)).toBeNull();
		// Error summary visible
		await expect(canvas.getByText('Fatal: connection refused to database host')).toBeVisible();
	};

	/** Finished state: correct badge, no terminate button. */
	const playFinishedNoTerminate = async ({ canvasElement }: PlayContext) => {
		const canvas = within(canvasElement);

		await expect(canvas.getByText('Finished')).toBeVisible();
		await expect(findStopButton(canvasElement)).toBeNull();
	};

	/** Token count and cost display correctly. */
	const playTokenAndCostDisplay = async ({ canvasElement }: PlayContext) => {
		const canvas = within(canvasElement);

		// Cost formatted to 3 decimal places
		await expect(canvas.getByText('$3.847')).toBeVisible();
		// Token count with locale formatting (comma or period separator depends on locale)
		await expect(canvas.getByText(/128.?500 tokens/)).toBeVisible();
	};
</script>

<Story
	name="Running [play: state badge rendered]"
	args={{ session: makeSession(), onClick, onTerminate }}
	play={playRunningStateRendered}
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
	name="Needs Input [play: state badge rendered]"
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
	play={playNeedsInputStateRendered}
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
	name="Errored [play: state badge rendered]"
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
	play={playErroredStateRendered}
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
	name="Finished [play: no terminate button]"
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
	play={playFinishedNoTerminate}
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
	name="With Cost [play: token cost display]"
	args={{
		session: makeSession({
			id: 'story-with-cost',
			cost_usd: 3.847,
			token_count: 128500,
		}),
		onClick,
		onTerminate,
	}}
	play={playTokenAndCostDisplay}
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

<Story
	name="Click Fires Callback [play: click calls handler]"
	args={{ session: makeSession(), onClick, onTerminate }}
	play={playCardClickFiresOnClick}
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
	name="Terminate Stops Propagation [play: stop propagation]"
	args={{ session: makeSession(), onClick, onTerminate }}
	play={playTerminateStopsPropagation}
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
