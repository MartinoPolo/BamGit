import { invoke } from '$lib/tauri.js';
import type { OverviewWorkspaceData, WindowWorkspaceBinding } from '$lib/types/generated';

export function openWorkspaceWindow(dashboardId: string): Promise<void> {
	return invoke('open_workspace_window', { dashboardId });
}

export function closeWorkspaceWindow(windowLabel: string): Promise<void> {
	return invoke('close_workspace_window', { windowLabel });
}

export function getWindowBindings(): Promise<WindowWorkspaceBinding[]> {
	return invoke('get_window_bindings');
}

export function saveWindowGeometry(
	windowLabel: string,
	windowX: number,
	windowY: number,
	windowWidth: number,
	windowHeight: number,
): Promise<void> {
	return invoke('save_window_geometry', {
		windowLabel,
		windowX,
		windowY,
		windowWidth,
		windowHeight,
	});
}

export function getOverviewData(
	includeArchived: boolean = false,
): Promise<OverviewWorkspaceData[]> {
	return invoke('get_overview_data', { includeArchived });
}
