import { invoke } from '@tauri-apps/api/core';
import type {
	SetupWorktreeRequest,
	RemoveWorktreeRequest,
	PrunableIssue,
} from '$lib/types/worktree';

export async function setupWorktree(request: SetupWorktreeRequest): Promise<string> {
	return invoke('setup_worktree', { request });
}

export async function removeWorktree(request: RemoveWorktreeRequest): Promise<void> {
	return invoke('remove_worktree', { request });
}

// fallow-ignore-next-line unused-export
export async function refreshWorktreeState(issueId: string): Promise<string> {
	return invoke('refresh_worktree_state', { issueId });
}

export async function getPrunableIssues(dashboardId: string): Promise<PrunableIssue[]> {
	return invoke('get_prunable_issues', { dashboardId });
}
