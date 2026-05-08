import { describe, it, expect } from 'vitest';
import { OVERLAY_DEFAULTS, type OverlayConfig } from 'low-poly-2d-trees';
import { TREE_CONTEXT_MENU_ACTIONS, resolveGlowOverlay } from './index';
import type { TreeContextMenuAction, ResolveGlowOverlayParams } from './index';

// ════════════════════════════════════════════════════════════════════════
// Test Data
// ════════════════════════════════════════════════════════════════════════

const ISSUE_COLOR = '#ef4444';
const BATCH_SELECTED_COLOR = '#ec4899';

const STATE_ERRORED: OverlayConfig = {
	glow: { enabled: true, color: '#ff4444', intensity: 4, pulse: true },
};
const STATE_DISABLED: OverlayConfig = {
	glow: { enabled: false, color: '#ffd700', intensity: 3, pulse: false },
};

// ════════════════════════════════════════════════════════════════════════
// Shared Factories
// ════════════════════════════════════════════════════════════════════════

function createParams(overrides: Partial<ResolveGlowOverlayParams> = {}): ResolveGlowOverlayParams {
	return {
		stateOverlay: STATE_DISABLED,
		issueId: 'issue-1',
		hoveredIssueId: null,
		activeIssueId: null,
		issueColor: ISSUE_COLOR,
		batchSelectedIssueIds: new Set<string>(),
		batchSelectedGlowColor: BATCH_SELECTED_COLOR,
		...overrides,
	};
}

// ════════════════════════════════════════════════════════════════════════
// TREE_CONTEXT_MENU_ACTIONS
// ════════════════════════════════════════════════════════════════════════

describe('TREE_CONTEXT_MENU_ACTIONS', () => {
	it('has exactly 6 entries', () => {
		expect(Object.keys(TREE_CONTEXT_MENU_ACTIONS)).toHaveLength(6);
	});

	it('contains all expected keys', () => {
		expect(TREE_CONTEXT_MENU_ACTIONS.openGithub).toBe('open-github');
		expect(TREE_CONTEXT_MENU_ACTIONS.openWorktree).toBe('open-worktree');
		expect(TREE_CONTEXT_MENU_ACTIONS.startSession).toBe('start-session');
		expect(TREE_CONTEXT_MENU_ACTIONS.archive).toBe('archive');
		expect(TREE_CONTEXT_MENU_ACTIONS.changeColor).toBe('change-color');
		expect(TREE_CONTEXT_MENU_ACTIONS.pruneWorktree).toBe('prune-worktree');
	});

	it('type can be assigned from constant values', () => {
		const action: TreeContextMenuAction = TREE_CONTEXT_MENU_ACTIONS.openGithub;
		expect(action).toBe('open-github');
	});
});

// ════════════════════════════════════════════════════════════════════════
// resolveGlowOverlay
// ════════════════════════════════════════════════════════════════════════

describe('resolveGlowOverlay', () => {
	it('returns hover glow using issue color when issueId matches hoveredIssueId', () => {
		const result = resolveGlowOverlay(
			createParams({ issueId: 'issue-1', hoveredIssueId: 'issue-1' }),
		);
		expect(result.glow).toEqual({
			enabled: true,
			color: ISSUE_COLOR,
			intensity: 3,
			pulse: false,
		});
	});

	it('returns active glow using issue color when issueId matches activeIssueId and NOT hovered', () => {
		const result = resolveGlowOverlay(
			createParams({ issueId: 'issue-1', activeIssueId: 'issue-1', hoveredIssueId: null }),
		);
		expect(result.glow).toEqual({
			enabled: true,
			color: ISSUE_COLOR,
			intensity: 3,
			pulse: false,
		});
	});

	it('suppresses state-driven glow when a different issue is hovered', () => {
		const result = resolveGlowOverlay(
			createParams({
				stateOverlay: STATE_ERRORED,
				issueId: 'issue-1',
				hoveredIssueId: 'other',
				activeIssueId: 'other',
			}),
		);
		expect(result).toEqual(OVERLAY_DEFAULTS);
	});

	it('hover takes priority over active when both match same issueId', () => {
		const result = resolveGlowOverlay(
			createParams({
				issueId: 'issue-1',
				hoveredIssueId: 'issue-1',
				activeIssueId: 'issue-1',
			}),
		);
		expect(result.glow.color).toBe(ISSUE_COLOR);
	});

	it('hover takes priority over state-driven errored glow', () => {
		const result = resolveGlowOverlay(
			createParams({
				stateOverlay: STATE_ERRORED,
				issueId: 'issue-1',
				hoveredIssueId: 'issue-1',
			}),
		);
		expect(result.glow.color).toBe(ISSUE_COLOR);
		expect(result.glow.pulse).toBe(false);
	});

	it('suppresses active glow when a different tree is hovered', () => {
		const result = resolveGlowOverlay(
			createParams({
				issueId: 'issue-1',
				activeIssueId: 'issue-1',
				hoveredIssueId: 'issue-2',
			}),
		);
		expect(result).toEqual(OVERLAY_DEFAULTS);
	});

	it('active takes priority over state-driven errored glow', () => {
		const result = resolveGlowOverlay(
			createParams({
				stateOverlay: STATE_ERRORED,
				issueId: 'issue-1',
				hoveredIssueId: null,
				activeIssueId: 'issue-1',
			}),
		);
		expect(result.glow.color).toBe(ISSUE_COLOR);
		expect(result.glow.pulse).toBe(false);
	});

	it('returns disabled glow from stateOverlay when no state glow, not hovered, not active', () => {
		const result = resolveGlowOverlay(
			createParams({
				stateOverlay: STATE_DISABLED,
				issueId: 'issue-1',
				hoveredIssueId: null,
				activeIssueId: null,
			}),
		);
		expect(result.glow.enabled).toBe(false);
		expect(result).toEqual(STATE_DISABLED);
	});

	it('returns batch-selected glow when issueId is in batchSelectedIssueIds', () => {
		const result = resolveGlowOverlay(
			createParams({
				issueId: 'issue-1',
				hoveredIssueId: null,
				activeIssueId: null,
				batchSelectedIssueIds: new Set(['issue-1', 'issue-2']),
			}),
		);
		expect(result.glow).toEqual({
			enabled: true,
			color: BATCH_SELECTED_COLOR,
			intensity: 3,
			pulse: false,
		});
	});

	it('hover takes priority over batch-selected', () => {
		const result = resolveGlowOverlay(
			createParams({
				issueId: 'issue-1',
				hoveredIssueId: 'issue-1',
				activeIssueId: null,
				batchSelectedIssueIds: new Set(['issue-1']),
			}),
		);
		expect(result.glow.color).toBe(ISSUE_COLOR);
	});

	it('active takes priority over batch-selected', () => {
		const result = resolveGlowOverlay(
			createParams({
				issueId: 'issue-1',
				hoveredIssueId: null,
				activeIssueId: 'issue-1',
				batchSelectedIssueIds: new Set(['issue-1']),
			}),
		);
		expect(result.glow.color).toBe(ISSUE_COLOR);
	});

	it('batch-selected takes priority over state-driven overlay', () => {
		const result = resolveGlowOverlay(
			createParams({
				stateOverlay: STATE_ERRORED,
				issueId: 'issue-1',
				hoveredIssueId: null,
				activeIssueId: null,
				batchSelectedIssueIds: new Set(['issue-1']),
			}),
		);
		expect(result.glow.color).toBe(BATCH_SELECTED_COLOR);
		expect(result.glow.pulse).toBe(false);
	});

	it('returns state-driven when not hovered, not active, not batch-selected', () => {
		const result = resolveGlowOverlay(
			createParams({
				stateOverlay: STATE_ERRORED,
				issueId: 'issue-1',
				hoveredIssueId: null,
				activeIssueId: null,
				batchSelectedIssueIds: new Set(['issue-99']),
			}),
		);
		expect(result).toEqual(STATE_ERRORED);
	});
});
