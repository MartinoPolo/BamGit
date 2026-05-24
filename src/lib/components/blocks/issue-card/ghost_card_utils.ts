import type { AssignedIssue } from '$lib/types/generated';
import type { Issue } from '$lib/modules/issues';
import { categorizeAssignedIssues } from '$lib/components/blocks/issue/assigned_issues_utils.js';

export function assignedIssueToGhostIssue(assigned: AssignedIssue): Issue {
	return {
		id: `ghost-${assigned.number}`,
		dashboard_id: '',
		name: assigned.title,
		priority: null,
		color: null,
		status: 'active',
		github_issue_url: assigned.url,
		github_issue_number: assigned.number,
		branch_name: null,
		base_branch: null,
		worktree_folder: null,
		worktree_state: 'none',
		parent_issue_id: null,
		editor_folder: null,
		dev_server_command: null,
		dev_server_port: null,
		dev_server_pid: null,
		browser_url: null,
		labels: assigned.labels,
		sort_order: 0,
		created_at: '',
		character_pack_id: null,
		character_avatar: null,
		is_sound_muted: false,
	};
}

export function getUnlinkedOpenAssignedIssues(
	assignedIssues: readonly AssignedIssue[],
	dashboardIssues: readonly Issue[],
): AssignedIssue[] {
	const { unlinked } = categorizeAssignedIssues(assignedIssues, dashboardIssues);
	return unlinked.filter((issue) => issue.state !== 'CLOSED');
}
