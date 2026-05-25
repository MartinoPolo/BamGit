import * as m from '$lib/paraglide/messages.js';

export function formatWorkspaceActivityRelativeTime(isoString: string | null): string {
	if (isoString == null) {
		return m.workspace_no_activity();
	}

	const date = new Date(isoString);
	const diffMinutes = Math.floor((Date.now() - date.getTime()) / 60000);

	if (diffMinutes < 1) {
		return m.time_just_now();
	}
	if (diffMinutes < 60) {
		return m.time_minutes_ago({ count: String(diffMinutes) });
	}

	const diffHours = Math.floor(diffMinutes / 60);
	if (diffHours < 24) {
		return m.time_hours_ago({ count: String(diffHours) });
	}

	const diffDays = Math.floor(diffHours / 24);
	if (diffDays === 1) {
		return m.workspace_yesterday();
	}
	return m.time_days_ago({ count: String(diffDays) });
}
