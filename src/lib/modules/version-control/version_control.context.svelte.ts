import { createContext } from 'svelte';
import { SvelteMap } from 'svelte/reactivity';
import { invoke } from '$lib/tauri.js';
import type {
	AssignedIssue,
	GhCliAvailability,
	GitStatusCache,
	SyncAllResult,
} from '$lib/types/generated';

type SyncResult =
	| { status: 'success'; result: SyncAllResult }
	| { status: 'already-syncing' }
	| { status: 'error'; message: string };

// ─── Context ────────────────────────────────────────────────────────────────

type VersionControlContext = ReturnType<typeof createVersionControlContext>;

const [useVersionControl, setVersionControlInternal] = createContext<VersionControlContext>();
export { useVersionControl };

export function setVersionControlContext() {
	const ctx = createVersionControlContext();
	setVersionControlInternal(ctx);
	return ctx;
}

// ─── Factory ────────────────────────────────────────────────────────────────

function buildStateMap(caches: readonly GitStatusCache[]): SvelteMap<string, GitStatusCache> {
	const map = new SvelteMap<string, GitStatusCache>();
	for (const cache of caches) {
		map.set(cache.issue_id, cache);
	}
	return map;
}

function createVersionControlContext() {
	let stateMap = new SvelteMap<string, GitStatusCache>();
	let ghAvailability = $state<GhCliAvailability>('not-installed');
	let syncing = $state(false);
	let syncError = $state<string | null>(null);
	let assignedIssues = $state<AssignedIssue[]>([]);
	let loading = $state(false);
	let error = $state<string | null>(null);

	const isGhAvailable = $derived(ghAvailability === 'available');

	return {
		get stateMap() {
			return stateMap;
		},
		get ghAvailability() {
			return ghAvailability;
		},
		get isGhAvailable() {
			return isGhAvailable;
		},
		get syncing() {
			return syncing;
		},
		get syncError() {
			return syncError;
		},
		get assignedIssues() {
			return assignedIssues;
		},
		get loading() {
			return loading;
		},
		get error() {
			return error;
		},

		getState(issueId: string): GitStatusCache | undefined {
			return stateMap.get(issueId);
		},

		async loadStates(dashboardId: string) {
			try {
				loading = true;
				const statuses = await invoke<GitStatusCache[]>(
					'get_all_git_statuses_for_dashboard',
					{ dashboardId },
				);
				stateMap = buildStateMap(statuses);
				error = null;
			} catch (err) {
				error = String(err);
			} finally {
				loading = false;
			}
		},

		async syncAll(dashboardId: string, owner: string, repo: string): Promise<SyncResult> {
			if (syncing) {
				return { status: 'already-syncing' };
			}
			try {
				syncing = true;
				syncError = null;
				const result = await invoke<SyncAllResult>('sync_all_github_state', {
					dashboardId,
					owner,
					repo,
				});

				// Reload unified state after sync
				const statuses = await invoke<GitStatusCache[]>(
					'get_all_git_statuses_for_dashboard',
					{ dashboardId },
				);
				stateMap = buildStateMap(statuses);

				if (result.errors.length > 0) {
					syncError = result.errors.join('; ');
				}
				return { status: 'success', result };
			} catch (err) {
				syncError = String(err);
				return { status: 'error', message: String(err) };
			} finally {
				syncing = false;
			}
		},

		async refreshGitStatus(issueId: string) {
			try {
				const status = await invoke<GitStatusCache>('refresh_git_status', { issueId });
				stateMap.set(issueId, status);
				error = null;
			} catch (err) {
				error = String(err);
			}
		},

		// TODO: N+1 IPC pattern — fires one refresh_git_status call per issue.
		// Ideally replaced by a single batch Rust command (e.g. refresh_all_git_statuses).
		// Promise.all parallelizes the calls, which is the best client-side mitigation for now.
		async refreshAllForDashboard(dashboardId: string) {
			try {
				loading = true;
				const statuses = await invoke<GitStatusCache[]>(
					'get_all_git_statuses_for_dashboard',
					{ dashboardId },
				);
				const refreshPromises = statuses.map((status) =>
					invoke<GitStatusCache>('refresh_git_status', {
						issueId: status.issue_id,
					}).catch(() => status),
				);
				const refreshed = await Promise.all(refreshPromises);
				stateMap = buildStateMap(refreshed);
				error = null;
			} catch (err) {
				error = String(err);
			} finally {
				loading = false;
			}
		},

		async checkAvailability() {
			try {
				ghAvailability = await invoke<GhCliAvailability>('check_gh_availability');
			} catch {
				ghAvailability = 'not-installed';
			}
		},

		async loadAssignedIssues(owner: string, repo: string) {
			try {
				assignedIssues = await invoke<AssignedIssue[]>('fetch_assigned_issues', {
					owner,
					repo,
				});
			} catch (err) {
				error = String(err);
				console.error('Failed to load assigned issues:', err);
			}
		},

		clear() {
			stateMap.clear();
			error = null;
		},
	};
}
