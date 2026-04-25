import type {
	DiscoveredSession,
	DiscoveredSessionsPayload,
	Session,
	SessionEventPayload,
	SessionState,
} from '$lib/types/session';
import type { NotificationEventType } from '$lib/types/notification';
import { getSessions } from '$lib/tauri/session_commands';
import { getNotificationStore } from '$lib/stores/notifications.svelte';

/** States that warrant a pending in-app notification indicator. */
const NOTIFICATION_STATES: Record<string, NotificationEventType> = {
	'needs-input': 'needs-input',
	'needs-review': 'needs-review',
	errored: 'errored',
};

let sessions = $state<Session[]>([]);
let discoveredSessions = $state<DiscoveredSession[]>([]);
let loading = $state(false);
let error = $state<string | null>(null);

const activeSessions = $derived(
	sessions.filter((session) => session.state !== 'finished' && session.state !== 'errored'),
);

const finishedSessions = $derived(
	sessions.filter((session) => session.state === 'finished' || session.state === 'errored'),
);

const RUN_STATE_MAP: Record<string, SessionState> = {
	running: 'running',
	idle: 'needs-review',
	failed: 'errored',
	completed: 'finished',
	stopped: 'finished',
};

function applyRunState(session: Session, sessionId: string, event: Record<string, unknown>) {
	const newState = RUN_STATE_MAP[event.state as string];
	if (newState) {
		session.state = newState;
		const notificationType = NOTIFICATION_STATES[newState];
		if (notificationType) {
			getNotificationStore().addPending(sessionId, notificationType);
		} else {
			getNotificationStore().clearPending(sessionId);
		}
	}
}

function applyUsageUpdate(session: Session, event: Record<string, unknown>) {
	session.cost_usd = (event.cost_usd as number) ?? session.cost_usd;
	session.token_count =
		((event.input_tokens as number) ?? 0) + ((event.output_tokens as number) ?? 0);
}

function applyMessageComplete(session: Session, event: Record<string, unknown>) {
	const text = event.text as string;
	session.last_response_summary = text.length > 200 ? text.slice(0, 197) + '...' : text;
}

function applyInputPrompt(session: Session, sessionId: string) {
	session.state = 'needs-input';
	getNotificationStore().addPending(sessionId, 'needs-input');
}

function handleSessionEvent(payload: SessionEventPayload) {
	const { session_id: sessionId, event } = payload;

	const session = sessions.find((s) => s.id === sessionId);
	if (!session) {
		return;
	}

	switch (event.type) {
		case 'run_state':
			applyRunState(session, sessionId, event);
			break;
		case 'usage_update':
			applyUsageUpdate(session, event);
			break;
		case 'message_complete':
			applyMessageComplete(session, event);
			break;
		case 'permission_prompt':
		case 'elicitation_prompt':
			applyInputPrompt(session, sessionId);
			break;
	}
}

function handleDiscoveredSessionsUpdate(payload: DiscoveredSessionsPayload) {
	discoveredSessions = payload.sessions;
}

export function getSessionStore() {
	return {
		get sessions() {
			return sessions;
		},
		get activeSessions() {
			return activeSessions;
		},
		get finishedSessions() {
			return finishedSessions;
		},
		get discoveredSessions() {
			return discoveredSessions;
		},
		get loading() {
			return loading;
		},
		get error() {
			return error;
		},

		handleSessionEvent,
		handleDiscoveredSessionsUpdate,

		async loadSessions() {
			try {
				loading = true;
				sessions = await getSessions();
				error = null;
			} catch (err) {
				error = String(err);
			} finally {
				loading = false;
			}
		},

		async refresh() {
			try {
				sessions = await getSessions();
				error = null;
			} catch (err) {
				error = String(err);
			}
		},

		addSession(session: Session) {
			sessions = [session, ...sessions];
		},

		removeDiscoveredSession(discoveredSessionId: string) {
			discoveredSessions = discoveredSessions.filter((s) => s.id !== discoveredSessionId);
		},
	};
}
