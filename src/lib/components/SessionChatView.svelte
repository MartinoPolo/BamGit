<script lang="ts">
	import type { Session, SessionEventPayload } from '$lib/types/generated';
	import { useSessions } from '$lib/modules/sessions';
	import { listen, type UnlistenFn } from '$lib/tauri.js';
	import { onMount, onDestroy } from 'svelte';

	interface Props {
		session: Session;
	}

	interface ChatMessage {
		id: number;
		role: 'user' | 'assistant' | 'tool' | 'system';
		content: string;
		tool_name?: string;
		is_error?: boolean;
	}

	let { session }: Props = $props();

	const sessionStore = useSessions();

	let nextMessageId = 0;
	function createMessage(fields: Omit<ChatMessage, 'id'>): ChatMessage {
		return { id: nextMessageId++, ...fields };
	}

	let messages = $state<ChatMessage[]>([]);
	let currentStreamingText = $state('');
	let promptInput = $state('');
	let sending = $state(false);
	let unlistenFn: UnlistenFn | null = null;

	const isActive = $derived(session.state !== 'finished' && session.state !== 'errored');

	const canSend = $derived(
		promptInput.trim().length > 0 &&
			!sending &&
			(session.state === 'needs-review' || session.state === 'needs-input'),
	);

	function appendMessage(message: ChatMessage) {
		messages = [...messages, message];
	}

	function handleMessageDelta(event: Record<string, unknown>) {
		currentStreamingText += event.text as string;
	}

	function handleMessageComplete() {
		if (currentStreamingText) {
			appendMessage(createMessage({ role: 'assistant', content: currentStreamingText }));
			currentStreamingText = '';
		}
	}

	function handleToolStart(event: Record<string, unknown>) {
		appendMessage(
			createMessage({
				role: 'tool',
				content: `Running ${event.tool_name as string}...`,
				tool_name: event.tool_name as string,
			}),
		);
	}

	function handleToolEnd(event: Record<string, unknown>) {
		const output = event.output;
		const content = typeof output === 'string' ? output : JSON.stringify(output, null, 2);
		const truncated = content.length > 500 ? content.slice(0, 497) + '...' : content;
		appendMessage(
			createMessage({
				role: 'tool',
				content: truncated,
				tool_name: event.tool_name as string,
				is_error: event.is_error as boolean,
			}),
		);
	}

	function handleRunState(event: Record<string, unknown>) {
		const state = event.state as string;
		if (state === 'failed' || state === 'completed') {
			appendMessage(
				createMessage({
					role: 'system',
					content:
						state === 'failed'
							? `Session errored: ${(event.error as string) ?? 'unknown'}`
							: 'Session completed.',
				}),
			);
		}
	}

	function handlePermissionPrompt(event: Record<string, unknown>) {
		appendMessage(
			createMessage({
				role: 'system',
				content: `Permission needed: ${event.tool_name as string}`,
			}),
		);
	}

	const SESSION_EVENT_HANDLERS: Record<string, (event: Record<string, unknown>) => void> = {
		message_delta: handleMessageDelta,
		message_complete: handleMessageComplete,
		tool_start: handleToolStart,
		tool_end: handleToolEnd,
		run_state: handleRunState,
		permission_prompt: handlePermissionPrompt,
	};

	onMount(async () => {
		unlistenFn = await listen<SessionEventPayload>('session-event', (event) => {
			const { session_id: sessionId, event: sessionEvent } = event.payload;
			if (sessionId !== session.id) {
				return;
			}

			SESSION_EVENT_HANDLERS[sessionEvent.type]?.(sessionEvent);
		});
	});

	onDestroy(() => {
		unlistenFn?.();
	});

	async function handleSend() {
		if (!canSend) {
			return;
		}
		const message = promptInput.trim();
		promptInput = '';
		sending = true;

		messages = [...messages, createMessage({ role: 'user', content: message })];

		try {
			await sessionStore.sendMessage(session.id, message);
		} catch (err) {
			messages = [
				...messages,
				createMessage({ role: 'system', content: `Failed to send: ${String(err)}` }),
			];
		} finally {
			sending = false;
		}
	}

	async function handleInterrupt() {
		try {
			await sessionStore.interruptSession(session.id);
		} catch (err) {
			messages = [
				...messages,
				createMessage({ role: 'system', content: `Failed to interrupt: ${String(err)}` }),
			];
		}
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Enter' && !event.shiftKey) {
			event.preventDefault();
			handleSend();
		}
	}
</script>

<div class="flex h-full flex-col">
	<!-- Messages -->
	<div class="flex-1 space-y-3 overflow-y-auto p-4">
		{#each messages as message (message.id)}
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

		{#if currentStreamingText}
			<div class="mr-8 rounded-lg bg-muted p-3 text-sm text-foreground">
				<pre class="whitespace-pre-wrap">{currentStreamingText}<span class="animate-pulse"
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
					onclick={handleInterrupt}
				>
					Interrupt
				</button>
			{/if}

			<input
				type="text"
				class="flex-1 rounded-md border border-input bg-muted px-3 py-2 text-sm text-foreground placeholder-muted-foreground focus:border-ring focus:outline-none"
				placeholder={isActive ? 'Send a message...' : 'Session ended'}
				bind:value={promptInput}
				onkeydown={handleKeydown}
				disabled={!isActive}
			/>

			<button
				class="shrink-0 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
				onclick={handleSend}
				disabled={!canSend}
			>
				Send
			</button>
		</div>
	</div>
</div>
