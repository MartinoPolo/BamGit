export type BranchStatus = 'active' | 'local' | 'remote-gone' | 'deleted' | 'unknown';

export interface GitStatusCache {
	issue_id: string;
	branch_status: BranchStatus | null;
	pr_state: string | null;
	pr_number: number | null;
	pr_url: string | null;
	github_issue_state: string | null;
	behind_base_count: number | null;
	merge_conflict: boolean | null;
	fetched_at: string | null;
}

export const BRANCH_STATUS_COLOR: Record<BranchStatus, string> = {
	active: 'bg-green-900/60 text-green-300',
	local: 'bg-blue-900/60 text-blue-300',
	'remote-gone': 'bg-orange-900/60 text-orange-300',
	deleted: 'bg-red-900/60 text-red-300 line-through',
	unknown: 'bg-muted text-muted-foreground',
};

export const BRANCH_STATUS_TOOLTIP: Record<BranchStatus, string> = {
	active: 'Branch exists locally and on remote',
	local: 'Branch exists locally only (not pushed)',
	'remote-gone': 'Remote branch deleted',
	deleted: 'Branch deleted',
	unknown: 'Branch status unknown',
};

export const BRANCH_NAME_MAX_DISPLAY_LENGTH = 16;
