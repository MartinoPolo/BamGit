import { describe, it, expect } from 'vitest';
import { createIssueCardContext, type IssueCardContextProps } from './issue_card.context.svelte.js';
import { ISSUE_CARD_SETTING_DEFAULTS } from './issue_card_settings.js';
import type { Issue } from '$lib/modules/issues/index.js';
import type { GitStatusCache } from '$lib/types/generated';

function makeIssue(overrides: Partial<Issue> = {}): Issue {
	return {
		id: 'issue-1',
		dashboard_id: 'dash-1',
		name: 'Test Issue',
		color: '#6366f1',
		priority: 'medium',
		status: 'active',
		worktree_state: 'active',
		branch_name: 'feat/test',
		base_branch: 'main',
		worktree_folder: '/tmp/test',
		github_issue_url: 'https://github.com/test/repo/issues/1',
		github_issue_number: 1,
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

function makeCache(overrides: Partial<GitStatusCache> = {}): GitStatusCache {
	return {
		issue_id: 'issue-1',
		branch_status: null,
		pr_state: null,
		pr_number: null,
		pr_url: null,
		github_issue_state: 'open',
		behind_base_count: null,
		merge_conflict: null,
		has_local_changes: null,
		ahead_remote_count: null,
		fetched_at: null,
		pr_ci_status: null,
		...overrides,
	};
}

describe('chipState mapping via IssueCardContext', () => {
	it('returns null when sessionState is null and no worktree triggers', () => {
		const ctx = createIssueCardContext(() =>
			makeProps({
				sessionState: null,
				issue: makeIssue({ worktree_state: 'active' }),
			}),
		);
		expect(ctx.chipState).toBeNull();
	});

	it('maps sessionState "executing" to EXECUTING label', () => {
		const ctx = createIssueCardContext(() => makeProps({ sessionState: 'executing' }));
		expect(ctx.chipState).not.toBeNull();
		expect(ctx.chipState!.label).toBe('EXECUTING');
	});

	it('maps sessionState "error" to ERROR label', () => {
		const ctx = createIssueCardContext(() => makeProps({ sessionState: 'error' }));
		expect(ctx.chipState).not.toBeNull();
		expect(ctx.chipState!.label).toBe('ERROR');
	});

	it('maps sessionState "hitl" to NEEDS INPUT label', () => {
		const ctx = createIssueCardContext(() => makeProps({ sessionState: 'hitl' }));
		expect(ctx.chipState).not.toBeNull();
		expect(ctx.chipState!.label).toBe('NEEDS INPUT');
	});

	it('maps sessionState "review" to REVIEW label', () => {
		const ctx = createIssueCardContext(() => makeProps({ sessionState: 'review' }));
		expect(ctx.chipState).not.toBeNull();
		expect(ctx.chipState!.label).toBe('REVIEW');
	});

	it('maps sessionState "paused" to PAUSED label', () => {
		const ctx = createIssueCardContext(() => makeProps({ sessionState: 'paused' }));
		expect(ctx.chipState).not.toBeNull();
		expect(ctx.chipState!.label).toBe('PAUSED');
	});

	it('maps sessionState "done" with closed issue + merged PR to DONE label', () => {
		const ctx = createIssueCardContext(() =>
			makeProps({
				sessionState: 'done',
				cache: makeCache({
					github_issue_state: 'closed',
					pr_state: 'merged',
				}),
			}),
		);
		expect(ctx.chipState).not.toBeNull();
		expect(ctx.chipState!.label).toBe('DONE');
	});

	it('maps sessionState "done" without closed issue + merged PR to null', () => {
		const ctx = createIssueCardContext(() =>
			makeProps({
				sessionState: 'done',
				cache: makeCache({
					github_issue_state: 'open',
					pr_state: null,
				}),
			}),
		);
		// 'done' maps to 'finished' aggregate which doesn't trigger a chip on its own
		// without closed+merged conditions
		expect(ctx.chipState).toBeNull();
	});

	describe('priority: session state overrides PR/sync states', () => {
		it('error overrides merge conflict from cache', () => {
			const ctx = createIssueCardContext(() =>
				makeProps({
					sessionState: 'error',
					cache: makeCache({ merge_conflict: true }),
				}),
			);
			expect(ctx.chipState!.label).toBe('ERROR');
		});

		it('hitl overrides behind-base from cache', () => {
			const ctx = createIssueCardContext(() =>
				makeProps({
					sessionState: 'hitl',
					cache: makeCache({ behind_base_count: 5 }),
				}),
			);
			expect(ctx.chipState!.label).toBe('NEEDS INPUT');
		});
	});
});
