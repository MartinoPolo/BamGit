export function format_relative_time(date_string: string | null): string {
	if (date_string === null) {
		return 'Never synced';
	}

	const fetched = new Date(date_string + 'Z'); // SQLite datetime is UTC
	const now = new Date();
	const diff_seconds = Math.floor((now.getTime() - fetched.getTime()) / 1000);

	if (diff_seconds < 60) {
		return 'Just now';
	}
	if (diff_seconds < 3600) {
		const minutes = Math.floor(diff_seconds / 60);
		return `${minutes}m ago`;
	}
	if (diff_seconds < 86400) {
		const hours = Math.floor(diff_seconds / 3600);
		return `${hours}h ago`;
	}
	const days = Math.floor(diff_seconds / 86400);
	return `${days}d ago`;
}
