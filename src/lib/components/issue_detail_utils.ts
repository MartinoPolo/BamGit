import type { WorktreeState } from '$lib/modules/issues';

/** @public */
export interface IssueDetailAction {
	id: string;
	available: boolean;
}

export const ISSUE_DETAIL_ACTIONS = {
	edit: 'edit',
	rename: 'rename',
	priority: 'priority',
	color: 'color',
	setupWorktree: 'setup-worktree',
	removeWorktree: 'remove-worktree',
	archive: 'archive',
	unarchive: 'unarchive',
	delete: 'delete',
} as const;

export function getAvailableActions(issue: {
	status: string;
	worktree_state: WorktreeState;
	github_issue_url: string | null;
	branch_name: string | null;
}): IssueDetailAction[] {
	const canRename = issue.github_issue_url === null;
	const canSetupWorktree =
		issue.branch_name !== null &&
		(issue.worktree_state === 'none' || issue.worktree_state === 'failed');
	const canRemoveWorktree = issue.worktree_state === 'active';
	const isActive = issue.status === 'active';

	return [
		{ id: ISSUE_DETAIL_ACTIONS.edit, available: true },
		{ id: ISSUE_DETAIL_ACTIONS.rename, available: canRename },
		{ id: ISSUE_DETAIL_ACTIONS.priority, available: true },
		{ id: ISSUE_DETAIL_ACTIONS.color, available: true },
		{ id: ISSUE_DETAIL_ACTIONS.setupWorktree, available: canSetupWorktree },
		{ id: ISSUE_DETAIL_ACTIONS.removeWorktree, available: canRemoveWorktree },
		{ id: ISSUE_DETAIL_ACTIONS.archive, available: isActive },
		{ id: ISSUE_DETAIL_ACTIONS.unarchive, available: !isActive },
		{ id: ISSUE_DETAIL_ACTIONS.delete, available: true },
	];
}
