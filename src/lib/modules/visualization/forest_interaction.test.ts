import { describe, it, expect } from 'vitest';
import type { OverlayConfig } from 'low-poly-2d-trees';
import { TREE_CONTEXT_MENU_ACTIONS, resolveGlowOverlay } from './index';
import type { TreeContextMenuAction, ResolveGlowOverlayParams } from './index';

// ════════════════════════════════════════════════════════════════════════
// Test Data
// ════════════════════════════════════════════════════════════════════════

const HOVER_COLOR = '#ffd700';
const SELECT_COLOR = '#4a9eff';

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
		selectedIssueId: null,
		hoverGlowColor: HOVER_COLOR,
		selectedGlowColor: SELECT_COLOR,
		...overrides,
	};
}

// ════════════════════════════════════════════════════════════════════════
// TREE_CONTEXT_MENU_ACTIONS
// ════════════════════════════════════════════════════════════════════════

describe('TREE_CONTEXT_MENU_ACTIONS', () => {
	it('has exactly 5 entries', () => {
		expect(Object.keys(TREE_CONTEXT_MENU_ACTIONS)).toHaveLength(5);
	});

	it('contains all expected keys', () => {
		expect(TREE_CONTEXT_MENU_ACTIONS.openGithub).toBe('open-github');
		expect(TREE_CONTEXT_MENU_ACTIONS.openWorktree).toBe('open-worktree');
		expect(TREE_CONTEXT_MENU_ACTIONS.startSession).toBe('start-session');
		expect(TREE_CONTEXT_MENU_ACTIONS.archive).toBe('archive');
		expect(TREE_CONTEXT_MENU_ACTIONS.changeColor).toBe('change-color');
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
	it('returns hover glow when issueId matches hoveredIssueId', () => {
		const result = resolveGlowOverlay(
			createParams({ issueId: 'issue-1', hoveredIssueId: 'issue-1' }),
		);
		expect(result.glow).toEqual({
			enabled: true,
			color: HOVER_COLOR,
			intensity: 3,
			pulse: false,
		});
	});

	it('returns selected glow when issueId matches selectedIssueId and NOT hovered', () => {
		const result = resolveGlowOverlay(
			createParams({ issueId: 'issue-1', selectedIssueId: 'issue-1', hoveredIssueId: null }),
		);
		expect(result.glow).toEqual({
			enabled: true,
			color: SELECT_COLOR,
			intensity: 3,
			pulse: false,
		});
	});

	it('returns state-driven overlay when neither hovered nor selected', () => {
		const result = resolveGlowOverlay(
			createParams({
				stateOverlay: STATE_ERRORED,
				issueId: 'issue-1',
				hoveredIssueId: 'other',
				selectedIssueId: 'other',
			}),
		);
		expect(result).toEqual(STATE_ERRORED);
	});

	it('hover takes priority over selected when both match same issueId', () => {
		const result = resolveGlowOverlay(
			createParams({
				issueId: 'issue-1',
				hoveredIssueId: 'issue-1',
				selectedIssueId: 'issue-1',
			}),
		);
		expect(result.glow.color).toBe(HOVER_COLOR);
	});

	it('hover takes priority over state-driven errored glow', () => {
		const result = resolveGlowOverlay(
			createParams({
				stateOverlay: STATE_ERRORED,
				issueId: 'issue-1',
				hoveredIssueId: 'issue-1',
			}),
		);
		expect(result.glow.color).toBe(HOVER_COLOR);
		expect(result.glow.pulse).toBe(false);
	});

	it('selected takes priority over state-driven errored glow', () => {
		const result = resolveGlowOverlay(
			createParams({
				stateOverlay: STATE_ERRORED,
				issueId: 'issue-1',
				hoveredIssueId: null,
				selectedIssueId: 'issue-1',
			}),
		);
		expect(result.glow.color).toBe(SELECT_COLOR);
		expect(result.glow.pulse).toBe(false);
	});

	it('returns disabled glow from stateOverlay when no state glow, not hovered, not selected', () => {
		const result = resolveGlowOverlay(
			createParams({
				stateOverlay: STATE_DISABLED,
				issueId: 'issue-1',
				hoveredIssueId: null,
				selectedIssueId: null,
			}),
		);
		expect(result.glow.enabled).toBe(false);
		expect(result).toEqual(STATE_DISABLED);
	});
});
