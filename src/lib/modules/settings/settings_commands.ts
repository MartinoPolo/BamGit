import { invoke } from '$lib/tauri.js';
import type { UserSetting, WorkspaceSetting } from '$lib/types/generated/index.js';

export function getUserSetting(key: string): Promise<UserSetting | null> {
	return invoke('get_user_setting', { key });
}

export function setUserSetting(key: string, value: string): Promise<void> {
	return invoke('set_user_setting', { key, value });
}

export function getAllUserSettings(): Promise<UserSetting[]> {
	return invoke('get_all_user_settings');
}

export function setWorkspaceSetting(
	dashboardId: string,
	key: string,
	value: string,
): Promise<void> {
	return invoke('set_workspace_setting', { dashboardId, key, value });
}

export function deleteWorkspaceSetting(dashboardId: string, key: string): Promise<void> {
	return invoke('delete_workspace_setting', { dashboardId, key });
}

export function getAllWorkspaceSettings(dashboardId: string): Promise<WorkspaceSetting[]> {
	return invoke('get_all_workspace_settings', { dashboardId });
}

export function bulkSetUserSettings(entries: Record<string, string>): Promise<void> {
	return invoke('bulk_set_user_settings', { entries });
}
