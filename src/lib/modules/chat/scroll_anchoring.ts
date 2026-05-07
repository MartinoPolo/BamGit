import type { ChatMessage, MessageRole } from './chat_message_types.js';

const AUTO_SCROLL_THRESHOLD = 150;

export interface ScrollPosition {
	scrollTop: number;
	scrollHeight: number;
	clientHeight: number;
}

function isNearBottom(position: ScrollPosition): boolean {
	const distanceFromBottom = position.scrollHeight - position.scrollTop - position.clientHeight;
	return distanceFromBottom <= AUTO_SCROLL_THRESHOLD;
}

export function shouldAutoScroll(position: ScrollPosition): boolean {
	if (position.scrollHeight <= position.clientHeight) {
		return true;
	}
	return isNearBottom(position);
}

export function shouldShowJumpToLatestResponse(
	messages: readonly ChatMessage[],
	position: ScrollPosition,
): boolean {
	if (isNearBottom(position)) {
		return false;
	}
	return findLastMessageIndex(messages, 'assistant') !== -1;
}

export function shouldShowJumpToLatestPrompt(
	messages: readonly ChatMessage[],
	position: ScrollPosition,
): boolean {
	if (isNearBottom(position)) {
		return false;
	}
	return findLastMessageIndex(messages, 'user') !== -1;
}

export function findLastMessageIndex(messages: readonly ChatMessage[], role: MessageRole): number {
	for (let i = messages.length - 1; i >= 0; i--) {
		if (messages[i].role === role) {
			return i;
		}
	}
	return -1;
}
