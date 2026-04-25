import type { Issue } from '$lib/types/issue';
import type { WorktreeProgressPayload, WorktreeStateChangePayload } from '$lib/types/worktree';
import { getIssuesForDashboard } from '$lib/tauri/issue_commands';
import { listen, type UnlistenFn } from '@tauri-apps/api/event';

export type SortMode = 'priority' | 'name' | 'date';

const PRIORITY_ORDER: Record<string, number> = { top: 0, high: 1, medium: 2, low: 3 };

let issues = $state<Issue[]>([]);
let sortMode = $state<SortMode>('date');
let showArchived = $state(false);
let loading = $state(false);
let error = $state<string | null>(null);
let currentDashboardId = $state<string | null>(null);

// Worktree progress: per-issue log lines
let worktreeProgress = $state<Map<string, string[]>>(new Map());

const sortedIssues = $derived.by(() => {
	const list = [...issues];
	switch (sortMode) {
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

const activeIssues = $derived(sortedIssues.filter((issue) => issue.status === 'active'));
const archivedIssues = $derived(sortedIssues.filter((issue) => issue.status === 'archived'));

const parentIssues = $derived(activeIssues.filter((issue) => !issue.parent_issue_id));

function getChildren(parentId: string): Issue[] {
	return activeIssues.filter((issue) => issue.parent_issue_id === parentId);
}

// Event listener cleanup handles
let unlistenProgress: UnlistenFn | null = null;
let unlistenStateChange: UnlistenFn | null = null;

async function startWorktreeListeners() {
	// Clean up any existing listeners to avoid double-registration on dashboard switch
	stopWorktreeListeners();

	unlistenProgress = await listen<WorktreeProgressPayload>('worktree-progress', (event) => {
		const { issue_id: issueId, line } = event.payload;
		const existing = worktreeProgress.get(issueId) ?? [];
		worktreeProgress = new Map(worktreeProgress).set(issueId, [...existing, line]);
	});

	unlistenStateChange = await listen<WorktreeStateChangePayload>(
		'worktree-state-change',
		(event) => {
			const {
				issue_id: issueId,
				new_state: newState,
				worktree_folder: worktreeFolder,
			} = event.payload;
			// Update the local issue state optimistically
			issues = issues.map((issue) => {
				if (issue.id !== issueId) {
					return issue;
				}
				return {
					...issue,
					worktree_state: newState,
					worktree_folder:
						newState === 'none' ? null : (worktreeFolder ?? issue.worktree_folder),
				};
			});

			// Clear progress log when transitioning out of pending
			if (newState !== 'pending') {
				const updated = new Map(worktreeProgress);
				updated.delete(issueId);
				worktreeProgress = updated;
			}
		},
	);
}

function stopWorktreeListeners() {
	unlistenProgress?.();
	unlistenStateChange?.();
	unlistenProgress = null;
	unlistenStateChange = null;
}

function getProgressLines(issueId: string): readonly string[] {
	return worktreeProgress.get(issueId) ?? [];
}

export function getIssueStore() {
	return {
		get issues() {
			return issues;
		},
		get activeIssues() {
			return activeIssues;
		},
		get archivedIssues() {
			return archivedIssues;
		},
		get parentIssues() {
			return parentIssues;
		},
		get sortMode() {
			return sortMode;
		},
		get showArchived() {
			return showArchived;
		},
		get loading() {
			return loading;
		},
		get error() {
			return error;
		},

		getChildren,
		getProgressLines,

		async loadIssues(dashboardId: string) {
			try {
				loading = true;
				currentDashboardId = dashboardId;
				issues = await getIssuesForDashboard(dashboardId, true);
				error = null;
				await startWorktreeListeners();
			} catch (err) {
				error = String(err);
			} finally {
				loading = false;
			}
		},

		async refresh() {
			if (currentDashboardId) {
				try {
					issues = await getIssuesForDashboard(currentDashboardId, true);
					error = null;
				} catch (err) {
					error = String(err);
				}
			}
		},

		setSortMode(mode: SortMode) {
			sortMode = mode;
		},

		toggleShowArchived() {
			showArchived = !showArchived;
		},

		cleanup() {
			stopWorktreeListeners();
		},
	};
}
