import * as m from '$lib/paraglide/messages.js';

export function formatRelativeTime(dateString: string | null): string {
	if (dateString === null) {
		return m.time_never_synced();
	}

	const fetched = new Date(dateString + 'Z'); // SQLite datetime is UTC
	const now = new Date();
	const diffSeconds = Math.floor((now.getTime() - fetched.getTime()) / 1000);

	if (diffSeconds < 60) {
		return m.time_just_now();
	}
	if (diffSeconds < 3600) {
		const minutes = Math.floor(diffSeconds / 60);
		return m.time_minutes_ago({ count: String(minutes) });
	}
	if (diffSeconds < 86400) {
		const hours = Math.floor(diffSeconds / 3600);
		return m.time_hours_ago({ count: String(hours) });
	}
	const days = Math.floor(diffSeconds / 86400);
	return m.time_days_ago({ count: String(days) });
}
