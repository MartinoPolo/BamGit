import { invoke } from '@tauri-apps/api/core';
import type { Action, CreateActionRequest, UpdateActionRequest } from '$lib/types/action';

export async function create_action(request: CreateActionRequest): Promise<Action> {
	return invoke('create_action', { request });
}

export async function get_actions_for_dashboard(dashboard_id: string): Promise<Action[]> {
	return invoke('get_actions_for_dashboard', { dashboardId: dashboard_id });
}

export async function get_action(id: string): Promise<Action> {
	return invoke('get_action', { id });
}

export async function update_action(request: UpdateActionRequest): Promise<Action> {
	return invoke('update_action', { request });
}

export async function delete_action(id: string): Promise<void> {
	return invoke('delete_action', { id });
}

export async function reorder_actions(action_ids: string[]): Promise<void> {
	return invoke('reorder_actions', { actionIds: action_ids });
}

export async function execute_action(action_id: string, issue_id: string): Promise<string> {
	return invoke('execute_action', { actionId: action_id, issueId: issue_id });
}
