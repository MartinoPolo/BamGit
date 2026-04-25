import { invoke } from '@tauri-apps/api/core';
import type { GitStatusCache } from '$lib/types/git_status';

export async function refreshGitStatus(issueId: string): Promise<GitStatusCache> {
	return invoke('refresh_git_status', { issueId });
}

// fallow-ignore-next-line unused-export
export async function getCachedGitStatus(issueId: string): Promise<GitStatusCache | null> {
	return invoke('get_cached_git_status', { issueId });
}

export async function getAllGitStatusesForDashboard(
	dashboardId: string,
): Promise<GitStatusCache[]> {
	return invoke('get_all_git_statuses_for_dashboard', { dashboardId });
}
