import type { GitStatusCache } from '$lib/types/git_status';
import {
	get_all_git_statuses_for_dashboard,
	refresh_git_status,
} from '$lib/tauri/git_status_commands';

let status_map = $state<Map<string, GitStatusCache>>(new Map());
let loading = $state(false);
let error = $state<string | null>(null);

export function get_git_status_store() {
	return {
		get loading() {
			return loading;
		},
		get error() {
			return error;
		},

		get_status(issue_id: string): GitStatusCache | undefined {
			return status_map.get(issue_id);
		},

		async load_statuses_for_dashboard(dashboard_id: string) {
			try {
				loading = true;
				const statuses = await get_all_git_statuses_for_dashboard(dashboard_id);
				const new_map = new Map<string, GitStatusCache>();
				for (const status of statuses) {
					new_map.set(status.issue_id, status);
				}
				status_map = new_map;
				error = null;
			} catch (err) {
				error = String(err);
			} finally {
				loading = false;
			}
		},

		async refresh_status(issue_id: string) {
			try {
				const status = await refresh_git_status(issue_id);
				const new_map = new Map(status_map);
				new_map.set(issue_id, status);
				status_map = new_map;
				error = null;
			} catch (err) {
				error = String(err);
			}
		},

		async refresh_all_for_dashboard(dashboard_id: string) {
			try {
				loading = true;
				const statuses = await get_all_git_statuses_for_dashboard(dashboard_id);
				const refresh_promises = statuses.map((status) =>
					refresh_git_status(status.issue_id).catch(() => status),
				);
				const refreshed = await Promise.all(refresh_promises);
				const new_map = new Map<string, GitStatusCache>();
				for (const result of refreshed) {
					new_map.set(result.issue_id, result);
				}
				status_map = new_map;
				error = null;
			} catch (err) {
				error = String(err);
			} finally {
				loading = false;
			}
		},

		clear() {
			status_map = new Map();
			error = null;
		},
	};
}
