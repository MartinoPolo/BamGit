import { invoke } from '@tauri-apps/api/core';
import type {
	AssignedIssue,
	GhCliAvailability,
	GitHubStatusCache,
	SyncAllResult,
} from '$lib/types/github';

export async function get_github_status_cache(issue_id: string): Promise<GitHubStatusCache | null> {
	return invoke('get_github_status_cache', { issueId: issue_id });
}

export async function get_all_github_status_caches(
	dashboard_id: string,
): Promise<GitHubStatusCache[]> {
	return invoke('get_all_github_status_caches', { dashboardId: dashboard_id });
}

export async function check_gh_availability(): Promise<GhCliAvailability> {
	return invoke('check_gh_availability');
}

export async function fetch_issue_state(
	issue_id: string,
	owner: string,
	repo: string,
	issue_number: number,
): Promise<GitHubStatusCache> {
	return invoke('fetch_issue_state', {
		issueId: issue_id,
		owner,
		repo,
		issueNumber: issue_number,
	});
}

export async function fetch_pr_for_branch(
	issue_id: string,
	owner: string,
	repo: string,
	branch_name: string,
): Promise<GitHubStatusCache> {
	return invoke('fetch_pr_for_branch', {
		issueId: issue_id,
		owner,
		repo,
		branchName: branch_name,
	});
}

export async function fetch_assigned_issues(owner: string, repo: string): Promise<AssignedIssue[]> {
	return invoke('fetch_assigned_issues', { owner, repo });
}

export async function sync_all_github_state(
	dashboard_id: string,
	owner: string,
	repo: string,
): Promise<SyncAllResult> {
	return invoke('sync_all_github_state', { dashboardId: dashboard_id, owner, repo });
}
