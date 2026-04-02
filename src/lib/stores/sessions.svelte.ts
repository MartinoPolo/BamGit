import type { Session, SessionEventPayload, SessionState } from '$lib/types/session';
import { get_sessions } from '$lib/tauri/session_commands';

let sessions = $state<Session[]>([]);
let loading = $state(false);
let error = $state<string | null>(null);

const active_sessions = $derived(
	sessions.filter((session) => session.state !== 'finished' && session.state !== 'errored'),
);

const finished_sessions = $derived(
	sessions.filter((session) => session.state === 'finished' || session.state === 'errored'),
);

function handle_session_event(payload: SessionEventPayload) {
	const { session_id, event } = payload;

	const session = sessions.find((s) => s.id === session_id);
	if (!session) {
		return;
	}

	switch (event.type) {
		case 'run_state': {
			const state_map: Record<string, SessionState> = {
				running: 'running',
				idle: 'needs-review',
				failed: 'errored',
				completed: 'finished',
				stopped: 'finished',
			};
			const new_state = state_map[event.state as string];
			if (new_state) {
				session.state = new_state;
			}
			break;
		}
		case 'usage_update': {
			session.cost_usd = (event.cost_usd as number) ?? session.cost_usd;
			session.token_count =
				((event.input_tokens as number) ?? 0) + ((event.output_tokens as number) ?? 0);
			break;
		}
		case 'message_complete': {
			const text = event.text as string;
			session.last_response_summary = text.length > 200 ? text.slice(0, 197) + '...' : text;
			break;
		}
		case 'permission_prompt':
		case 'elicitation_prompt': {
			session.state = 'needs-input';
			break;
		}
	}
}

export function get_session_store() {
	return {
		get sessions() {
			return sessions;
		},
		get active_sessions() {
			return active_sessions;
		},
		get finished_sessions() {
			return finished_sessions;
		},
		get loading() {
			return loading;
		},
		get error() {
			return error;
		},

		handle_session_event,

		async load_sessions() {
			try {
				loading = true;
				sessions = await get_sessions();
				error = null;
			} catch (err) {
				error = String(err);
			} finally {
				loading = false;
			}
		},

		async refresh() {
			try {
				sessions = await get_sessions();
				error = null;
			} catch (err) {
				error = String(err);
			}
		},

		add_session(session: Session) {
			sessions = [session, ...sessions];
		},
	};
}
