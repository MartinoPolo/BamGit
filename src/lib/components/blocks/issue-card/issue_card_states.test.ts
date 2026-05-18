import { describe, it, expect } from 'vitest';
import { createIssueCardContext, type IssueCardContextProps } from './issue_card.context.svelte.js';
import { ISSUE_CARD_SETTING_DEFAULTS } from './issue_card_settings.js';
import { ISSUE_CARD_STATES } from './issue_card_variants.js';
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
		appearanceSettings: { ...ISSUE_CARD_SETTING_DEFAULTS },
		isActive: false,
		isHovered: false,
		isBatchSelected: false,
		isModifierHeld: false,
		...overrides,
	};
}

describe('cardState derivation via IssueCardContext', () => {
	it('returns interactive for default state (all false)', () => {
		const ctx = createIssueCardContext(() => makeProps());
		expect(ctx.cardState).toBe(ISSUE_CARD_STATES.interactive);
	});

	it('returns archived when issue is archived', () => {
		const ctx = createIssueCardContext(() =>
			makeProps({ issue: makeIssue({ status: 'archived' }) }),
		);
		expect(ctx.cardState).toBe(ISSUE_CARD_STATES.archived);
	});

	it('returns selected when batch selected', () => {
		const ctx = createIssueCardContext(() => makeProps({ isBatchSelected: true }));
		expect(ctx.cardState).toBe(ISSUE_CARD_STATES.selected);
	});

	it('returns active when active', () => {
		const ctx = createIssueCardContext(() => makeProps({ isActive: true }));
		expect(ctx.cardState).toBe(ISSUE_CARD_STATES.active);
	});

	it('returns hovered when hovered', () => {
		const ctx = createIssueCardContext(() => makeProps({ isHovered: true }));
		expect(ctx.cardState).toBe(ISSUE_CARD_STATES.hovered);
	});

	it('returns selectionHover when hovered with modifier held', () => {
		const ctx = createIssueCardContext(() =>
			makeProps({ isHovered: true, isModifierHeld: true }),
		);
		expect(ctx.cardState).toBe(ISSUE_CARD_STATES.selectionHover);
	});

	describe('priority ordering', () => {
		it('archived takes priority over selected', () => {
			const ctx = createIssueCardContext(() =>
				makeProps({
					issue: makeIssue({ status: 'archived' }),
					isBatchSelected: true,
				}),
			);
			expect(ctx.cardState).toBe(ISSUE_CARD_STATES.archived);
		});

		it('selected takes priority over active', () => {
			const ctx = createIssueCardContext(() =>
				makeProps({
					isBatchSelected: true,
					isActive: true,
				}),
			);
			expect(ctx.cardState).toBe(ISSUE_CARD_STATES.selected);
		});

		it('active takes priority over hovered', () => {
			const ctx = createIssueCardContext(() =>
				makeProps({
					isActive: true,
					isHovered: true,
				}),
			);
			expect(ctx.cardState).toBe(ISSUE_CARD_STATES.active);
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
			expect(ctx.cardState).toBe(ISSUE_CARD_STATES.archived);
		});
	});
});
