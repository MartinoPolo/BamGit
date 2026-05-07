<script lang="ts">
	import type { Session, SessionEventPayload } from '$lib/types/generated';
	import { useSessions } from '$lib/modules/sessions';
	import {
		buildChatMessage,
		groupMessagesIntoTurns,
		shouldAutoScroll,
		shouldShowJumpToLatestResponse,
		shouldShowJumpToLatestPrompt,
		findLastMessageIndex,
		MESSAGE_ROLE,
		type ChatMessage,
		type ScrollPosition,
	} from '$lib/modules/chat/index.js';
	import { listen, type UnlistenFn } from '$lib/tauri.js';
	import { onMount, onDestroy, tick } from 'svelte';
	import {
		ChatMessage as ChatMessageComponent,
		ContentDimmer,
		QuickNavButtons,
		AssistantMessage,
	} from '$lib/components/chat/index.js';
	import SessionTopBar from '$lib/components/session/SessionTopBar.svelte';
	import SessionSidebar from '$lib/components/session/SessionSidebar.svelte';
	import FloatingInputPanel from '$lib/components/session/FloatingInputPanel.svelte';

	interface Props {
		session: Session;
	}

	let { session }: Props = $props();

	const sessionStore = useSessions();

	let nextMessageId = 0;
	function generateMessageId(): string {
		return `local_${nextMessageId++}`;
	}

	let messages = $state<ChatMessage[]>([]);
	let currentStreamingText = $state('');
	let promptInput = $state('');
	let sending = $state(false);
	let unlistenFn: UnlistenFn | null = null;
	let scrollContainer: HTMLDivElement | undefined = $state();
	let scrollPosition = $state<ScrollPosition>({ scrollTop: 0, scrollHeight: 0, clientHeight: 0 });

	const isActive = $derived(session.state !== 'finished' && session.state !== 'errored');

	const canSend = $derived(
		promptInput.trim().length > 0 &&
			!sending &&
			(session.state === 'needs-review' || session.state === 'needs-input'),
	);

	const turns = $derived(groupMessagesIntoTurns(messages));

	const lastUserMessageTurnIndex = $derived.by(() => {
		for (let i = turns.length - 1; i >= 0; i--) {
			if (turns[i].userMessage !== null) {
				return i;
			}
		}
		return -1;
	});

	const showJumpToResponse = $derived(shouldShowJumpToLatestResponse(messages, scrollPosition));
	const showJumpToPrompt = $derived(shouldShowJumpToLatestPrompt(messages, scrollPosition));

	function appendMessage(message: ChatMessage) {
		messages = [...messages, message];
	}

	function handleSessionEvent(sessionEvent: SessionEventPayload['event']) {
		if (sessionEvent.type === 'message_delta') {
			currentStreamingText += sessionEvent.text;
			return;
		}

		if (sessionEvent.type === 'message_complete') {
			currentStreamingText = '';
		}

		const chatMessage = buildChatMessage(sessionEvent);
		if (chatMessage !== null) {
			appendMessage(chatMessage);
		}
	}

	function updateScrollPosition() {
		if (scrollContainer === undefined) {
			return;
		}
		scrollPosition = {
			scrollTop: scrollContainer.scrollTop,
			scrollHeight: scrollContainer.scrollHeight,
			clientHeight: scrollContainer.clientHeight,
		};
	}

	async function scrollToBottom() {
		await tick();
		if (scrollContainer !== undefined) {
			scrollContainer.scrollTop = scrollContainer.scrollHeight;
		}
	}

	function scrollToLastMessage(role: ChatMessage['role']) {
		const index = findLastMessageIndex(messages, role);
		if (index === -1 || scrollContainer === undefined) {
			return;
		}
		const target = scrollContainer.querySelector(`[data-message-index="${index}"]`);
		if (target instanceof HTMLElement) {
			target.scrollIntoView({ behavior: 'smooth', block: 'start' });
		}
	}

	$effect(() => {
		if (messages.length > 0 || currentStreamingText) {
			if (shouldAutoScroll(scrollPosition)) {
				void scrollToBottom();
			}
		}
	});

	onMount(async () => {
		unlistenFn = await listen<SessionEventPayload>('session-event', (event) => {
			const { session_id: sessionId, event: sessionEvent } = event.payload;
			if (sessionId !== session.id) {
				return;
			}
			handleSessionEvent(sessionEvent);
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

		appendMessage({
			id: generateMessageId(),
			role: MESSAGE_ROLE.user,
			content: message,
			timestamp: Date.now(),
		});

		try {
			await sessionStore.sendMessage(session.id, message);
		} catch (err) {
			appendMessage({
				id: generateMessageId(),
				role: MESSAGE_ROLE.system,
				content: `Failed to send: ${String(err)}`,
				timestamp: Date.now(),
			});
		} finally {
			sending = false;
		}
	}

	async function handleInterrupt() {
		try {
			await sessionStore.interruptSession(session.id);
		} catch (err) {
			appendMessage({
				id: generateMessageId(),
				role: MESSAGE_ROLE.system,
				content: `Failed to interrupt: ${String(err)}`,
				timestamp: Date.now(),
			});
		}
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Enter' && !event.shiftKey) {
			event.preventDefault();
			handleSend();
		}
	}
</script>

<div class="flex h-full flex-col overflow-hidden">
	<!-- Top bar -->
	<SessionTopBar {session} />

	<div class="flex flex-1 overflow-hidden">
		<!-- Chat column -->
		<div class="relative flex flex-1 flex-col overflow-hidden">
			<!-- Message stream -->
			<div
				class="relative flex-1 overflow-y-auto"
				bind:this={scrollContainer}
				onscroll={updateScrollPosition}
			>
				<div class="mx-auto max-w-[900px] px-6 pb-36 pt-4">
					<div class="flex flex-col gap-2.5">
						{#each turns as turn, turnIndex (turn.id)}
							{@const isDimmed =
								lastUserMessageTurnIndex > 0 &&
								turnIndex < lastUserMessageTurnIndex}
							<ContentDimmer dimmed={isDimmed}>
								{#each turn.systemMessages as sysMsg (sysMsg.id)}
									<div data-message-index={messages.indexOf(sysMsg)}>
										<ChatMessageComponent message={sysMsg} />
									</div>
								{/each}
								{#if turn.userMessage !== null}
									<div data-message-index={messages.indexOf(turn.userMessage)}>
										<ChatMessageComponent message={turn.userMessage} />
									</div>
								{/if}
								{#each turn.assistantMessages as assistantMsg, assistantIndex (assistantMsg.id)}
									<div data-message-index={messages.indexOf(assistantMsg)}>
										<ChatMessageComponent message={assistantMsg} />
									</div>
									{@const toolsBefore = turn.toolMessages.filter(
										(t) =>
											t.timestamp >= assistantMsg.timestamp &&
											(assistantIndex + 1 >= turn.assistantMessages.length ||
												t.timestamp <
													turn.assistantMessages[assistantIndex + 1]
														.timestamp),
									)}
									{#each toolsBefore as toolMsg (toolMsg.id)}
										<div data-message-index={messages.indexOf(toolMsg)}>
											<ChatMessageComponent message={toolMsg} />
										</div>
									{/each}
								{/each}
								{#if turn.assistantMessages.length === 0}
									{#each turn.toolMessages as toolMsg (toolMsg.id)}
										<div data-message-index={messages.indexOf(toolMsg)}>
											<ChatMessageComponent message={toolMsg} />
										</div>
									{/each}
								{/if}
							</ContentDimmer>
						{/each}

						<!-- Streaming text -->
						{#if currentStreamingText}
							<div>
								<AssistantMessage content={currentStreamingText} streaming={true} />
							</div>
						{/if}
					</div>
				</div>

				<!-- Quick nav buttons -->
				<QuickNavButtons
					{showJumpToPrompt}
					{showJumpToResponse}
					onJumpToPrompt={() => scrollToLastMessage('user')}
					onJumpToResponse={() => scrollToLastMessage('assistant')}
				/>

				<!-- Gradient fade -->
				<div
					class="pointer-events-none sticky bottom-0 -mt-[120px] h-[120px] bg-gradient-to-b from-transparent to-background"
				></div>
			</div>

			<!-- Floating input panel -->
			<FloatingInputPanel
				{session}
				bind:value={promptInput}
				disabled={!isActive}
				onSend={handleSend}
				onStop={handleInterrupt}
				onKeydown={handleKeydown}
			/>
		</div>

		<!-- Right sidebar -->
		<SessionSidebar {session} contextPercent={54} quota5hPercent={42} quota7dPercent={18} />
	</div>
</div>
