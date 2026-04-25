import { invoke } from '@tauri-apps/api/core';
import type {
	AssignedIssue,
	GhCliAvailability,
	GitHubStatusCache,
	SyncAllResult,
} from '$lib/types/github';

// fallow-ignore-next-line unused-export
export async function getGithubStatusCache(issueId: string): Promise<GitHubStatusCache | null> {
	return invoke('get_github_status_cache', { issueId });
}

export async function getAllGithubStatusCaches(dashboardId: string): Promise<GitHubStatusCache[]> {
	return invoke('get_all_github_status_caches', { dashboardId });
}

export async function checkGhAvailability(): Promise<GhCliAvailability> {
	return invoke('check_gh_availability');
}

// fallow-ignore-next-line unused-export
export async function fetchIssueState(
	issueId: string,
	owner: string,
	repo: string,
	issueNumber: number,
): Promise<GitHubStatusCache> {
	return invoke('fetch_issue_state', {
		issueId,
		owner,
		repo,
		issueNumber,
	});
}

// fallow-ignore-next-line unused-export
export async function fetchPrForBranch(
	issueId: string,
	owner: string,
	repo: string,
	branchName: string,
): Promise<GitHubStatusCache> {
	return invoke('fetch_pr_for_branch', {
		issueId,
		owner,
		repo,
		branchName,
	});
}

export async function fetchAssignedIssues(owner: string, repo: string): Promise<AssignedIssue[]> {
	return invoke('fetch_assigned_issues', { owner, repo });
}

export async function syncAllGithubState(
	dashboardId: string,
	owner: string,
	repo: string,
): Promise<SyncAllResult> {
	return invoke('sync_all_github_state', { dashboardId, owner, repo });
}
