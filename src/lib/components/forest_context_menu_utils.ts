import { TREE_CONTEXT_MENU_ACTIONS, type TreeContextMenuAction } from '$lib/modules/visualization';

const ENABLED_CONTEXT_MENU_ACTIONS = new Set<TreeContextMenuAction>([
	TREE_CONTEXT_MENU_ACTIONS.archive,
	TREE_CONTEXT_MENU_ACTIONS.changeColor,
]);

export function isContextMenuActionEnabled(action: TreeContextMenuAction): boolean {
	return ENABLED_CONTEXT_MENU_ACTIONS.has(action);
}
