import { createContext } from 'svelte';
import type {
	DiscoveredSession,
	DiscoveredSessionsPayload,
	Session,
	SessionEvent,
	SessionEventPayload,
	SessionState,
} from '$lib/types/session';
import type { NotificationEventType } from '$lib/types/notification';
import { getSessions } from '$lib/tauri/session_commands';

const NOTIFICATION_STATES: Record<string, NotificationEventType> = {
	'needs-input': 'needs-input',
	'needs-review': 'needs-review',
	errored: 'errored',
};

type NotificationsApi = {
	addPending: (sessionId: string, eventType: NotificationEventType) => void;
	clearPending: (sessionId: string) => void;
};

type SessionsContext = ReturnType<typeof createSessionsContext>;

const [useSessions, setSessionsInternal] = createContext<SessionsContext>();
export { useSessions };

export function setSessionsContext(notifications: NotificationsApi) {
	const ctx = createSessionsContext(notifications);
	setSessionsInternal(ctx);
	return ctx;
}

const RUN_STATE_MAP: Record<string, SessionState> = {
	running: 'running',
	idle: 'needs-review',
	failed: 'errored',
	completed: 'finished',
	stopped: 'finished',
};

function createSessionsContext(notifications: NotificationsApi) {
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

	function applyRunState(
		session: Session,
		sessionId: string,
		event: Extract<SessionEvent, { type: 'run_state' }>,
	) {
		const newState = RUN_STATE_MAP[event.state];
		if (newState) {
			session.state = newState;
			const notificationType = NOTIFICATION_STATES[newState];
			if (notificationType) {
				notifications.addPending(sessionId, notificationType);
			} else {
				notifications.clearPending(sessionId);
			}
		}
	}

	function applyUsageUpdate(
		session: Session,
		event: Extract<SessionEvent, { type: 'usage_update' }>,
	) {
		session.cost_usd = event.cost_usd ?? session.cost_usd;
		session.token_count = (event.input_tokens ?? 0) + (event.output_tokens ?? 0);
	}

	function applyMessageComplete(
		session: Session,
		event: Extract<SessionEvent, { type: 'message_complete' }>,
	) {
		const { text } = event;
		session.last_response_summary = text.length > 200 ? text.slice(0, 197) + '...' : text;
	}

	function applyInputPrompt(session: Session, sessionId: string) {
		session.state = 'needs-input';
		notifications.addPending(sessionId, 'needs-input');
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
