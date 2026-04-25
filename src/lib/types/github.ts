export type PullRequestState =
	| 'open'
	| 'draft'
	| 'review-requested'
	| 'changes-requested'
	| 'approved'
	| 'ready-to-merge'
	| 'merged'
	| 'closed';

export type GitHubIssueState = 'open' | 'closed';

export type GhCliAvailability = 'available' | 'not-installed' | 'not-authenticated';

export interface GitHubStatusCache {
	issue_id: string;
	branch_status: string | null;
	pr_state: PullRequestState | null;
	pr_number: number | null;
	pr_url: string | null;
	github_issue_state: GitHubIssueState | null;
	behind_base_count: number | null;
	merge_conflict: boolean | null;
	fetched_at: string | null;
}

export interface AssignedIssue {
	number: number;
	title: string;
	state: string;
	url: string;
}

export interface SyncAllResult {
	synced_count: number;
	errors: string[];
}
