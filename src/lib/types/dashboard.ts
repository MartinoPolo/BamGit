export interface Dashboard {
	id: string;
	name: string;
	type: 'repo' | 'portfolio';
	github_repo: string | null;
	local_folder: string | null;
	default_base_branch: string | null;
	worktree_parent_folder: string | null;
	color_palette_id: string | null;
}

export interface CreateDashboardRequest {
	name: string;
	type: 'repo' | 'portfolio';
	github_repo?: string | null;
	local_folder?: string | null;
	default_base_branch?: string | null;
	worktree_parent_folder?: string | null;
	color_palette_id?: string | null;
}

/** Absent key = no change, explicit null = clear the field */
export interface UpdateDashboardRequest {
	id: string;
	name?: string;
	type?: 'repo' | 'portfolio';
	github_repo?: string | null;
	local_folder?: string | null;
	default_base_branch?: string | null;
	worktree_parent_folder?: string | null;
	color_palette_id?: string | null;
}
