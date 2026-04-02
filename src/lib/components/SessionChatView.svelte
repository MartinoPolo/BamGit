<script lang="ts">
	import type { Session, SessionEventPayload } from '$lib/types/session';
	import { send_message, interrupt_session } from '$lib/tauri/session_commands';
	import { listen, type UnlistenFn } from '@tauri-apps/api/event';
	import { onMount, onDestroy } from 'svelte';

	interface Props {
		session: Session;
	}

	interface ChatMessage {
		role: 'user' | 'assistant' | 'tool' | 'system';
		content: string;
		tool_name?: string;
		is_error?: boolean;
		timestamp: number;
	}

	let { session }: Props = $props();

	let messages = $state<ChatMessage[]>([]);
	let current_streaming_text = $state('');
	let prompt_input = $state('');
	let sending = $state(false);
	let unlisten_fn: UnlistenFn | null = null;

	const is_active = $derived(session.state !== 'finished' && session.state !== 'errored');

	const can_send = $derived(
		prompt_input.trim().length > 0 &&
			!sending &&
			(session.state === 'needs-review' || session.state === 'needs-input'),
	);

	onMount(async () => {
		unlisten_fn = await listen<SessionEventPayload>('session-event', (event) => {
			const { session_id, event: session_event } = event.payload;
			if (session_id !== session.id) {
				return;
			}

			switch (session_event.type) {
				case 'message_delta': {
					current_streaming_text += session_event.text as string;
					break;
				}
				case 'message_complete': {
					if (current_streaming_text) {
						messages = [
							...messages,
							{
								role: 'assistant',
								content: current_streaming_text,
								timestamp: Date.now(),
							},
						];
						current_streaming_text = '';
					}
					break;
				}
				case 'tool_start': {
					messages = [
						...messages,
						{
							role: 'tool',
							content: `Running ${session_event.tool_name as string}...`,
							tool_name: session_event.tool_name as string,
							timestamp: Date.now(),
						},
					];
					break;
				}
				case 'tool_end': {
					const output = session_event.output;
					const content =
						typeof output === 'string' ? output : JSON.stringify(output, null, 2);
					const truncated =
						content.length > 500 ? content.slice(0, 497) + '...' : content;
					messages = [
						...messages,
						{
							role: 'tool',
							content: truncated,
							tool_name: session_event.tool_name as string,
							is_error: session_event.is_error as boolean,
							timestamp: Date.now(),
						},
					];
					break;
				}
				case 'run_state': {
					const state = session_event.state as string;
					if (state === 'failed' || state === 'completed') {
						messages = [
							...messages,
							{
								role: 'system',
								content:
									state === 'failed'
										? `Session errored: ${(session_event.error as string) ?? 'unknown'}`
										: 'Session completed.',
								timestamp: Date.now(),
							},
						];
					}
					break;
				}
				case 'permission_prompt': {
					messages = [
						...messages,
						{
							role: 'system',
							content: `Permission needed: ${session_event.tool_name as string}`,
							timestamp: Date.now(),
						},
					];
					break;
				}
				default:
					break;
			}
		});
	});

	onDestroy(() => {
		unlisten_fn?.();
	});

	async function handle_send() {
		if (!can_send) {
			return;
		}
		const message = prompt_input.trim();
		prompt_input = '';
		sending = true;

		messages = [...messages, { role: 'user', content: message, timestamp: Date.now() }];

		try {
			await send_message(session.id, message);
		} catch (err) {
			messages = [
				...messages,
				{
					role: 'system',
					content: `Failed to send: ${String(err)}`,
					timestamp: Date.now(),
				},
			];
		} finally {
			sending = false;
		}
	}

	async function handle_interrupt() {
		try {
			await interrupt_session(session.id);
		} catch (err) {
			messages = [
				...messages,
				{
					role: 'system',
					content: `Failed to interrupt: ${String(err)}`,
					timestamp: Date.now(),
				},
			];
		}
	}

	function handle_keydown(event: KeyboardEvent) {
		if (event.key === 'Enter' && !event.shiftKey) {
			event.preventDefault();
			handle_send();
		}
	}
</script>

<div class="flex h-full flex-col">
	<!-- Messages -->
	<div class="flex-1 space-y-3 overflow-y-auto p-4">
		{#each messages as message (message.content + message.role)}
			<div
				class="rounded-lg p-3 text-sm {message.role === 'user'
					? 'ml-8 bg-blue-900/30 text-blue-200'
					: message.role === 'tool'
						? 'bg-neutral-800 font-mono text-xs text-neutral-300'
						: message.role === 'system'
							? 'bg-neutral-900 text-center text-xs text-neutral-500'
							: 'mr-8 bg-neutral-800 text-neutral-200'}"
			>
				{#if message.role === 'tool' && message.tool_name !== undefined}
					<div
						class="mb-1 text-xs font-medium {message.is_error === true
							? 'text-red-400'
							: 'text-neutral-500'}"
					>
						{message.tool_name}
						{message.is_error === true ? ' (error)' : ''}
					</div>
				{/if}
				<pre class="whitespace-pre-wrap">{message.content}</pre>
			</div>
		{/each}

		{#if current_streaming_text}
			<div class="mr-8 rounded-lg bg-neutral-800 p-3 text-sm text-neutral-200">
				<pre class="whitespace-pre-wrap">{current_streaming_text}<span class="animate-pulse"
						>|</span
					></pre>
			</div>
		{/if}
	</div>

	<!-- Input bar -->
	<div class="border-t border-neutral-700 p-3">
		<div class="flex items-center gap-2">
			{#if session.state === 'running'}
				<button
					class="shrink-0 rounded-md bg-amber-600 px-3 py-2 text-sm font-medium text-white hover:bg-amber-500"
					onclick={handle_interrupt}
				>
					Interrupt
				</button>
			{/if}

			<input
				type="text"
				class="flex-1 rounded-md border border-neutral-600 bg-neutral-800 px-3 py-2 text-sm text-neutral-200 placeholder-neutral-500 focus:border-blue-500 focus:outline-none"
				placeholder={is_active ? 'Send a message...' : 'Session ended'}
				bind:value={prompt_input}
				onkeydown={handle_keydown}
				disabled={!is_active}
			/>

			<button
				class="shrink-0 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-50"
				onclick={handle_send}
				disabled={!can_send}
			>
				Send
			</button>
		</div>
	</div>
</div>
