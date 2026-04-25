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

	function append_message(message: ChatMessage) {
		messages = [...messages, message];
	}

	function handle_message_delta(event: Record<string, unknown>) {
		current_streaming_text += event.text as string;
	}

	function handle_message_complete() {
		if (current_streaming_text) {
			append_message({
				role: 'assistant',
				content: current_streaming_text,
				timestamp: Date.now(),
			});
			current_streaming_text = '';
		}
	}

	function handle_tool_start(event: Record<string, unknown>) {
		append_message({
			role: 'tool',
			content: `Running ${event.tool_name as string}...`,
			tool_name: event.tool_name as string,
			timestamp: Date.now(),
		});
	}

	function handle_tool_end(event: Record<string, unknown>) {
		const output = event.output;
		const content = typeof output === 'string' ? output : JSON.stringify(output, null, 2);
		const truncated = content.length > 500 ? content.slice(0, 497) + '...' : content;
		append_message({
			role: 'tool',
			content: truncated,
			tool_name: event.tool_name as string,
			is_error: event.is_error as boolean,
			timestamp: Date.now(),
		});
	}

	function handle_run_state(event: Record<string, unknown>) {
		const state = event.state as string;
		if (state === 'failed' || state === 'completed') {
			append_message({
				role: 'system',
				content:
					state === 'failed'
						? `Session errored: ${(event.error as string) ?? 'unknown'}`
						: 'Session completed.',
				timestamp: Date.now(),
			});
		}
	}

	function handle_permission_prompt(event: Record<string, unknown>) {
		append_message({
			role: 'system',
			content: `Permission needed: ${event.tool_name as string}`,
			timestamp: Date.now(),
		});
	}

	const SESSION_EVENT_HANDLERS: Record<string, (event: Record<string, unknown>) => void> = {
		message_delta: handle_message_delta,
		message_complete: handle_message_complete,
		tool_start: handle_tool_start,
		tool_end: handle_tool_end,
		run_state: handle_run_state,
		permission_prompt: handle_permission_prompt,
	};

	onMount(async () => {
		unlisten_fn = await listen<SessionEventPayload>('session-event', (event) => {
			const { session_id, event: session_event } = event.payload;
			if (session_id !== session.id) {
				return;
			}

			SESSION_EVENT_HANDLERS[session_event.type]?.(session_event);
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
					? 'ml-8 bg-primary/10 text-primary'
					: message.role === 'tool'
						? 'bg-muted font-mono text-xs text-foreground'
						: message.role === 'system'
							? 'bg-card text-center text-xs text-muted-foreground'
							: 'mr-8 bg-muted text-foreground'}"
			>
				{#if message.role === 'tool' && message.tool_name !== undefined}
					<div
						class="mb-1 text-xs font-medium {message.is_error === true
							? 'text-destructive'
							: 'text-muted-foreground'}"
					>
						{message.tool_name}
						{message.is_error === true ? ' (error)' : ''}
					</div>
				{/if}
				<pre class="whitespace-pre-wrap">{message.content}</pre>
			</div>
		{/each}

		{#if current_streaming_text}
			<div class="mr-8 rounded-lg bg-muted p-3 text-sm text-foreground">
				<pre class="whitespace-pre-wrap">{current_streaming_text}<span class="animate-pulse"
						>|</span
					></pre>
			</div>
		{/if}
	</div>

	<!-- Input bar -->
	<div class="border-t border-border p-3">
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
				class="flex-1 rounded-md border border-input bg-muted px-3 py-2 text-sm text-foreground placeholder-muted-foreground focus:border-ring focus:outline-none"
				placeholder={is_active ? 'Send a message...' : 'Session ended'}
				bind:value={prompt_input}
				onkeydown={handle_keydown}
				disabled={!is_active}
			/>

			<button
				class="shrink-0 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
				onclick={handle_send}
				disabled={!can_send}
			>
				Send
			</button>
		</div>
	</div>
</div>
