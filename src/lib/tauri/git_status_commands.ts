import { invoke } from '@tauri-apps/api/core';
import type { GitStatusCache } from '$lib/types/git_status';

export async function refresh_git_status(issue_id: string): Promise<GitStatusCache> {
	return invoke('refresh_git_status', { issueId: issue_id });
}

export async function get_cached_git_status(issue_id: string): Promise<GitStatusCache | null> {
	return invoke('get_cached_git_status', { issueId: issue_id });
}

export async function get_all_git_statuses_for_dashboard(
	dashboard_id: string,
): Promise<GitStatusCache[]> {
	return invoke('get_all_git_statuses_for_dashboard', { dashboardId: dashboard_id });
}
