import type { SessionEvent } from '$lib/types/generated';
import * as m from '$lib/paraglide/messages.js';
import {
	MESSAGE_ROLE,
	TOOL_STATUS,
	INTERACTION_TYPE,
	type ChatMessage,
	type ChatTurn,
} from './chat_message_types.js';

let nextId = 0;

function generateId(): string {
	return `chat_${Date.now()}_${nextId++}`;
}

// fallow-ignore-next-line complexity
export function buildChatMessage(event: SessionEvent): ChatMessage | null {
	const timestamp = Date.now();

	switch (event.type) {
		case 'message_complete':
			return {
				id: generateId(),
				role: MESSAGE_ROLE.assistant,
				content: event.text,
				timestamp,
				messageId: event.message_id,
			};

		case 'tool_start':
			return {
				id: generateId(),
				role: MESSAGE_ROLE.tool,
				content: '',
				timestamp,
				toolName: event.tool_name,
				toolUseId: event.tool_use_id,
				toolStatus: TOOL_STATUS.running,
				toolInput: event.input,
			};

		case 'tool_end':
			return {
				id: generateId(),
				role: MESSAGE_ROLE.tool,
				content: '',
				timestamp,
				toolName: event.tool_name,
				toolUseId: event.tool_use_id,
				toolStatus: event.is_error ? TOOL_STATUS.error : TOOL_STATUS.success,
				toolOutput: event.output,
				isError: event.is_error,
			};

		case 'run_state': {
			if (event.state === 'failed') {
				return {
					id: generateId(),
					role: MESSAGE_ROLE.system,
					content: m.chat_session_errored({ error: event.error ?? 'unknown' }),
					timestamp,
				};
			}
			if (event.state === 'completed') {
				return {
					id: generateId(),
					role: MESSAGE_ROLE.system,
					content: m.chat_session_completed(),
					timestamp,
				};
			}
			return null;
		}

		case 'permission_prompt':
			return {
				id: generateId(),
				role: MESSAGE_ROLE.tool,
				content: m.chat_permission_needed({ toolName: event.tool_name }),
				timestamp,
				toolName: event.tool_name,
				toolInput: event.tool_input,
				toolStatus: TOOL_STATUS.running,
				interactionType: INTERACTION_TYPE.permission,
				requestId: event.request_id,
			};

		case 'elicitation_prompt':
			return {
				id: generateId(),
				role: MESSAGE_ROLE.tool,
				content: event.message,
				timestamp,
				toolStatus: TOOL_STATUS.running,
				interactionType: INTERACTION_TYPE.elicitation,
				requestId: event.request_id,
			};

		case 'system_status':
			return {
				id: generateId(),
				role: MESSAGE_ROLE.system,
				content: event.status,
				timestamp,
			};

		case 'message_delta':
		case 'thinking_delta':
		case 'usage_update':
		case 'tool_progress':
		case 'tool_use_summary':
		case 'compact_boundary':
		case 'control_cancelled':
		case 'raw':
		case 'session_init':
			return null;
	}
}

function createEmptyTurn(): ChatTurn {
	return {
		id: generateId(),
		userMessage: null,
		assistantMessages: [],
		toolMessages: [],
		systemMessages: [],
	};
}

export function groupMessagesIntoTurns(messages: readonly ChatMessage[]): ChatTurn[] {
	if (messages.length === 0) {
		return [];
	}

	const turns: ChatTurn[] = [];
	let currentTurn = createEmptyTurn();

	for (const message of messages) {
		if (message.role === MESSAGE_ROLE.user) {
			if (
				currentTurn.userMessage !== null ||
				currentTurn.assistantMessages.length > 0 ||
				currentTurn.systemMessages.length > 0 ||
				currentTurn.toolMessages.length > 0
			) {
				turns.push(currentTurn);
				currentTurn = createEmptyTurn();
			}
			currentTurn.userMessage = message;
		} else if (message.role === MESSAGE_ROLE.assistant) {
			currentTurn.assistantMessages.push(message);
		} else if (message.role === MESSAGE_ROLE.tool) {
			currentTurn.toolMessages.push(message);
		} else if (message.role === MESSAGE_ROLE.system) {
			currentTurn.systemMessages.push(message);
		}
	}

	turns.push(currentTurn);
	return turns;
}
