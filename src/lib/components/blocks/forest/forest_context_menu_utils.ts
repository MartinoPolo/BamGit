import type { Issue } from '$lib/modules/issues';
import { TREE_CONTEXT_MENU_ACTIONS, type TreeContextMenuAction } from '$lib/modules/visualization';

const ALWAYS_ENABLED = new Set<TreeContextMenuAction>([
	TREE_CONTEXT_MENU_ACTIONS.archive,
	TREE_CONTEXT_MENU_ACTIONS.changeColor,
]);

export function isContextMenuActionEnabled(action: TreeContextMenuAction, issue: Issue): boolean {
	if (ALWAYS_ENABLED.has(action)) {
		return true;
	}
	if (action === TREE_CONTEXT_MENU_ACTIONS.openGithub) {
		return issue.github_issue_url !== null && issue.github_issue_url !== undefined;
	}
	if (action === TREE_CONTEXT_MENU_ACTIONS.openWorktree) {
		return issue.worktree_state === 'active' && issue.worktree_folder !== null;
	}
	return false;
}
