import { describe, it, expect } from 'vitest';
import type { SessionEvent } from '$lib/types/generated';
import type { ChatMessage } from './chat_message_types.js';
import { buildChatMessage, groupMessagesIntoTurns } from './chat_message_builder.js';

describe('buildChatMessage', () => {
	it('creates assistant message from message_complete event', () => {
		const event: SessionEvent = {
			type: 'message_complete',
			text: 'Hello world',
			message_id: 'msg_1',
		};
		const message = buildChatMessage(event);
		expect(message).not.toBeNull();
		expect(message!.role).toBe('assistant');
		expect(message!.content).toBe('Hello world');
		expect(message!.messageId).toBe('msg_1');
	});

	it('creates tool message from tool_start event', () => {
		// fallow-ignore-next-line code-duplication
		const event: SessionEvent = {
			type: 'tool_start',
			tool_use_id: 'tu_1',
			tool_name: 'Read',
			input: { file_path: 'src/main.rs' },
		};
		const message = buildChatMessage(event);
		expect(message).not.toBeNull();
		expect(message!.role).toBe('tool');
		expect(message!.toolName).toBe('Read');
		expect(message!.toolUseId).toBe('tu_1');
		expect(message!.toolStatus).toBe('running');
		expect(message!.toolInput).toEqual({ file_path: 'src/main.rs' });
	});

	it('creates tool message from tool_end event', () => {
		// fallow-ignore-next-line code-duplication
		const event: SessionEvent = {
			type: 'tool_end',
			tool_use_id: 'tu_1',
			tool_name: 'Read',
			output: 'file contents here',
			is_error: false,
		};
		const message = buildChatMessage(event);
		expect(message).not.toBeNull();
		expect(message!.role).toBe('tool');
		expect(message!.toolName).toBe('Read');
		expect(message!.toolStatus).toBe('success');
		expect(message!.toolOutput).toBe('file contents here');
		expect(message!.isError).toBe(false);
	});

	it('creates error tool message from tool_end with is_error true', () => {
		const event: SessionEvent = {
			type: 'tool_end',
			tool_use_id: 'tu_2',
			tool_name: 'Bash',
			output: 'command not found',
			is_error: true,
		};
		const message = buildChatMessage(event);
		expect(message!.toolStatus).toBe('error');
		expect(message!.isError).toBe(true);
	});

	it('creates system message from run_state with failed', () => {
		// fallow-ignore-next-line code-duplication
		const event: SessionEvent = {
			type: 'run_state',
			state: 'failed',
			error: 'segfault',
		};
		const message = buildChatMessage(event);
		expect(message).not.toBeNull();
		expect(message!.role).toBe('system');
		expect(message!.content).toBeTruthy();
	});

	it('creates system message from run_state with completed', () => {
		const event: SessionEvent = {
			type: 'run_state',
			state: 'completed',
			error: null,
		};
		const message = buildChatMessage(event);
		expect(message).not.toBeNull();
		expect(message!.role).toBe('system');
	});

	it('returns null for run_state with running (not a chat message)', () => {
		const event: SessionEvent = {
			type: 'run_state',
			state: 'running',
			error: null,
		};
		expect(buildChatMessage(event)).toBeNull();
	});

	it('returns null for message_delta (streaming, not a full message)', () => {
		const event: SessionEvent = { type: 'message_delta', text: 'partial' };
		expect(buildChatMessage(event)).toBeNull();
	});

	it('returns null for usage_update (metadata, not a chat message)', () => {
		const event: SessionEvent = {
			type: 'usage_update',
			input_tokens: 100,
			output_tokens: 50,
			cache_read_tokens: 0,
			cache_write_tokens: 0,
			cost_usd: 0.01,
			duration_ms: null,
			num_turns: null,
		};
		expect(buildChatMessage(event)).toBeNull();
	});

	it('creates tool message with permission interactionType from permission_prompt', () => {
		// fallow-ignore-next-line code-duplication
		const event: SessionEvent = {
			type: 'permission_prompt',
			request_id: 'req_1',
			tool_name: 'Bash',
			tool_input: { command: 'rm -rf /' },
		};
		const message = buildChatMessage(event);
		expect(message).not.toBeNull();
		expect(message!.role).toBe('tool');
		expect(message!.interactionType).toBe('permission');
		expect(message!.toolName).toBe('Bash');
		expect(message!.requestId).toBe('req_1');
	});

	it('creates system message from system_status', () => {
		const event: SessionEvent = {
			type: 'system_status',
			status: 'Session paused',
		};
		const message = buildChatMessage(event);
		expect(message).not.toBeNull();
		expect(message!.role).toBe('system');
		expect(message!.content).toBe('Session paused');
	});
});

describe('groupMessagesIntoTurns', () => {
	function makeMessage(
		overrides: Partial<ChatMessage> & { role: ChatMessage['role'] },
	): ChatMessage {
		return {
			id: `msg_${Math.random().toString(36).slice(2, 8)}`,
			content: '',
			timestamp: Date.now(),
			...overrides,
		};
	}

	it('groups user → assistant + tools into one turn', () => {
		const messages: ChatMessage[] = [
			makeMessage({ role: 'user', content: 'Hello' }),
			makeMessage({ role: 'assistant', content: 'Hi there' }),
			makeMessage({ role: 'tool', toolName: 'Read' }),
			makeMessage({ role: 'assistant', content: 'Done reading' }),
		];
		const turns = groupMessagesIntoTurns(messages);
		expect(turns).toHaveLength(1);
		expect(turns[0].userMessage?.content).toBe('Hello');
		expect(turns[0].assistantMessages).toHaveLength(2);
		expect(turns[0].toolMessages).toHaveLength(1);
	});

	it('starts new turn on each user message', () => {
		const messages: ChatMessage[] = [
			makeMessage({ role: 'user', content: 'First' }),
			makeMessage({ role: 'assistant', content: 'Reply 1' }),
			makeMessage({ role: 'user', content: 'Second' }),
			makeMessage({ role: 'assistant', content: 'Reply 2' }),
		];
		const turns = groupMessagesIntoTurns(messages);
		expect(turns).toHaveLength(2);
		expect(turns[0].userMessage?.content).toBe('First');
		expect(turns[1].userMessage?.content).toBe('Second');
	});

	it('handles first turn with no user message (system/assistant only)', () => {
		const messages: ChatMessage[] = [
			makeMessage({ role: 'system', content: 'Session started' }),
			makeMessage({ role: 'assistant', content: 'Ready' }),
		];
		const turns = groupMessagesIntoTurns(messages);
		expect(turns).toHaveLength(1);
		expect(turns[0].userMessage).toBeNull();
		expect(turns[0].systemMessages).toHaveLength(1);
		expect(turns[0].assistantMessages).toHaveLength(1);
	});

	it('returns empty array for empty input', () => {
		expect(groupMessagesIntoTurns([])).toHaveLength(0);
	});

	it('handles multiple system messages across turns', () => {
		const messages: ChatMessage[] = [
			makeMessage({ role: 'system', content: 'Session started' }),
			makeMessage({ role: 'user', content: 'Do something' }),
			makeMessage({ role: 'assistant', content: 'OK' }),
			makeMessage({ role: 'system', content: 'Session completed' }),
		];
		const turns = groupMessagesIntoTurns(messages);
		expect(turns).toHaveLength(2);
		expect(turns[0].systemMessages).toHaveLength(1);
		expect(turns[0].systemMessages[0].content).toBe('Session started');
		expect(turns[1].userMessage?.content).toBe('Do something');
		expect(turns[1].systemMessages).toHaveLength(1);
		expect(turns[1].systemMessages[0].content).toBe('Session completed');
	});

	it('assigns unique ids to each turn', () => {
		const messages: ChatMessage[] = [
			makeMessage({ role: 'user', content: 'A' }),
			makeMessage({ role: 'user', content: 'B' }),
		];
		const turns = groupMessagesIntoTurns(messages);
		expect(turns[0].id).not.toBe(turns[1].id);
	});
});
