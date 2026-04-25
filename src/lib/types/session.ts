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

type SessionEventType =
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
