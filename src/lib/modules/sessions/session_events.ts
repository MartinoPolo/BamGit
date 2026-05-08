import type {
	NotificationEventType,
	SessionEvent,
	SessionEventPayload,
} from '$lib/types/generated';

// ─── Notification state mapping ──────────────────────────────────────────────

const NOTIFICATION_STATES: Record<string, NotificationEventType> = {
	'needs-input': 'session.needs-input',
	'needs-review': 'session.needs-input',
	errored: 'session.error',
};

// ─── Types ────────────────────────────────────────────────────────────────────

export type NotificationAction =
	| { type: 'add'; notificationType: NotificationEventType }
	| { type: 'clear' }
	| null;

export interface SessionPatch {
	state?: string;
	cost_usd?: number;
	token_count?: number;
	last_response_summary?: string;
}

export interface SessionEventEffects {
	sessionPatch: SessionPatch;
	notificationAction: NotificationAction;
}

// ─── Pure computation ─────────────────────────────────────────────────────────

export function computeSessionEventEffects(
	event: SessionEventPayload['event'],
	resolvedState: string | null,
	currentCostUsd: number | null,
): SessionEventEffects {
	const sessionPatch: SessionPatch = {};
	let notificationAction: NotificationAction = null;

	if (resolvedState !== null) {
		sessionPatch.state = resolvedState;
		const notificationType = NOTIFICATION_STATES[resolvedState];
		if (notificationType !== undefined) {
			notificationAction = { type: 'add', notificationType };
		} else {
			notificationAction = { type: 'clear' };
		}
	}

	applyEventSpecificEffects(event, currentCostUsd, sessionPatch);

	return { sessionPatch, notificationAction };
}

function applyEventSpecificEffects(
	event: SessionEvent,
	currentCostUsd: number | null,
	sessionPatch: SessionPatch,
): void {
	switch (event.type) {
		case 'usage_update':
			sessionPatch.cost_usd = event.cost_usd ?? currentCostUsd ?? undefined;
			sessionPatch.token_count = (event.input_tokens ?? 0) + (event.output_tokens ?? 0);
			break;
		case 'message_complete': {
			const text = event.text;
			sessionPatch.last_response_summary =
				text.length > 200 ? text.slice(0, 197) + '...' : text;
			break;
		}
		default:
			break;
	}
}
