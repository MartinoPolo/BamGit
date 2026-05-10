import { createContext } from 'svelte';
import { SvelteMap } from 'svelte/reactivity';
import { invoke } from '$lib/tauri.js';
import type {
	AssignedIssue,
	AssignedIssuesResult,
	GhAuthStatus,
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

function replaceStateMap(
	map: SvelteMap<string, GitStatusCache>,
	caches: readonly GitStatusCache[],
): void {
	map.clear();
	for (const cache of caches) {
		map.set(cache.issue_id, cache);
	}
}

function createVersionControlContext() {
	const stateMap = new SvelteMap<string, GitStatusCache>();
	let authStatus = $state<GhAuthStatus>({ status: 'not-connected' });
	let ghAvailability = $state<GhCliAvailability>('not-installed');
	let syncing = $state(false);
	let syncError = $state<string | null>(null);
	let assignedIssues = $state<AssignedIssue[]>([]);
	let assignedIssuesHasMore = $state(false);
	let assignedIssuesLimit = $state(50);
	let assignedIssuesLastSynced = $state<Date | null>(null);
	let assignedIssuesLoading = $state(false);
	let loading = $state(false);
	let error = $state<string | null>(null);

	const isGhAvailable = $derived(
		authStatus.status === 'oauth-connected' ||
			authStatus.status === 'cli-connected' ||
			ghAvailability === 'available',
	);

	async function checkAuthStatus() {
		try {
			authStatus = await invoke<GhAuthStatus>('github_auth_status');
		} catch {
			authStatus = { status: 'not-connected' };
		}
	}

	async function fetchAssignedIssuesBatch(owner: string, repo: string) {
		try {
			assignedIssuesLoading = true;
			const result = await invoke<AssignedIssuesResult>('fetch_assigned_issues', {
				owner,
				repo,
				limit: assignedIssuesLimit,
			});
			assignedIssues = result.issues;
			assignedIssuesHasMore = result.has_more;
			assignedIssuesLastSynced = new Date();
		} catch (err) {
			error = String(err);
			console.error('Failed to load assigned issues:', err);
		} finally {
			assignedIssuesLoading = false;
		}
	}

	return {
		get stateMap() {
			return stateMap;
		},
		get authStatus() {
			return authStatus;
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
		get assignedIssuesHasMore() {
			return assignedIssuesHasMore;
		},
		get assignedIssuesLastSynced() {
			return assignedIssuesLastSynced;
		},
		get assignedIssuesLoading() {
			return assignedIssuesLoading;
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
				replaceStateMap(stateMap, statuses);
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
				replaceStateMap(stateMap, statuses);

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
				replaceStateMap(stateMap, refreshed);
				error = null;
			} catch (err) {
				error = String(err);
			} finally {
				loading = false;
			}
		},

		checkAuthStatus,

		async checkAvailability() {
			try {
				await checkAuthStatus();
				ghAvailability = await invoke<GhCliAvailability>('check_gh_availability');
			} catch {
				ghAvailability = 'not-installed';
			}
		},

		async loadAssignedIssues(owner: string, repo: string) {
			assignedIssuesLimit = 50;
			await fetchAssignedIssuesBatch(owner, repo);
		},

		async loadMoreAssignedIssues(owner: string, repo: string) {
			assignedIssuesLimit += 50;
			await fetchAssignedIssuesBatch(owner, repo);
		},

		clear() {
			stateMap.clear();
			error = null;
		},
	};
}
