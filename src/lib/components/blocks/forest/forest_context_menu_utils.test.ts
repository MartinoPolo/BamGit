import { describe, it, expect } from 'vitest';
import { isContextMenuActionEnabled } from './forest_context_menu_utils.js';
import { TREE_CONTEXT_MENU_ACTIONS } from '$lib/modules/visualization';

describe('isContextMenuActionEnabled', () => {
	it('returns true for archive action', () => {
		expect(isContextMenuActionEnabled(TREE_CONTEXT_MENU_ACTIONS.archive)).toBe(true);
	});

	it('returns true for changeColor action', () => {
		expect(isContextMenuActionEnabled(TREE_CONTEXT_MENU_ACTIONS.changeColor)).toBe(true);
	});

	it('returns false for openGithub action', () => {
		expect(isContextMenuActionEnabled(TREE_CONTEXT_MENU_ACTIONS.openGithub)).toBe(false);
	});

	it('returns false for openWorktree action', () => {
		expect(isContextMenuActionEnabled(TREE_CONTEXT_MENU_ACTIONS.openWorktree)).toBe(false);
	});

	it('returns false for startSession action', () => {
		expect(isContextMenuActionEnabled(TREE_CONTEXT_MENU_ACTIONS.startSession)).toBe(false);
	});

	it('returns false for pruneWorktree action', () => {
		expect(isContextMenuActionEnabled(TREE_CONTEXT_MENU_ACTIONS.pruneWorktree)).toBe(false);
	});
});
