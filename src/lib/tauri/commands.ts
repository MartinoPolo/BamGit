import { invoke } from '@tauri-apps/api/core';
import type {
	CreateDashboardRequest,
	Dashboard,
	UpdateDashboardRequest,
} from '$lib/types/dashboard';

export async function createDashboard(request: CreateDashboardRequest): Promise<Dashboard> {
	return invoke('create_dashboard', { request });
}

export async function getDashboards(): Promise<Dashboard[]> {
	return invoke('get_dashboards');
}

// fallow-ignore-next-line unused-export
export async function getDashboard(id: string): Promise<Dashboard> {
	return invoke('get_dashboard', { id });
}

export async function updateDashboard(request: UpdateDashboardRequest): Promise<Dashboard> {
	return invoke('update_dashboard', { request });
}

export async function deleteDashboard(id: string): Promise<void> {
	return invoke('delete_dashboard', { id });
}
