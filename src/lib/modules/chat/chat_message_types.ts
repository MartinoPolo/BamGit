import type { JsonValue } from '$lib/types/generated/serde_json/JsonValue';

export const MESSAGE_ROLE = {
	user: 'user',
	assistant: 'assistant',
	tool: 'tool',
	system: 'system',
} as const;

export type MessageRole = (typeof MESSAGE_ROLE)[keyof typeof MESSAGE_ROLE];

export const TOOL_STATUS = {
	running: 'running',
	success: 'success',
	error: 'error',
} as const;

export type ToolStatus = (typeof TOOL_STATUS)[keyof typeof TOOL_STATUS];

export const INTERACTION_TYPE = {
	permission: 'permission',
	elicitation: 'elicitation',
	askUser: 'ask-user',
} as const;

export type InteractionType = (typeof INTERACTION_TYPE)[keyof typeof INTERACTION_TYPE];

export interface ChatMessage {
	id: string;
	role: MessageRole;
	content: string;
	timestamp: number;
	toolName?: string;
	toolUseId?: string;
	toolStatus?: ToolStatus;
	toolInput?: JsonValue;
	toolOutput?: JsonValue;
	isError?: boolean;
	messageId?: string;
	interactionType?: InteractionType;
	requestId?: string;
}

export interface ChatTurn {
	id: string;
	userMessage: ChatMessage | null;
	assistantMessages: ChatMessage[];
	toolMessages: ChatMessage[];
	systemMessages: ChatMessage[];
}
