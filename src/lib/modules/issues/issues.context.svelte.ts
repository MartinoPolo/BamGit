import { createContext, onDestroy } from 'svelte';
import { invoke, listen, type UnlistenFn } from '$lib/tauri.js';
import { SvelteMap } from 'svelte/reactivity';
import type {
	Issue as GeneratedIssue,
	IssueDependency,
	WorktreeProgressPayload,
	WorktreeStateChangePayload,
	PrunableIssue,
} from '$lib/types/generated';
import type {
	Issue,
	SortMode,
	WorktreeState,
	CreateIssueRequest,
	UpdateIssueRequest,
	SetupWorktreeRequest,
	RemoveWorktreeRequest,
} from './types.js';
import { PRIORITY_ORDER, PRIORITY_ORDER_NONE } from './priority.js';
import { serializeLabels, toIssue } from './serialization.js';

// ─── Context ───────────────────────────────────────────────────────────────

type IssuesContext = ReturnType<typeof createIssuesContext>;

const [useIssues, setIssuesInternal] = createContext<IssuesContext>();
export { useIssues };

export function setIssuesContext() {
	const ctx = createIssuesContext();
	setIssuesInternal(ctx);
	onDestroy(() => ctx.cleanup());
	return ctx;
}

// ─── Factory ───────────────────────────────────────────────────────────────

function createIssuesContext() {
	let issues = $state<Issue[]>([]);
	let dependencies = $state<IssueDependency[]>([]);
	let sortMode = $state<SortMode>('date');
	let showArchived = $state(false);
	let loading = $state(false);
	let error = $state<string | null>(null);
	let currentDashboardId = $state<string | null>(null);
	const worktreeProgress = new SvelteMap<string, string[]>();

	const sortedIssues = $derived.by(() => {
		const list = [...issues];
		switch (sortMode) {
			case 'priority':
				return list.sort(
					(a, b) =>
						(a.priority !== null ? PRIORITY_ORDER[a.priority] : PRIORITY_ORDER_NONE) -
						(b.priority !== null ? PRIORITY_ORDER[b.priority] : PRIORITY_ORDER_NONE),
				);
			case 'name':
				return list.sort((a, b) => a.name.localeCompare(b.name));
			case 'date':
				return list.sort(
					(a, b) =>
						a.sort_order - b.sort_order || a.created_at.localeCompare(b.created_at),
				);
		}
	});

	const activeIssues = $derived(sortedIssues.filter((issue) => issue.status === 'active'));
	const archivedIssues = $derived(sortedIssues.filter((issue) => issue.status === 'archived'));
	const parentIssues = $derived(activeIssues.filter((issue) => issue.parent_issue_id == null));

	const childrenByParentId = $derived.by(() => {
		const map = new SvelteMap<string, Issue[]>();
		for (const issue of activeIssues) {
			if (issue.parent_issue_id !== null) {
				const existing = map.get(issue.parent_issue_id);
				if (existing !== undefined) {
					existing.push(issue);
				} else {
					map.set(issue.parent_issue_id, [issue]);
				}
			}
		}
		return map;
	});

	function getChildren(parentId: string): Issue[] {
		return childrenByParentId.get(parentId) ?? [];
	}

	// ─── Worktree event listeners ──────────────────────────────────────────

	let unlistenProgress: UnlistenFn | null = null;
	let unlistenStateChange: UnlistenFn | null = null;

	async function startWorktreeListeners() {
		stopWorktreeListeners();

		unlistenProgress = await listen<WorktreeProgressPayload>('worktree-progress', (event) => {
			const { issue_id: issueId, line } = event.payload;
			const existing = worktreeProgress.get(issueId) ?? [];
			worktreeProgress.set(issueId, [...existing, line]);
		});

		unlistenStateChange = await listen<WorktreeStateChangePayload>(
			'worktree-state-change',
			(event) => {
				const {
					issue_id: issueId,
					new_state: newState,
					worktree_folder: worktreeFolder,
				} = event.payload;
				issues = issues.map((issue) => {
					if (issue.id !== issueId) {
						return issue;
					}
					return {
						...issue,
						worktree_state: newState as WorktreeState,
						worktree_folder:
							newState === 'none' ? null : (worktreeFolder ?? issue.worktree_folder),
					};
				});

				if (newState !== 'pending') {
					worktreeProgress.delete(issueId);
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

	// ─── IPC helpers ───────────────────────────────────────────────────────

	async function fetchIssues(dashboardId: string): Promise<Issue[]> {
		const rawIssues = await invoke<GeneratedIssue[]>('get_issues_for_dashboard', {
			dashboardId,
			includeArchived: true,
		});
		return rawIssues.map(toIssue);
	}

	async function fetchDependencies(dashboardId: string): Promise<IssueDependency[]> {
		return invoke<IssueDependency[]>('get_issue_dependencies', { dashboardId });
	}

	// ─── Public interface ──────────────────────────────────────────────────

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
		get dependencies() {
			return dependencies;
		},

		getChildren,
		getProgressLines,

		async loadIssues(dashboardId: string) {
			try {
				loading = true;
				currentDashboardId = dashboardId;
				[issues, dependencies] = await Promise.all([
					fetchIssues(dashboardId),
					fetchDependencies(dashboardId),
				]);
				error = null;
				await startWorktreeListeners();
			} catch (err) {
				error = String(err);
			} finally {
				loading = false;
			}
		},

		async refresh() {
			if (currentDashboardId != null) {
				try {
					[issues, dependencies] = await Promise.all([
						fetchIssues(currentDashboardId),
						fetchDependencies(currentDashboardId),
					]);
					error = null;
				} catch (err) {
					error = String(err);
				}
			}
		},

		async addIssue(request: CreateIssueRequest): Promise<Issue> {
			const raw = await invoke<GeneratedIssue>('create_issue', {
				request: {
					...request,
					labels: serializeLabels(request.labels),
				},
			});
			return toIssue(raw);
		},

		async updateIssue(request: UpdateIssueRequest): Promise<Issue> {
			const raw = await invoke<GeneratedIssue>('update_issue', {
				request: {
					...request,
					labels: serializeLabels(request.labels),
				},
			});
			return toIssue(raw);
		},

		async removeIssue(id: string): Promise<void> {
			return invoke('delete_issue', { id });
		},

		async archiveIssue(id: string): Promise<Issue> {
			const raw = await invoke<GeneratedIssue>('archive_issue', { id });
			return toIssue(raw);
		},

		async unarchiveIssue(id: string): Promise<Issue> {
			const raw = await invoke<GeneratedIssue>('unarchive_issue', { id });
			return toIssue(raw);
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

		// Worktree commands
		async setupWorktree(request: SetupWorktreeRequest): Promise<string> {
			return invoke('setup_worktree', { request });
		},

		async removeWorktree(request: RemoveWorktreeRequest): Promise<void> {
			return invoke('remove_worktree', { request });
		},

		async getPrunableIssues(dashboardId: string): Promise<PrunableIssue[]> {
			return invoke('get_prunable_issues', { dashboardId });
		},
	};
}
