import { describe, it, expect } from 'vitest';
import { getAvailableActions, ISSUE_DETAIL_ACTIONS } from './issue_detail_utils.js';
import type { WorktreeState } from '$lib/modules/issues';

function makeIssueState(
	overrides: {
		status?: string;
		worktree_state?: WorktreeState;
		github_issue_url?: string | null;
		branch_name?: string | null;
	} = {},
) {
	return {
		status: overrides.status ?? 'active',
		worktree_state: overrides.worktree_state ?? 'none',
		github_issue_url: overrides.github_issue_url ?? null,
		branch_name: overrides.branch_name ?? null,
	};
}

function findAction(actions: ReturnType<typeof getAvailableActions>, id: string) {
	return actions.find((a) => a.id === id);
}

describe('getAvailableActions', () => {
	it('edit, priority, color, delete are always available', () => {
		const actions = getAvailableActions(makeIssueState());
		expect(findAction(actions, ISSUE_DETAIL_ACTIONS.edit)?.available).toBe(true);
		expect(findAction(actions, ISSUE_DETAIL_ACTIONS.priority)?.available).toBe(true);
		expect(findAction(actions, ISSUE_DETAIL_ACTIONS.color)?.available).toBe(true);
		expect(findAction(actions, ISSUE_DETAIL_ACTIONS.delete)?.available).toBe(true);
	});

	it('rename is available when no github_issue_url', () => {
		const actions = getAvailableActions(makeIssueState({ github_issue_url: null }));
		expect(findAction(actions, ISSUE_DETAIL_ACTIONS.rename)?.available).toBe(true);
	});

	it('rename is unavailable when github_issue_url exists', () => {
		const actions = getAvailableActions(
			makeIssueState({ github_issue_url: 'https://github.com/o/r/issues/1' }),
		);
		expect(findAction(actions, ISSUE_DETAIL_ACTIONS.rename)?.available).toBe(false);
	});

	it('setupWorktree is available when branch exists and worktree_state is none', () => {
		const actions = getAvailableActions(
			makeIssueState({ branch_name: 'feat/x', worktree_state: 'none' }),
		);
		expect(findAction(actions, ISSUE_DETAIL_ACTIONS.setupWorktree)?.available).toBe(true);
	});

	it('setupWorktree is available when branch exists and worktree_state is failed', () => {
		const actions = getAvailableActions(
			makeIssueState({ branch_name: 'feat/x', worktree_state: 'failed' }),
		);
		expect(findAction(actions, ISSUE_DETAIL_ACTIONS.setupWorktree)?.available).toBe(true);
	});

	it('setupWorktree is unavailable when no branch_name', () => {
		const actions = getAvailableActions(
			makeIssueState({ branch_name: null, worktree_state: 'none' }),
		);
		expect(findAction(actions, ISSUE_DETAIL_ACTIONS.setupWorktree)?.available).toBe(false);
	});

	it('setupWorktree is unavailable when worktree is active', () => {
		const actions = getAvailableActions(
			makeIssueState({ branch_name: 'feat/x', worktree_state: 'active' }),
		);
		expect(findAction(actions, ISSUE_DETAIL_ACTIONS.setupWorktree)?.available).toBe(false);
	});

	it('removeWorktree is available when worktree_state is active', () => {
		const actions = getAvailableActions(makeIssueState({ worktree_state: 'active' }));
		expect(findAction(actions, ISSUE_DETAIL_ACTIONS.removeWorktree)?.available).toBe(true);
	});

	it('removeWorktree is unavailable when worktree_state is none', () => {
		const actions = getAvailableActions(makeIssueState({ worktree_state: 'none' }));
		expect(findAction(actions, ISSUE_DETAIL_ACTIONS.removeWorktree)?.available).toBe(false);
	});

	it('archive is available and unarchive unavailable for active issues', () => {
		const actions = getAvailableActions(makeIssueState({ status: 'active' }));
		expect(findAction(actions, ISSUE_DETAIL_ACTIONS.archive)?.available).toBe(true);
		expect(findAction(actions, ISSUE_DETAIL_ACTIONS.unarchive)?.available).toBe(false);
	});

	it('unarchive is available and archive unavailable for archived issues', () => {
		const actions = getAvailableActions(makeIssueState({ status: 'archived' }));
		expect(findAction(actions, ISSUE_DETAIL_ACTIONS.unarchive)?.available).toBe(true);
		expect(findAction(actions, ISSUE_DETAIL_ACTIONS.archive)?.available).toBe(false);
	});
});
