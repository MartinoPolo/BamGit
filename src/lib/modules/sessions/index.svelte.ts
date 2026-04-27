import { createContext } from 'svelte';
import { onMount, onDestroy } from 'svelte';
import { invoke } from '@tauri-apps/api/core';
import { listen, type UnlistenFn } from '@tauri-apps/api/event';
import type {
	Session,
	SessionEventPayload,
	DiscoveredSession,
	DiscoveredSessionsPayload,
	NotificationEventType,
} from '$lib/types/generated';

// ─── Module-internal request types ──────────────────────────────────────────

interface SpawnSessionRequest {
	prompt: string;
	working_directory: string;
	issue_id?: string | null;
	permission_mode?: string | null;
	model?: string | null;
}

interface AdoptSessionRequest {
	cli_session_id: string;
	working_directory: string;
	issue_id?: string | null;
	original_intent?: string | null;
	cost_usd?: number | null;
	token_count?: number | null;
}

// ─── Notification mapping ───────────────────────────────────────────────────

const NOTIFICATION_STATES: Record<string, NotificationEventType> = {
	'needs-input': 'needs-input',
	'needs-review': 'needs-review',
	errored: 'errored',
};

// ─── Dependency type ────────────────────────────────────────────────────────

type NotificationsApi = {
	addPending: (sessionId: string, eventType: NotificationEventType) => void;
	clearPending: (sessionId: string) => void;
};

// ─── Context ────────────────────────────────────────────────────────────────

type SessionsContext = ReturnType<typeof createSessionsContext>['publicApi'];

const [useSessions, setSessionsInternal] = createContext<SessionsContext>();
export { useSessions };

export function setSessionsContext(notifications: NotificationsApi) {
	const { publicApi, handleSessionEvent, handleDiscoveredSessionsUpdate } =
		createSessionsContext(notifications);
	setSessionsInternal(publicApi);

	// Set up event listeners (runs in layout component lifecycle)
	let cancelled = false;
	let unlistenSessionEvent: UnlistenFn | null = null;
	let unlistenDiscovered: UnlistenFn | null = null;

	onMount(async () => {
		const unlistenSession = await listen<SessionEventPayload>('session-event', (event) => {
			handleSessionEvent(event.payload);
		});
		if (cancelled) {
			unlistenSession();
			return;
		}
		unlistenSessionEvent = unlistenSession;

		const unlistenDisc = await listen<DiscoveredSessionsPayload>(
			'discovered-sessions-updated',
			(event) => {
				handleDiscoveredSessionsUpdate(event.payload);
			},
		);
		if (cancelled) {
			unlistenDisc();
			return;
		}
		unlistenDiscovered = unlistenDisc;
	});

	onDestroy(() => {
		cancelled = true;
		unlistenSessionEvent?.();
		unlistenDiscovered?.();
	});

	return publicApi;
}

// ─── Factory ────────────────────────────────────────────────────────────────

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

	const sessionsByIssueId = $derived.by(() => {
		const map = new Map<string, Session[]>();
		for (const session of sessions) {
			if (session.issue_id === null) {
				continue;
			}
			const existing = map.get(session.issue_id);
			if (existing !== undefined) {
				existing.push(session);
			} else {
				map.set(session.issue_id, [session]);
			}
		}
		return map;
	});

	// ─── Event handlers (internal, not exported) ────────────────────────────

	function handleSessionEvent(payload: SessionEventPayload) {
		const { session_id: sessionId, event, resolved_state: resolvedState } = payload;

		const session = sessions.find((s) => s.id === sessionId);
		if (!session) {
			return;
		}

		// Use resolved_state from Rust (no more RUN_STATE_MAP)
		if (resolvedState) {
			session.state = resolvedState;
			const notificationType = NOTIFICATION_STATES[resolvedState];
			if (notificationType) {
				notifications.addPending(sessionId, notificationType);
			} else {
				notifications.clearPending(sessionId);
			}
		}

		// Handle other event-specific side effects
		switch (event.type) {
			case 'usage_update':
				session.cost_usd = event.cost_usd ?? session.cost_usd;
				session.token_count = (event.input_tokens ?? 0) + (event.output_tokens ?? 0);
				break;
			case 'message_complete':
				session.last_response_summary =
					event.text.length > 200 ? event.text.slice(0, 197) + '...' : event.text;
				break;
		}
	}

	function handleDiscoveredSessionsUpdate(payload: DiscoveredSessionsPayload) {
		discoveredSessions = payload.sessions;
	}

	async function fetchAndSetSessions(showLoading: boolean) {
		try {
			if (showLoading) {
				loading = true;
			}
			sessions = await invoke<Session[]>('get_sessions');
			error = null;
		} catch (err) {
			error = String(err);
		} finally {
			if (showLoading) {
				loading = false;
			}
		}
	}

	// ─── Public interface ───────────────────────────────────────────────────

	const publicApi = {
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
		get sessionsByIssueId() {
			return sessionsByIssueId;
		},

		async loadSessions() {
			await fetchAndSetSessions(true);
		},

		async refresh() {
			await fetchAndSetSessions(false);
		},

		addSession(session: Session) {
			sessions = [session, ...sessions];
		},

		removeDiscoveredSession(discoveredSessionId: string) {
			discoveredSessions = discoveredSessions.filter((s) => s.id !== discoveredSessionId);
		},

		async spawnSession(request: SpawnSessionRequest): Promise<Session> {
			const sessionId = await invoke<string>('spawn_session', { request });
			const allSessions = await invoke<Session[]>('get_sessions');
			sessions = allSessions;
			error = null;
			const session = allSessions.find((s) => s.id === sessionId);
			if (session === undefined) {
				throw new Error(`Session ${sessionId} not found after spawn`);
			}
			return session;
		},

		async terminateSession(sessionId: string): Promise<void> {
			return invoke('terminate_session', { sessionId });
		},

		async interruptSession(sessionId: string): Promise<void> {
			return invoke('interrupt_session', { sessionId });
		},

		async sendMessage(sessionId: string, message: string): Promise<void> {
			return invoke('send_message', { sessionId, message });
		},

		async adoptSession(request: AdoptSessionRequest): Promise<string> {
			return invoke('adopt_session', { request });
		},
	};

	return { publicApi, handleSessionEvent, handleDiscoveredSessionsUpdate };
}
