import { createContext } from 'svelte';
import type {
	AssignedIssue,
	GhCliAvailability,
	GitHubStatusCache,
	SyncAllResult,
} from '$lib/types/github';
import {
	checkGhAvailability,
	fetchAssignedIssues,
	getAllGithubStatusCaches,
	syncAllGithubState,
} from '$lib/tauri/github_commands';

type GithubContext = ReturnType<typeof createGithubContext>;

const [useGithub, setGithubInternal] = createContext<GithubContext>();
export { useGithub };

export function setGithubContext() {
	const ctx = createGithubContext();
	setGithubInternal(ctx);
	return ctx;
}

function buildCacheMap(caches: readonly GitHubStatusCache[]): Map<string, GitHubStatusCache> {
	const map = new Map<string, GitHubStatusCache>();
	for (const cache of caches) {
		map.set(cache.issue_id, cache);
	}
	return map;
}

function createGithubContext() {
	let cacheMap = $state<Map<string, GitHubStatusCache>>(new Map());
	let availability = $state<GhCliAvailability>('not-installed');
	let syncing = $state(false);
	let syncError = $state<string | null>(null);
	let lastSyncTime = $state<Date | null>(null);
	let assignedIssues = $state<AssignedIssue[]>([]);

	const isAvailable = $derived(availability === 'available');

	return {
		get cacheMap() {
			return cacheMap;
		},
		get availability() {
			return availability;
		},
		get isAvailable() {
			return isAvailable;
		},
		get syncing() {
			return syncing;
		},
		get syncError() {
			return syncError;
		},
		get lastSyncTime() {
			return lastSyncTime;
		},
		get assignedIssues() {
			return assignedIssues;
		},

		getCache(issueId: string): GitHubStatusCache | undefined {
			return cacheMap.get(issueId);
		},

		async checkAvailability() {
			try {
				availability = await checkGhAvailability();
			} catch {
				availability = 'not-installed';
			}
		},

		async loadCaches(dashboardId: string) {
			try {
				const caches = await getAllGithubStatusCaches(dashboardId);
				cacheMap = buildCacheMap(caches);
			} catch (err) {
				console.error('Failed to load GitHub caches:', err);
			}
		},

		async loadAssignedIssues(owner: string, repo: string) {
			try {
				assignedIssues = await fetchAssignedIssues(owner, repo);
			} catch (err) {
				console.error('Failed to load assigned issues:', err);
			}
		},

		async syncAll(
			dashboardId: string,
			owner: string,
			repo: string,
		): Promise<SyncAllResult | null> {
			if (syncing) {
				return null;
			}
			try {
				syncing = true;
				syncError = null;
				const result = await syncAllGithubState(dashboardId, owner, repo);
				lastSyncTime = new Date();

				const caches = await getAllGithubStatusCaches(dashboardId);
				cacheMap = buildCacheMap(caches);

				if (result.errors.length > 0) {
					syncError = result.errors.join('; ');
				}
				return result;
			} catch (err) {
				syncError = String(err);
				return null;
			} finally {
				syncing = false;
			}
		},
	};
}
