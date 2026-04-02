import type { Issue } from '$lib/types/issue';
import type { WorktreeProgressPayload, WorktreeStateChangePayload } from '$lib/types/worktree';
import { get_issues_for_dashboard } from '$lib/tauri/issue_commands';
import { listen, type UnlistenFn } from '@tauri-apps/api/event';

export type SortMode = 'priority' | 'name' | 'date';

const PRIORITY_ORDER: Record<string, number> = { top: 0, high: 1, medium: 2, low: 3 };

let issues = $state<Issue[]>([]);
let sort_mode = $state<SortMode>('date');
let show_archived = $state(false);
let loading = $state(false);
let error = $state<string | null>(null);
let current_dashboard_id = $state<string | null>(null);

// Worktree progress: per-issue log lines
let worktree_progress = $state<Map<string, string[]>>(new Map());

const sorted_issues = $derived.by(() => {
	const list = [...issues];
	switch (sort_mode) {
		case 'priority':
			return list.sort(
				(a, b) =>
					(PRIORITY_ORDER[a.priority ?? 'low'] ?? 4) -
					(PRIORITY_ORDER[b.priority ?? 'low'] ?? 4),
			);
		case 'name':
			return list.sort((a, b) => a.name.localeCompare(b.name));
		case 'date':
			return list.sort(
				(a, b) => a.sort_order - b.sort_order || a.created_at.localeCompare(b.created_at),
			);
	}
});

const active_issues = $derived(sorted_issues.filter((issue) => issue.status === 'active'));
const archived_issues = $derived(sorted_issues.filter((issue) => issue.status === 'archived'));

const parent_issues = $derived(active_issues.filter((issue) => !issue.parent_issue_id));

function get_children(parent_id: string): Issue[] {
	return active_issues.filter((issue) => issue.parent_issue_id === parent_id);
}

// Event listener cleanup handles
let unlisten_progress: UnlistenFn | null = null;
let unlisten_state_change: UnlistenFn | null = null;

async function start_worktree_listeners() {
	// Clean up any existing listeners to avoid double-registration on dashboard switch
	stop_worktree_listeners();

	unlisten_progress = await listen<WorktreeProgressPayload>('worktree-progress', (event) => {
		const { issue_id, line } = event.payload;
		const existing = worktree_progress.get(issue_id) ?? [];
		worktree_progress = new Map(worktree_progress).set(issue_id, [...existing, line]);
	});

	unlisten_state_change = await listen<WorktreeStateChangePayload>(
		'worktree-state-change',
		(event) => {
			const { issue_id, new_state, worktree_folder } = event.payload;
			// Update the local issue state optimistically
			issues = issues.map((issue) => {
				if (issue.id !== issue_id) {
					return issue;
				}
				return {
					...issue,
					worktree_state: new_state,
					worktree_folder:
						new_state === 'none' ? null : (worktree_folder ?? issue.worktree_folder),
				};
			});

			// Clear progress log when transitioning out of pending
			if (new_state !== 'pending') {
				const updated = new Map(worktree_progress);
				updated.delete(issue_id);
				worktree_progress = updated;
			}
		},
	);
}

function stop_worktree_listeners() {
	unlisten_progress?.();
	unlisten_state_change?.();
	unlisten_progress = null;
	unlisten_state_change = null;
}

function get_progress_lines(issue_id: string): readonly string[] {
	return worktree_progress.get(issue_id) ?? [];
}

export function get_issue_store() {
	return {
		get issues() {
			return issues;
		},
		get active_issues() {
			return active_issues;
		},
		get archived_issues() {
			return archived_issues;
		},
		get parent_issues() {
			return parent_issues;
		},
		get sort_mode() {
			return sort_mode;
		},
		get show_archived() {
			return show_archived;
		},
		get loading() {
			return loading;
		},
		get error() {
			return error;
		},

		get_children,
		get_progress_lines,

		async load_issues(dashboard_id: string) {
			try {
				loading = true;
				current_dashboard_id = dashboard_id;
				issues = await get_issues_for_dashboard(dashboard_id, true);
				error = null;
				await start_worktree_listeners();
			} catch (err) {
				error = String(err);
			} finally {
				loading = false;
			}
		},

		async refresh() {
			if (current_dashboard_id) {
				try {
					issues = await get_issues_for_dashboard(current_dashboard_id, true);
					error = null;
				} catch (err) {
					error = String(err);
				}
			}
		},

		set_sort_mode(mode: SortMode) {
			sort_mode = mode;
		},

		toggle_show_archived() {
			show_archived = !show_archived;
		},

		cleanup() {
			stop_worktree_listeners();
		},
	};
}
