import { invoke } from '@tauri-apps/api/core';
import type { CreateIssueRequest, Issue, UpdateIssueRequest } from '$lib/types/issue';

export async function create_issue(request: CreateIssueRequest): Promise<Issue> {
	return invoke('create_issue', { request });
}

export async function get_issues_for_dashboard(
	dashboard_id: string,
	include_archived: boolean = false,
): Promise<Issue[]> {
	return invoke('get_issues_for_dashboard', {
		dashboardId: dashboard_id,
		includeArchived: include_archived,
	});
}

// fallow-ignore-next-line unused-export
export async function get_issue(id: string): Promise<Issue> {
	return invoke('get_issue', { id });
}

export async function update_issue(request: UpdateIssueRequest): Promise<Issue> {
	return invoke('update_issue', { request });
}

export async function delete_issue(id: string): Promise<void> {
	return invoke('delete_issue', { id });
}

export async function archive_issue(id: string): Promise<Issue> {
	return invoke('archive_issue', { id });
}

export async function unarchive_issue(id: string): Promise<Issue> {
	return invoke('unarchive_issue', { id });
}
