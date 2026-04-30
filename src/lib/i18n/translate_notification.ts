import * as m from '$lib/paraglide/messages.js';

const NOTIFICATION_KEY_MAP: Record<string, () => string> = {
	NOTIFICATION_NEEDS_INPUT: () => m.notification_toast_needs_input(),
	NOTIFICATION_NEEDS_REVIEW: () => m.notification_toast_needs_review(),
	NOTIFICATION_FINISHED: () => m.notification_toast_finished(),
	NOTIFICATION_ERRORED: () => m.notification_toast_errored(),
	NOTIFICATION_PR_READY: () => m.notification_toast_pr_ready(),
	NOTIFICATION_SESSION_WAITING: () => m.notification_toast_needs_input(),
};

export function translateNotificationKey(key: string): string {
	const translator = NOTIFICATION_KEY_MAP[key];
	if (translator !== undefined) {
		return translator();
	}
	return key;
}
