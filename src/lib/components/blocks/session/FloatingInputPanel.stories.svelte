<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import { expect, fn, userEvent, within } from 'storybook/test';
	import FloatingInputPanel from './FloatingInputPanel.svelte';

	const { Story } = defineMeta({
		title: 'Blocks/Session/FloatingInputPanel',
		args: {
			onSend: fn(),
			onStop: fn(),
		},
	});

	interface PlayContext {
		canvasElement: HTMLElement;
		args: Record<string, unknown>;
	}

	/** SendStopButton is always the last button in the panel's bottom controls. */
	function getActionButton(canvas: ReturnType<typeof within>): HTMLElement {
		const buttons = canvas.getAllByRole('button');
		return buttons[buttons.length - 1];
	}

	const playTypeEnablesSend = async ({ canvasElement }: PlayContext) => {
		const canvas = within(canvasElement);
		const textarea = canvas.getByPlaceholderText('Message or /command…');
		const sendButton = getActionButton(canvas);

		// Initially disabled (empty textarea)
		await expect(sendButton).toBeDisabled();

		// Type text → send button enables
		await userEvent.type(textarea, 'Hello world');
		await expect(textarea).toHaveValue('Hello world');
		await expect(sendButton).toBeEnabled();
	};

	const playClickSendFiresCallback = async ({ canvasElement, args }: PlayContext) => {
		const canvas = within(canvasElement);
		const textarea = canvas.getByPlaceholderText('Message or /command…');

		// Type so the send button enables
		await userEvent.type(textarea, 'Send this message');
		const sendButton = getActionButton(canvas);
		await expect(sendButton).toBeEnabled();

		await userEvent.click(sendButton);
		await expect(args.onSend).toHaveBeenCalledOnce();
	};

	const playClickStopFiresCallback = async ({ canvasElement, args }: PlayContext) => {
		const canvas = within(canvasElement);
		const stopButton = getActionButton(canvas);

		await userEvent.click(stopButton);
		await expect(args.onStop).toHaveBeenCalledOnce();
	};

	const playDisabledState = async ({ canvasElement }: PlayContext) => {
		const canvas = within(canvasElement);
		const textarea = canvas.getByPlaceholderText('Message or /command…');
		const sendButton = getActionButton(canvas);

		await expect(textarea).toBeDisabled();
		await expect(sendButton).toBeDisabled();
	};
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

<!-- Interaction tests -->

<Story name="Type Enables Send" play={playTypeEnablesSend}>
	{#snippet template(args: Record<string, unknown>)}
		<div class="relative h-75 w-full bg-background">
			<FloatingInputPanel
				session={idleSession}
				onSend={args.onSend as () => void}
				onStop={args.onStop as () => void}
			/>
		</div>
	{/snippet}
</Story>

<Story name="Click Send Fires Callback" play={playClickSendFiresCallback}>
	{#snippet template(args: Record<string, unknown>)}
		<div class="relative h-75 w-full bg-background">
			<FloatingInputPanel
				session={idleSession}
				onSend={args.onSend as () => void}
				onStop={args.onStop as () => void}
			/>
		</div>
	{/snippet}
</Story>

<Story name="Click Stop Fires Callback" play={playClickStopFiresCallback}>
	{#snippet template(args: Record<string, unknown>)}
		<div class="relative h-75 w-full bg-background">
			<FloatingInputPanel
				session={runningSession}
				onSend={args.onSend as () => void}
				onStop={args.onStop as () => void}
			/>
		</div>
	{/snippet}
</Story>

<Story name="Disabled State" play={playDisabledState}>
	{#snippet template(args: Record<string, unknown>)}
		<div class="relative h-75 w-full bg-background">
			<FloatingInputPanel
				session={idleSession}
				disabled={true}
				onSend={args.onSend as () => void}
				onStop={args.onStop as () => void}
			/>
		</div>
	{/snippet}
</Story>
