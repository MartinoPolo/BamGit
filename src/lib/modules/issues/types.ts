import type { Issue as GeneratedIssue } from '$lib/types/generated';

export type WorktreeState = 'none' | 'pending' | 'active' | 'failed' | 'removing' | 'removed';

export type SortMode = 'priority' | 'name' | 'date';

/** @public */
export type IssuePriority = 'lowest' | 'low' | 'medium' | 'high' | 'top';

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
	priority?: IssuePriority | null;
	color?: string | null;
	github_issue_url?: string | null;
	github_issue_number?: number | null;
	parent_issue_id?: string | null;
	labels?: IssueLabel[];
}

export interface UpdateIssueRequest {
	id: string;
	name?: string;
	priority?: IssuePriority | null;
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
	onArchive: (issue: Issue) => void;
	onUnarchive: (id: string) => void;
	onEdit: (issue: Issue) => void;
	onDelete: (issue: Issue) => void;
	onChangePriority: (id: string, priority: IssuePriority | null) => void;
	onRename?: (issue: Issue) => void;
	onSetupWorktree?: (issue: Issue) => void;
	onRemoveWorktree?: (issue: Issue) => void;
	onExecuteAction?: (actionId: string, issueId: string) => void;
}
