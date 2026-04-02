export type SessionState =
	| 'running'
	| 'needs-input'
	| 'needs-review'
	| 'paused'
	| 'finished'
	| 'errored';

export interface Session {
	id: string;
	issue_id: string | null;
	provider: string;
	state: SessionState;
	pid: number | null;
	session_file_path: string | null;
	started_at: string;
	ended_at: string | null;
	cost_usd: number | null;
	token_count: number | null;
	original_intent: string | null;
	last_prompt: string | null;
	last_response_summary: string | null;
}

export interface SpawnSessionRequest {
	prompt: string;
	working_directory: string;
	issue_id?: string | null;
	permission_mode?: string | null;
	model?: string | null;
}

export type SessionEventType =
	| 'session_init'
	| 'message_delta'
	| 'message_complete'
	| 'thinking_delta'
	| 'tool_start'
	| 'tool_end'
	| 'tool_progress'
	| 'tool_use_summary'
	| 'run_state'
	| 'usage_update'
	| 'permission_prompt'
	| 'elicitation_prompt'
	| 'compact_boundary'
	| 'system_status'
	| 'control_cancelled'
	| 'raw';

export interface SessionEventPayload {
	session_id: string;
	event: {
		type: SessionEventType;
		[key: string]: unknown;
	};
}
