export type SessionState =
	| 'running'
	| 'needs-input'
	| 'needs-review'
	| 'paused'
	| 'finished'
	| 'errored';

export type ExecutionPhase =
	| 'none'
	| 'analyzing'
	| 'tdd'
	| 'reviewing'
	| 'verifying'
	| 'committing';

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
	execution_phase: ExecutionPhase;
	source: 'spawned' | 'adopted';
	working_directory: string | null;
}

export interface SpawnSessionRequest {
	prompt: string;
	working_directory: string;
	issue_id?: string | null;
	permission_mode?: string | null;
	model?: string | null;
}

export type SessionEvent =
	| { type: 'session_init'; session_id: string; model: string; tools: string[] }
	| { type: 'message_delta'; text: string }
	| { type: 'message_complete'; text: string; message_id: string }
	| { type: 'thinking_delta'; text: string }
	| { type: 'tool_start'; tool_use_id: string; tool_name: string; input: unknown }
	| {
			type: 'tool_end';
			tool_use_id: string;
			tool_name: string;
			output: unknown;
			is_error: boolean;
	  }
	| { type: 'tool_progress'; tool_use_id: string; elapsed_seconds: number }
	| { type: 'tool_use_summary'; tool_use_id: string; summary: string }
	| { type: 'run_state'; state: string; error: string | null }
	| { type: 'usage_update'; input_tokens: number; output_tokens: number; cost_usd: number }
	| { type: 'permission_prompt'; request_id: string; tool_name: string; tool_input: unknown }
	| { type: 'elicitation_prompt'; request_id: string; message: string }
	| { type: 'compact_boundary'; trigger: string }
	| { type: 'system_status'; status: string }
	| { type: 'control_cancelled'; request_id: string }
	| { type: 'raw'; source: string; data: unknown };

export type SessionEventType = SessionEvent['type'];

export interface SessionEventPayload {
	session_id: string;
	event: SessionEvent;
}

// ─── Discovered Session Types ──────────────────────────────────────────────

export type DiscoveredSessionStatus =
	| 'working'
	| 'needs_attention'
	| 'idle'
	| 'finished'
	| 'unknown';

export interface DiscoveredSession {
	id: string;
	pid: number;
	working_directory: string;
	project_directory_name: string;
	session_id: string;
	project_name: string;
	status: DiscoveredSessionStatus;
	first_prompt: string | null;
	git_branch: string | null;
	message_count: number;
	cost_usd: number;
	token_count: number;
	latest_message: string | null;
	modified_at: string | null;
}

export interface DiscoveredSessionsPayload {
	sessions: DiscoveredSession[];
}

export interface AdoptSessionRequest {
	cli_session_id: string;
	working_directory: string;
	issue_id?: string | null;
	original_intent?: string | null;
	cost_usd?: number | null;
	token_count?: number | null;
}
