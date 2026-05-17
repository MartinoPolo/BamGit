import { describe, it, expect } from 'vitest';
import { createIssueCardContext, type IssueCardContextProps } from './issue_card.context.svelte.js';
import { ISSUE_CARD_STATES } from './issue_card_variants.js';
import type { Issue } from '$lib/modules/issues/index.js';
import type { GitStatusCache } from '$lib/types/generated';
import { ISSUE_CARD_SETTING_DEFAULTS } from './issue_card_settings.js';

function makeIssue(overrides: Partial<Issue> = {}): Issue {
	return {
		id: 'issue-1',
		dashboard_id: 'dash-1',
		name: 'Test Issue',
		color: '#3182ce',
		priority: 'medium',
		status: 'active',
		worktree_state: 'none',
		labels: [],
		github_issue_url: null,
		github_issue_number: null,
		branch_name: null,
		base_branch: null,
		worktree_folder: null,
		parent_issue_id: null,
		editor_folder: null,
		dev_server_command: null,
		dev_server_port: null,
		dev_server_pid: null,
		browser_url: null,
		character_pack_id: null,
		character_avatar: null,
		is_sound_muted: false,
		sort_order: 0,
		created_at: '2026-01-01T00:00:00Z',
		...overrides,
	};
}

function makeProps(overrides: Partial<IssueCardContextProps> = {}): IssueCardContextProps {
	return {
		issue: makeIssue(),
		cache: null,
		ghAvailable: true,
		notificationDotColor: null,
		prdParent: null,
		prioritiesEnabled: true,
		sessionState: null,
		visualization: undefined,
		appearanceSettings: { ...ISSUE_CARD_SETTING_DEFAULTS },
		isActive: false,
		isHovered: false,
		isBatchSelected: false,
		isModifierHeld: false,
		...overrides,
	};
}

describe('IssueCardContext', () => {
	describe('color derivation', () => {
		it('returns issue.color when present', () => {
			const ctx = createIssueCardContext(() =>
				makeProps({
					issue: makeIssue({ color: '#e53e3e' }),
				}),
			);
			expect(ctx.color).toBe('#e53e3e');
		});

		it('returns #525252 when issue.color is null', () => {
			const ctx = createIssueCardContext(() =>
				makeProps({
					issue: makeIssue({ color: null }),
				}),
			);
			expect(ctx.color).toBe('#525252');
		});
	});

	describe('headerTextColor derivation', () => {
		it('returns #ffffff for dark background colors', () => {
			const ctx = createIssueCardContext(() =>
				makeProps({
					issue: makeIssue({ color: '#1a202c' }),
				}),
			);
			expect(ctx.headerTextColor).toBe('#ffffff');
		});

		it('returns #000000 for light background colors', () => {
			const ctx = createIssueCardContext(() =>
				makeProps({
					issue: makeIssue({ color: '#f6e05e' }),
				}),
			);
			expect(ctx.headerTextColor).toBe('#000000');
		});
	});

	describe('isLightHeader derivation', () => {
		it('returns true when headerTextColor is #000000', () => {
			const ctx = createIssueCardContext(() =>
				makeProps({
					issue: makeIssue({ color: '#ffffff' }),
				}),
			);
			expect(ctx.isLightHeader).toBe(true);
		});

		it('returns false when headerTextColor is #ffffff', () => {
			const ctx = createIssueCardContext(() =>
				makeProps({
					issue: makeIssue({ color: '#1a202c' }),
				}),
			);
			expect(ctx.isLightHeader).toBe(false);
		});
	});

	describe('isArchived derivation', () => {
		it('returns true when issue.status is archived', () => {
			const ctx = createIssueCardContext(() =>
				makeProps({
					issue: makeIssue({ status: 'archived' }),
				}),
			);
			expect(ctx.isArchived).toBe(true);
		});

		it('returns false when issue.status is active', () => {
			const ctx = createIssueCardContext(() =>
				makeProps({
					issue: makeIssue({ status: 'active' }),
				}),
			);
			expect(ctx.isArchived).toBe(false);
		});
	});

	describe('hasWorktree derivation', () => {
		it('returns true for active worktree state', () => {
			const ctx = createIssueCardContext(() =>
				makeProps({
					issue: makeIssue({ worktree_state: 'active' }),
				}),
			);
			expect(ctx.hasWorktree).toBe(true);
		});

		it('returns true for pending worktree state', () => {
			const ctx = createIssueCardContext(() =>
				makeProps({
					issue: makeIssue({ worktree_state: 'pending' }),
				}),
			);
			expect(ctx.hasWorktree).toBe(true);
		});

		it('returns false for none worktree state', () => {
			const ctx = createIssueCardContext(() =>
				makeProps({
					issue: makeIssue({ worktree_state: 'none' }),
				}),
			);
			expect(ctx.hasWorktree).toBe(false);
		});

		it('returns false for failed worktree state', () => {
			const ctx = createIssueCardContext(() =>
				makeProps({
					issue: makeIssue({ worktree_state: 'failed' }),
				}),
			);
			expect(ctx.hasWorktree).toBe(false);
		});

		it('returns false for removing worktree state', () => {
			const ctx = createIssueCardContext(() =>
				makeProps({
					issue: makeIssue({ worktree_state: 'removing' }),
				}),
			);
			expect(ctx.hasWorktree).toBe(false);
		});

		it('returns false for removed worktree state', () => {
			const ctx = createIssueCardContext(() =>
				makeProps({
					issue: makeIssue({ worktree_state: 'removed' }),
				}),
			);
			expect(ctx.hasWorktree).toBe(false);
		});
	});

	describe('worktreeBadge derivation', () => {
		it('returns badge for active worktree', () => {
			const ctx = createIssueCardContext(() =>
				makeProps({
					issue: makeIssue({ worktree_state: 'active' }),
				}),
			);
			expect(ctx.worktreeBadge).toEqual({ label: 'Worktree', tone: 'success' });
		});

		it('returns badge for pending worktree', () => {
			const ctx = createIssueCardContext(() =>
				makeProps({
					issue: makeIssue({ worktree_state: 'pending' }),
				}),
			);
			expect(ctx.worktreeBadge).toEqual({ label: 'Setting up', tone: 'warning' });
		});

		it('returns null for none worktree', () => {
			const ctx = createIssueCardContext(() =>
				makeProps({
					issue: makeIssue({ worktree_state: 'none' }),
				}),
			);
			expect(ctx.worktreeBadge).toBeNull();
		});
	});

	describe('cardState derivation', () => {
		it('returns archived for archived issues', () => {
			const ctx = createIssueCardContext(() =>
				makeProps({
					issue: makeIssue({ status: 'archived' }),
				}),
			);
			expect(ctx.cardState).toBe(ISSUE_CARD_STATES.archived);
		});

		it('returns selected for batch-selected issues', () => {
			const ctx = createIssueCardContext(() =>
				makeProps({
					isBatchSelected: true,
				}),
			);
			expect(ctx.cardState).toBe(ISSUE_CARD_STATES.selected);
		});

		it('returns active for active issues', () => {
			const ctx = createIssueCardContext(() =>
				makeProps({
					isActive: true,
				}),
			);
			expect(ctx.cardState).toBe(ISSUE_CARD_STATES.active);
		});

		it('returns hovered for hovered issues', () => {
			const ctx = createIssueCardContext(() =>
				makeProps({
					isHovered: true,
				}),
			);
			expect(ctx.cardState).toBe(ISSUE_CARD_STATES.hovered);
		});

		it('returns interactive for default state', () => {
			const ctx = createIssueCardContext(() => makeProps());
			expect(ctx.cardState).toBe(ISSUE_CARD_STATES.interactive);
		});
	});

	describe('passthrough props', () => {
		it('exposes issue from props', () => {
			const issue = makeIssue({ name: 'My Issue' });
			const ctx = createIssueCardContext(() => makeProps({ issue }));
			expect(ctx.issue.name).toBe('My Issue');
		});

		it('exposes cache from props', () => {
			const cache: GitStatusCache = {
				issue_id: 'issue-1',
				branch_status: null,
				pr_state: null,
				pr_number: 42,
				pr_url: 'https://github.com/foo/bar/pull/42',
				github_issue_state: 'open',
				behind_base_count: null,
				merge_conflict: null,
				has_local_changes: null,
				ahead_remote_count: null,
				fetched_at: null,
				pr_ci_status: null,
			};
			const ctx = createIssueCardContext(() => makeProps({ cache }));
			expect(ctx.cache).toBe(cache);
		});

		it('exposes ghAvailable from props', () => {
			const ctx = createIssueCardContext(() => makeProps({ ghAvailable: false }));
			expect(ctx.ghAvailable).toBe(false);
		});

		it('exposes callbacks from props', () => {
			const onTitleClick = () => {};
			const ctx = createIssueCardContext(() => makeProps({ onTitleClick }));
			expect(ctx.onTitleClick).toBe(onTitleClick);
		});
	});
});
