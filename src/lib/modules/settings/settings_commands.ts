import { invoke } from '$lib/tauri.js';
import type { UserSetting, WorkspaceSetting } from '$lib/types/generated/index.js';

/** @public */
export function getUserSetting(key: string): Promise<UserSetting | null> {
	return invoke('get_user_setting', { key });
}

export function setUserSetting(key: string, value: string): Promise<void> {
	return invoke('set_user_setting', { key, value });
}

/** @public */
export function deleteUserSetting(key: string): Promise<void> {
	return invoke('delete_user_setting', { key });
}

export function getAllUserSettings(): Promise<UserSetting[]> {
	return invoke('get_all_user_settings');
}

/** @public */
export function getWorkspaceSetting(
	dashboardId: string,
	key: string,
): Promise<WorkspaceSetting | null> {
	return invoke('get_workspace_setting', { dashboardId, key });
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

/** @public */
export function getWorkspaceOverriddenKeys(dashboardId: string): Promise<string[]> {
	return invoke('get_workspace_overridden_keys', { dashboardId });
}

/** @public */
export function getResolvedSetting(key: string, dashboardId?: string): Promise<string | null> {
	return invoke('get_resolved_setting', { key, dashboardId: dashboardId ?? null });
}
