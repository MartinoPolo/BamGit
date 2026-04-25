import { invoke } from '@tauri-apps/api/core';
import type { CreateIssueRequest, Issue, UpdateIssueRequest } from '$lib/types/issue';

export async function createIssue(request: CreateIssueRequest): Promise<Issue> {
	return invoke('create_issue', { request });
}

export async function getIssuesForDashboard(
	dashboardId: string,
	includeArchived: boolean = false,
): Promise<Issue[]> {
	return invoke('get_issues_for_dashboard', {
		dashboardId,
		includeArchived,
	});
}

// fallow-ignore-next-line unused-export
export async function getIssue(id: string): Promise<Issue> {
	return invoke('get_issue', { id });
}

export async function updateIssue(request: UpdateIssueRequest): Promise<Issue> {
	return invoke('update_issue', { request });
}

export async function deleteIssue(id: string): Promise<void> {
	return invoke('delete_issue', { id });
}

export async function archiveIssue(id: string): Promise<Issue> {
	return invoke('archive_issue', { id });
}

export async function unarchiveIssue(id: string): Promise<Issue> {
	return invoke('unarchive_issue', { id });
}
