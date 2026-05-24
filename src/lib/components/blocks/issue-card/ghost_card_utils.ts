import type { AssignedIssue } from '$lib/types/generated';
import type { Issue } from '$lib/modules/issues';
import type { SplitButtonOption } from '$lib/components/derived/split-button/split_button_types.js';
import { categorizeAssignedIssues } from '$lib/components/blocks/issue/assigned_issues_utils.js';

export const ADOPT_ACTION_VALUES = {
	NO_WORKTREE: 'adopt',
	WITH_WORKTREE: 'adopt-worktree',
} as const;

export const ADOPT_SPLIT_BUTTON_OPTIONS: readonly SplitButtonOption[] = [
	{ value: ADOPT_ACTION_VALUES.WITH_WORKTREE, label: 'Adopt with Worktree' },
	{ value: ADOPT_ACTION_VALUES.NO_WORKTREE, label: 'Adopt (no worktree)' },
] as const;

export const ADOPT_SETTINGS_KEY = 'adopt_default_action';

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
