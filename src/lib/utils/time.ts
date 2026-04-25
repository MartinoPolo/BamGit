export function formatRelativeTime(dateString: string | null): string {
	if (dateString === null) {
		return 'Never synced';
	}

	const fetched = new Date(dateString + 'Z'); // SQLite datetime is UTC
	const now = new Date();
	const diffSeconds = Math.floor((now.getTime() - fetched.getTime()) / 1000);

	if (diffSeconds < 60) {
		return 'Just now';
	}
	if (diffSeconds < 3600) {
		const minutes = Math.floor(diffSeconds / 60);
		return `${minutes}m ago`;
	}
	if (diffSeconds < 86400) {
		const hours = Math.floor(diffSeconds / 3600);
		return `${hours}h ago`;
	}
	const days = Math.floor(diffSeconds / 86400);
	return `${days}d ago`;
}
