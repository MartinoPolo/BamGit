import { describe, it, expect } from 'vitest';
import {
	createIssueCardContext,
	type IssueCardContextProps,
} from '$lib/modules/issue-card/issue_card.context.svelte.js';
import { CARD_STATE_CLASSES } from './batch_selection_utils.js';
import type { Issue } from '$lib/modules/issues/index.js';

function makeIssue(overrides: Partial<Issue> = {}): Issue {
	return {
		id: 'issue-1',
		dashboard_id: 'dash-1',
		name: 'Test Issue',
		color: '#6366f1',
		priority: 'medium',
		status: 'active',
		worktree_state: 'none',
		branch_name: null,
		base_branch: null,
		worktree_folder: null,
		github_issue_url: null,
		github_issue_number: null,
		parent_issue_id: null,
		labels: [],
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
		isActive: false,
		isHovered: false,
		isBatchSelected: false,
		isModifierHeld: false,
		...overrides,
	};
}

describe('cardStateClass integration via IssueCardContext', () => {
	it('returns empty string for default state (all false)', () => {
		const ctx = createIssueCardContext(() => makeProps());
		expect(ctx.cardStateClass).toBe('');
	});

	it('returns archived class when issue is archived', () => {
		const ctx = createIssueCardContext(() =>
			makeProps({ issue: makeIssue({ status: 'archived' }) }),
		);
		expect(ctx.cardStateClass).toBe(CARD_STATE_CLASSES.archived);
	});

	it('returns selected class when batch selected', () => {
		const ctx = createIssueCardContext(() => makeProps({ isBatchSelected: true }));
		expect(ctx.cardStateClass).toBe(CARD_STATE_CLASSES.selected);
	});

	it('returns active class when active', () => {
		const ctx = createIssueCardContext(() => makeProps({ isActive: true }));
		expect(ctx.cardStateClass).toBe(CARD_STATE_CLASSES.active);
	});

	it('returns hovered class when hovered', () => {
		const ctx = createIssueCardContext(() => makeProps({ isHovered: true }));
		expect(ctx.cardStateClass).toBe(CARD_STATE_CLASSES.hovered);
	});

	it('returns selection-hover class when hovered with modifier held', () => {
		const ctx = createIssueCardContext(() =>
			makeProps({ isHovered: true, isModifierHeld: true }),
		);
		expect(ctx.cardStateClass).toBe(CARD_STATE_CLASSES.selectionHover);
	});

	describe('priority ordering', () => {
		it('archived takes priority over selected', () => {
			const ctx = createIssueCardContext(() =>
				makeProps({
					issue: makeIssue({ status: 'archived' }),
					isBatchSelected: true,
				}),
			);
			expect(ctx.cardStateClass).toBe(CARD_STATE_CLASSES.archived);
		});

		it('selected takes priority over active', () => {
			const ctx = createIssueCardContext(() =>
				makeProps({
					isBatchSelected: true,
					isActive: true,
				}),
			);
			expect(ctx.cardStateClass).toBe(CARD_STATE_CLASSES.selected);
		});

		it('active takes priority over hovered', () => {
			const ctx = createIssueCardContext(() =>
				makeProps({
					isActive: true,
					isHovered: true,
				}),
			);
			expect(ctx.cardStateClass).toBe(CARD_STATE_CLASSES.active);
		});

		it('archived takes priority over all other states', () => {
			const ctx = createIssueCardContext(() =>
				makeProps({
					issue: makeIssue({ status: 'archived' }),
					isBatchSelected: true,
					isActive: true,
					isHovered: true,
					isModifierHeld: true,
				}),
			);
			expect(ctx.cardStateClass).toBe(CARD_STATE_CLASSES.archived);
		});
	});
});
