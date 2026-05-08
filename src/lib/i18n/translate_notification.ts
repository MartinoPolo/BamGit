import * as m from '$lib/paraglide/messages.js';

const NOTIFICATION_KEY_MAP: Record<string, () => string> = {
	NOTIFICATION_SESSION_START: () => m.notification_toast_session_start(),
	NOTIFICATION_SESSION_END: () => m.notification_toast_session_end(),
	NOTIFICATION_SESSION_ERROR: () => m.notification_toast_session_error(),
	NOTIFICATION_NEEDS_INPUT: () => m.notification_toast_session_needs_input(),
	NOTIFICATION_TASK_COMPLETE: () => m.notification_toast_task_complete(),
	NOTIFICATION_TASK_ACKNOWLEDGE: () => m.notification_toast_task_acknowledge(),
	NOTIFICATION_PR_READY: () => m.notification_toast_pr_ready(),
	NOTIFICATION_PR_MERGED: () => m.notification_toast_pr_merged(),
	NOTIFICATION_PR_REVIEW_REQUESTED: () => m.notification_toast_pr_review_requested(),
	NOTIFICATION_MERGE_CONFLICT: () => m.notification_toast_merge_conflict(),
	NOTIFICATION_BRANCH_BEHIND_BASE: () => m.notification_toast_branch_behind_base(),
	NOTIFICATION_GITHUB_ISSUE_ASSIGNED: () => m.notification_toast_github_issue_assigned(),
	NOTIFICATION_GITHUB_TRIGGER_RECEIVED: () => m.notification_toast_github_trigger_received(),
	NOTIFICATION_ACHIEVEMENT_UNLOCKED: () => m.notification_toast_achievement_unlocked(),
	NOTIFICATION_RESOURCE_LIMIT: () => m.notification_toast_resource_limit(),
};

export function translateNotificationKey(key: string): string {
	const translator = NOTIFICATION_KEY_MAP[key];
	if (translator !== undefined) {
		return translator();
	}
	return key;
}
