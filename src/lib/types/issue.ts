export interface Issue {
	id: string;
	dashboard_id: string;
	name: string;
	priority: 'low' | 'medium' | 'high' | 'top' | null;
	color: string | null;
	status: 'active' | 'archived';
	github_issue_url: string | null;
	github_issue_number: number | null;
	branch_name: string | null;
	base_branch: string | null;
	worktree_folder: string | null;
	worktree_state: 'none' | 'pending' | 'active' | 'failed';
	parent_issue_id: string | null;
	editor_folder: string | null;
	dev_server_command: string | null;
	dev_server_port: number | null;
	dev_server_pid: number | null;
	browser_url: string | null;
	sort_order: number;
	created_at: string;
}

export interface CreateIssueRequest {
	dashboard_id: string;
	name: string;
	priority?: 'low' | 'medium' | 'high' | 'top' | null;
	color?: string | null;
	github_issue_url?: string | null;
	github_issue_number?: number | null;
	parent_issue_id?: string | null;
}

export interface UpdateIssueRequest {
	id: string;
	name?: string;
	priority?: 'low' | 'medium' | 'high' | 'top' | null;
	color?: string | null;
	github_issue_url?: string | null;
	github_issue_number?: number | null;
	parent_issue_id?: string | null;
	sort_order?: number;
}
