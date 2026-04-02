export type WorktreeState = 'none' | 'pending' | 'active' | 'failed';

export interface SetupWorktreeRequest {
	issue_id: string;
	branch_name: string;
	color?: string | null;
	working_directory: string;
	base_branch?: string | null;
}

export interface RemoveWorktreeRequest {
	issue_id: string;
	branch_name: string;
	working_directory: string;
}

export interface WorktreeProgressPayload {
	issue_id: string;
	source: 'stdout' | 'stderr';
	line: string;
}

export interface WorktreeStateChangePayload {
	issue_id: string;
	old_state: WorktreeState;
	new_state: WorktreeState;
	worktree_folder: string | null;
}

export interface PrunableIssue {
	issue_id: string;
	name: string;
	branch_name: string;
	worktree_folder: string | null;
	pr_state: string | null;
	github_issue_state: string | null;
	branch_status: string | null;
}
