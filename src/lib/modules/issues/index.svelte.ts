import { createContext, onDestroy } from 'svelte';
import { invoke } from '@tauri-apps/api/core';
import { listen, type UnlistenFn } from '@tauri-apps/api/event';
import { SvelteMap } from 'svelte/reactivity';
import type {
	Issue as GeneratedIssue,
	WorktreeProgressPayload,
	WorktreeStateChangePayload,
	PrunableIssue,
} from '$lib/types/generated';

// ─── Public types ──────────────────────────────────────────────────────────

export type WorktreeState = 'none' | 'pending' | 'active' | 'failed' | 'removing' | 'removed';

export type SortMode = 'priority' | 'name' | 'date';

/** @public */
export type IssuePriority = 'low' | 'medium' | 'high' | 'top';

/** @public */
export type IssueStatus = 'active' | 'archived';

/** @public */
export interface IssueLabel {
	name: string;
	color: string;
}

/** Issue with deserialized labels and narrowed enum fields. */
export interface Issue extends Omit<
	GeneratedIssue,
	'labels' | 'priority' | 'status' | 'worktree_state'
> {
	labels: IssueLabel[];
	priority: IssuePriority | null;
	status: IssueStatus;
	worktree_state: WorktreeState;
}

export interface CreateIssueRequest {
	dashboard_id: string;
	name: string;
	priority?: 'low' | 'medium' | 'high' | 'top' | null;
	color?: string | null;
	github_issue_url?: string | null;
	github_issue_number?: number | null;
	parent_issue_id?: string | null;
	labels?: IssueLabel[];
}

export interface UpdateIssueRequest {
	id: string;
	name?: string;
	priority?: 'low' | 'medium' | 'high' | 'top' | null;
	color?: string | null;
	github_issue_url?: string | null;
	github_issue_number?: number | null;
	branch_name?: string | null;
	base_branch?: string | null;
	worktree_folder?: string | null;
	worktree_state?: string;
	parent_issue_id?: string | null;
	labels?: IssueLabel[];
	sort_order?: number;
}

/** @public */
export interface SetupWorktreeRequest {
	issue_id: string;
	branch_name: string;
	color?: string | null;
	working_directory: string;
	base_branch?: string | null;
}

/** @public */
export interface RemoveWorktreeRequest {
	issue_id: string;
	branch_name: string;
	working_directory: string;
}

export interface IssueCardCallbacks {
	onArchive: (id: string) => void;
	onUnarchive: (id: string) => void;
	onEdit: (issue: Issue) => void;
	onDelete: (id: string) => void;
	onSetupWorktree?: (issue: Issue) => void;
	onRemoveWorktree?: (issue: Issue) => void;
	onExecuteAction?: (actionId: string, issueId: string) => void;
}

// ─── Internal helpers (NOT exported) ───────────────────────────────────────

const HEX_COLOR_PATTERN = /^#[0-9a-fA-F]{6}$/;

function deserializeLabels(raw: string | null): IssueLabel[] {
	if (raw === null) {
		return [];
	}
	try {
		const parsed: unknown = JSON.parse(raw);
		if (!Array.isArray(parsed)) {
			return [];
		}
		return (parsed as IssueLabel[]).map((label) => ({
			...label,
			color: HEX_COLOR_PATTERN.test(label.color) ? label.color : '#808080',
		}));
	} catch {
		return [];
	}
}

function toIssue(raw: GeneratedIssue): Issue {
	return {
		...raw,
		labels: deserializeLabels(raw.labels),
		priority: raw.priority as IssuePriority | null,
		status: raw.status as IssueStatus,
		worktree_state: raw.worktree_state as WorktreeState,
	};
}

function serializeLabels(labels: IssueLabel[] | undefined): string | null | undefined {
	if (labels === undefined) {
		return undefined;
	}
	return JSON.stringify(labels);
}

const PRIORITY_ORDER: Record<string, number> = { top: 0, high: 1, medium: 2, low: 3 };

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
						(PRIORITY_ORDER[a.priority ?? 'low'] ?? 4) -
						(PRIORITY_ORDER[b.priority ?? 'low'] ?? 4),
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

		getChildren,
		getProgressLines,

		async loadIssues(dashboardId: string) {
			try {
				loading = true;
				currentDashboardId = dashboardId;
				issues = await fetchIssues(dashboardId);
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
					issues = await fetchIssues(currentDashboardId);
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

		// Worktree commands (inlined)
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
