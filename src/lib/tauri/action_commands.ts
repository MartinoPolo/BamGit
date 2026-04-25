import { invoke } from '@tauri-apps/api/core';
import type { Action, CreateActionRequest, UpdateActionRequest } from '$lib/types/action';

export async function createAction(request: CreateActionRequest): Promise<Action> {
	return invoke('create_action', { request });
}

export async function getActionsForDashboard(dashboardId: string): Promise<Action[]> {
	return invoke('get_actions_for_dashboard', { dashboardId });
}

export async function getAction(id: string): Promise<Action> {
	return invoke('get_action', { id });
}

export async function updateAction(request: UpdateActionRequest): Promise<Action> {
	return invoke('update_action', { request });
}

export async function deleteAction(id: string): Promise<void> {
	return invoke('delete_action', { id });
}

export async function reorderActions(actionIds: string[]): Promise<void> {
	return invoke('reorder_actions', { actionIds });
}

export async function executeAction(actionId: string, issueId: string): Promise<string> {
	return invoke('execute_action', { actionId, issueId });
}
