import type {
	DiscoveredSession,
	DiscoveredSessionsPayload,
	Session,
	SessionEventPayload,
	SessionState,
} from '$lib/types/session';
import type { NotificationEventType } from '$lib/types/notification';
import { get_sessions } from '$lib/tauri/session_commands';
import { get_notification_store } from '$lib/stores/notifications.svelte';

/** States that warrant a pending in-app notification indicator. */
const NOTIFICATION_STATES: Record<string, NotificationEventType> = {
	'needs-input': 'needs-input',
	'needs-review': 'needs-review',
	errored: 'errored',
};

let sessions = $state<Session[]>([]);
let discovered_sessions = $state<DiscoveredSession[]>([]);
let loading = $state(false);
let error = $state<string | null>(null);

const active_sessions = $derived(
	sessions.filter((session) => session.state !== 'finished' && session.state !== 'errored'),
);

const finished_sessions = $derived(
	sessions.filter((session) => session.state === 'finished' || session.state === 'errored'),
);

const RUN_STATE_MAP: Record<string, SessionState> = {
	running: 'running',
	idle: 'needs-review',
	failed: 'errored',
	completed: 'finished',
	stopped: 'finished',
};

function apply_run_state(session: Session, session_id: string, event: Record<string, unknown>) {
	const new_state = RUN_STATE_MAP[event.state as string];
	if (new_state) {
		session.state = new_state;
		const notification_type = NOTIFICATION_STATES[new_state];
		if (notification_type) {
			get_notification_store().add_pending(session_id, notification_type);
		} else {
			get_notification_store().clear_pending(session_id);
		}
	}
}

function apply_usage_update(session: Session, event: Record<string, unknown>) {
	session.cost_usd = (event.cost_usd as number) ?? session.cost_usd;
	session.token_count =
		((event.input_tokens as number) ?? 0) + ((event.output_tokens as number) ?? 0);
}

function apply_message_complete(session: Session, event: Record<string, unknown>) {
	const text = event.text as string;
	session.last_response_summary = text.length > 200 ? text.slice(0, 197) + '...' : text;
}

function apply_input_prompt(session: Session, session_id: string) {
	session.state = 'needs-input';
	get_notification_store().add_pending(session_id, 'needs-input');
}

function handle_session_event(payload: SessionEventPayload) {
	const { session_id, event } = payload;

	const session = sessions.find((s) => s.id === session_id);
	if (!session) {
		return;
	}

	switch (event.type) {
		case 'run_state':
			apply_run_state(session, session_id, event);
			break;
		case 'usage_update':
			apply_usage_update(session, event);
			break;
		case 'message_complete':
			apply_message_complete(session, event);
			break;
		case 'permission_prompt':
		case 'elicitation_prompt':
			apply_input_prompt(session, session_id);
			break;
	}
}

function handle_discovered_sessions_update(payload: DiscoveredSessionsPayload) {
	discovered_sessions = payload.sessions;
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
		get discovered_sessions() {
			return discovered_sessions;
		},
		get loading() {
			return loading;
		},
		get error() {
			return error;
		},

		handle_session_event,
		handle_discovered_sessions_update,

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

		remove_discovered_session(discovered_session_id: string) {
			discovered_sessions = discovered_sessions.filter((s) => s.id !== discovered_session_id);
		},
	};
}
