import { invoke } from '@tauri-apps/api/core';
import type {
	CreateDashboardRequest,
	Dashboard,
	UpdateDashboardRequest,
} from '$lib/types/dashboard';

export async function create_dashboard(request: CreateDashboardRequest): Promise<Dashboard> {
	return invoke('create_dashboard', { request });
}

export async function get_dashboards(): Promise<Dashboard[]> {
	return invoke('get_dashboards');
}

export async function get_dashboard(id: string): Promise<Dashboard> {
	return invoke('get_dashboard', { id });
}

export async function update_dashboard(request: UpdateDashboardRequest): Promise<Dashboard> {
	return invoke('update_dashboard', { request });
}

export async function delete_dashboard(id: string): Promise<void> {
	return invoke('delete_dashboard', { id });
}
