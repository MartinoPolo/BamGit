import { describe, it, expect } from 'vitest';
import {
	shouldAutoScroll,
	shouldShowJumpToLatestResponse,
	shouldShowJumpToLatestPrompt,
	findLastMessageIndex,
} from './scroll_anchoring.js';
import type { ChatMessage } from './chat_message_types.js';

function makeMessage(role: ChatMessage['role']): ChatMessage {
	return {
		id: `msg_${Math.random().toString(36).slice(2, 8)}`,
		role,
		content: 'test',
		timestamp: Date.now(),
	};
}

describe('shouldAutoScroll', () => {
	it('returns true when near bottom (within threshold)', () => {
		expect(shouldAutoScroll({ scrollTop: 860, scrollHeight: 1000, clientHeight: 100 })).toBe(
			true,
		);
	});

	it('returns true when exactly at bottom', () => {
		expect(shouldAutoScroll({ scrollTop: 900, scrollHeight: 1000, clientHeight: 100 })).toBe(
			true,
		);
	});

	it('returns false when user scrolled up beyond threshold', () => {
		expect(shouldAutoScroll({ scrollTop: 500, scrollHeight: 1000, clientHeight: 100 })).toBe(
			false,
		);
	});

	it('returns true for small content that fits in viewport', () => {
		expect(shouldAutoScroll({ scrollTop: 0, scrollHeight: 100, clientHeight: 200 })).toBe(true);
	});
});

describe('shouldShowJumpToLatestResponse', () => {
	it('returns false when at bottom', () => {
		const messages = [makeMessage('user'), makeMessage('assistant')];
		expect(
			shouldShowJumpToLatestResponse(messages, {
				scrollTop: 900,
				scrollHeight: 1000,
				clientHeight: 100,
			}),
		).toBe(false);
	});

	it('returns true when scrolled up and there are assistant messages', () => {
		const messages = [makeMessage('user'), makeMessage('assistant')];
		expect(
			shouldShowJumpToLatestResponse(messages, {
				scrollTop: 100,
				scrollHeight: 1000,
				clientHeight: 100,
			}),
		).toBe(true);
	});

	it('returns false when no assistant messages exist', () => {
		const messages = [makeMessage('user')];
		expect(
			shouldShowJumpToLatestResponse(messages, {
				scrollTop: 100,
				scrollHeight: 1000,
				clientHeight: 100,
			}),
		).toBe(false);
	});
});

describe('shouldShowJumpToLatestPrompt', () => {
	it('returns false when at bottom', () => {
		const messages = [makeMessage('user'), makeMessage('assistant')];
		expect(
			shouldShowJumpToLatestPrompt(messages, {
				scrollTop: 900,
				scrollHeight: 1000,
				clientHeight: 100,
			}),
		).toBe(false);
	});

	it('returns true when scrolled up and there are user messages', () => {
		const messages = [makeMessage('user'), makeMessage('assistant')];
		expect(
			shouldShowJumpToLatestPrompt(messages, {
				scrollTop: 100,
				scrollHeight: 1000,
				clientHeight: 100,
			}),
		).toBe(true);
	});

	it('returns false when no user messages exist', () => {
		const messages = [makeMessage('assistant')];
		expect(
			shouldShowJumpToLatestPrompt(messages, {
				scrollTop: 100,
				scrollHeight: 1000,
				clientHeight: 100,
			}),
		).toBe(false);
	});
});

describe('findLastMessageIndex', () => {
	it('returns index of last user message', () => {
		const messages = [
			makeMessage('user'),
			makeMessage('assistant'),
			makeMessage('user'),
			makeMessage('assistant'),
		];
		expect(findLastMessageIndex(messages, 'user')).toBe(2);
	});

	it('returns index of last assistant message', () => {
		const messages = [
			makeMessage('user'),
			makeMessage('assistant'),
			makeMessage('user'),
			makeMessage('assistant'),
		];
		expect(findLastMessageIndex(messages, 'assistant')).toBe(3);
	});

	it('returns -1 when no messages of that role exist', () => {
		const messages = [makeMessage('assistant')];
		expect(findLastMessageIndex(messages, 'user')).toBe(-1);
	});

	it('returns -1 for empty array', () => {
		expect(findLastMessageIndex([], 'user')).toBe(-1);
	});
});
