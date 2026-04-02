import type {
	AssignedIssue,
	GhCliAvailability,
	GitHubStatusCache,
	SyncAllResult,
} from '$lib/types/github';
import {
	check_gh_availability,
	fetch_assigned_issues,
	get_all_github_status_caches,
	sync_all_github_state,
} from '$lib/tauri/github_commands';

let cache_map = $state<Map<string, GitHubStatusCache>>(new Map());
let availability = $state<GhCliAvailability>('not-installed');
let syncing = $state(false);
let sync_error = $state<string | null>(null);
let last_sync_time = $state<Date | null>(null);
let assigned_issues = $state<AssignedIssue[]>([]);

const is_available = $derived(availability === 'available');

function build_cache_map(caches: readonly GitHubStatusCache[]): Map<string, GitHubStatusCache> {
	const map = new Map<string, GitHubStatusCache>();
	for (const cache of caches) {
		map.set(cache.issue_id, cache);
	}
	return map;
}

export function get_github_store() {
	return {
		get cache_map() {
			return cache_map;
		},
		get availability() {
			return availability;
		},
		get is_available() {
			return is_available;
		},
		get syncing() {
			return syncing;
		},
		get sync_error() {
			return sync_error;
		},
		get last_sync_time() {
			return last_sync_time;
		},
		get assigned_issues() {
			return assigned_issues;
		},

		get_cache(issue_id: string): GitHubStatusCache | undefined {
			return cache_map.get(issue_id);
		},

		async check_availability() {
			try {
				availability = await check_gh_availability();
			} catch {
				availability = 'not-installed';
			}
		},

		async load_caches(dashboard_id: string) {
			try {
				const caches = await get_all_github_status_caches(dashboard_id);
				cache_map = build_cache_map(caches);
			} catch (err) {
				console.error('Failed to load GitHub caches:', err);
			}
		},

		async load_assigned_issues(owner: string, repo: string) {
			try {
				assigned_issues = await fetch_assigned_issues(owner, repo);
			} catch (err) {
				console.error('Failed to load assigned issues:', err);
			}
		},

		async sync_all(
			dashboard_id: string,
			owner: string,
			repo: string,
		): Promise<SyncAllResult | null> {
			if (syncing) {
				return null;
			}
			try {
				syncing = true;
				sync_error = null;
				const result = await sync_all_github_state(dashboard_id, owner, repo);
				last_sync_time = new Date();

				// Reload caches after sync
				const caches = await get_all_github_status_caches(dashboard_id);
				cache_map = build_cache_map(caches);

				if (result.errors.length > 0) {
					sync_error = result.errors.join('; ');
				}
				return result;
			} catch (err) {
				sync_error = String(err);
				return null;
			} finally {
				syncing = false;
			}
		},
	};
}
