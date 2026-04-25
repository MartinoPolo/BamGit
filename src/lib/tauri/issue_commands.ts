import { invoke } from '@tauri-apps/api/core';
import type { CreateIssueRequest, Issue, IssueLabel, UpdateIssueRequest } from '$lib/types/issue';

interface RawIssue extends Omit<Issue, 'labels'> {
	labels: string | null;
}

function deserializeLabels(raw: string | null): IssueLabel[] {
	if (raw === null) {
		return [];
	}
	try {
		const parsed: unknown = JSON.parse(raw);
		if (!Array.isArray(parsed)) {
			return [];
		}
		return parsed as IssueLabel[];
	} catch {
		return [];
	}
}

function toIssue(raw: RawIssue): Issue {
	return { ...raw, labels: deserializeLabels(raw.labels) };
}

export async function createIssue(request: CreateIssueRequest): Promise<Issue> {
	const raw = await invoke<RawIssue>('create_issue', { request });
	return toIssue(raw);
}

export async function getIssuesForDashboard(
	dashboardId: string,
	includeArchived: boolean = false,
): Promise<Issue[]> {
	const rawIssues = await invoke<RawIssue[]>('get_issues_for_dashboard', {
		dashboardId,
		includeArchived,
	});
	return rawIssues.map(toIssue);
}

// fallow-ignore-next-line unused-export
export async function getIssue(id: string): Promise<Issue> {
	const raw = await invoke<RawIssue>('get_issue', { id });
	return toIssue(raw);
}

export async function updateIssue(request: UpdateIssueRequest): Promise<Issue> {
	const raw = await invoke<RawIssue>('update_issue', { request });
	return toIssue(raw);
}

export async function deleteIssue(id: string): Promise<void> {
	return invoke('delete_issue', { id });
}

export async function archiveIssue(id: string): Promise<Issue> {
	const raw = await invoke<RawIssue>('archive_issue', { id });
	return toIssue(raw);
}

export async function unarchiveIssue(id: string): Promise<Issue> {
	const raw = await invoke<RawIssue>('unarchive_issue', { id });
	return toIssue(raw);
}
