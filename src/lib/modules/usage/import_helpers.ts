import type { ImportSummary, UserSetting } from '$lib/types/generated/index.js';

export function formatImportToastMessage(summary: ImportSummary): string {
	const providerCount = summary.providers.length;
	const providerLabel = providerCount === 1 ? 'provider' : 'providers';
	let message = `Imported ${summary.total_sessions} sessions from ${providerCount} ${providerLabel}`;
	if (summary.total_skipped > 0) {
		message += ` (${summary.total_skipped} skipped as duplicates)`;
	}
	return message;
}

export function isImportPrompted(setting: UserSetting | null): boolean {
	return setting?.value === 'true';
}
