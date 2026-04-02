import { invoke } from '@tauri-apps/api/core';
import type {
	SetupWorktreeRequest,
	RemoveWorktreeRequest,
	PrunableIssue,
} from '$lib/types/worktree';

export async function setup_worktree(request: SetupWorktreeRequest): Promise<string> {
	return invoke('setup_worktree', { request });
}

export async function remove_worktree(request: RemoveWorktreeRequest): Promise<void> {
	return invoke('remove_worktree', { request });
}

export async function refresh_worktree_state(issue_id: string): Promise<string> {
	return invoke('refresh_worktree_state', { issueId: issue_id });
}

export async function get_prunable_issues(dashboard_id: string): Promise<PrunableIssue[]> {
	return invoke('get_prunable_issues', { dashboardId: dashboard_id });
}
