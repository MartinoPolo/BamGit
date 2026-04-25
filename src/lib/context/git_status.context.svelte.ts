import { createContext } from 'svelte';
import type { GitStatusCache } from '$lib/types/git_status';
import { getAllGitStatusesForDashboard, refreshGitStatus } from '$lib/tauri/git_status_commands';

type GitStatusContext = ReturnType<typeof createGitStatusContext>;

const [useGitStatus, setGitStatusInternal] = createContext<GitStatusContext>();
export { useGitStatus };

export function setGitStatusContext() {
	const ctx = createGitStatusContext();
	setGitStatusInternal(ctx);
	return ctx;
}

function createGitStatusContext() {
	let statusMap = $state<Map<string, GitStatusCache>>(new Map());
	let loading = $state(false);
	let error = $state<string | null>(null);

	return {
		get loading() {
			return loading;
		},
		get error() {
			return error;
		},

		getStatus(issueId: string): GitStatusCache | undefined {
			return statusMap.get(issueId);
		},

		async loadStatusesForDashboard(dashboardId: string) {
			try {
				loading = true;
				const statuses = await getAllGitStatusesForDashboard(dashboardId);
				const newMap = new Map<string, GitStatusCache>();
				for (const status of statuses) {
					newMap.set(status.issue_id, status);
				}
				statusMap = newMap;
				error = null;
			} catch (err) {
				error = String(err);
			} finally {
				loading = false;
			}
		},

		async refreshStatus(issueId: string) {
			try {
				const status = await refreshGitStatus(issueId);
				const newMap = new Map(statusMap);
				newMap.set(issueId, status);
				statusMap = newMap;
				error = null;
			} catch (err) {
				error = String(err);
			}
		},

		async refreshAllForDashboard(dashboardId: string) {
			try {
				loading = true;
				const statuses = await getAllGitStatusesForDashboard(dashboardId);
				const refreshPromises = statuses.map((status) =>
					refreshGitStatus(status.issue_id).catch(() => status),
				);
				const refreshed = await Promise.all(refreshPromises);
				const newMap = new Map<string, GitStatusCache>();
				for (const result of refreshed) {
					newMap.set(result.issue_id, result);
				}
				statusMap = newMap;
				error = null;
			} catch (err) {
				error = String(err);
			} finally {
				loading = false;
			}
		},

		clear() {
			statusMap = new Map();
			error = null;
		},
	};
}
