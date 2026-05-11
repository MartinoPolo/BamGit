import { describe, it, expect } from 'vitest';
import { WORKTREE_STATE_DISPLAY } from './worktree_state_display.js';
import type { WorktreeState } from '$lib/modules/issues';

describe('WORKTREE_STATE_DISPLAY', () => {
	it('maps active to green with circle-check icon', () => {
		const display = WORKTREE_STATE_DISPLAY.active;
		expect(display.colorClass).toBe('text-green-500');
		expect(display.iconName).toBe('circle-check');
		expect(display.animate).toBe(false);
	});

	it('maps failed to red with circle-x icon', () => {
		const display = WORKTREE_STATE_DISPLAY.failed;
		expect(display.colorClass).toBe('text-red-500');
		expect(display.iconName).toBe('circle-x');
		expect(display.animate).toBe(false);
	});

	it('maps pending to orange with loader-circle icon and animation', () => {
		const display = WORKTREE_STATE_DISPLAY.pending;
		expect(display.colorClass).toBe('text-orange-400');
		expect(display.iconName).toBe('loader-circle');
		expect(display.animate).toBe(true);
	});

	it('maps none to muted gray with circle icon', () => {
		const display = WORKTREE_STATE_DISPLAY.none;
		expect(display.colorClass).toBe('text-muted-foreground');
		expect(display.iconName).toBe('circle');
		expect(display.animate).toBe(false);
	});

	it('maps removing to muted gray with circle icon', () => {
		const display = WORKTREE_STATE_DISPLAY.removing;
		expect(display.colorClass).toBe('text-muted-foreground');
		expect(display.iconName).toBe('circle');
		expect(display.animate).toBe(false);
	});

	it('maps removed to muted gray with circle icon', () => {
		const display = WORKTREE_STATE_DISPLAY.removed;
		expect(display.colorClass).toBe('text-muted-foreground');
		expect(display.iconName).toBe('circle');
		expect(display.animate).toBe(false);
	});

	it('covers all WorktreeState values', () => {
		const allStates: WorktreeState[] = [
			'active',
			'failed',
			'pending',
			'none',
			'removing',
			'removed',
		];
		for (const state of allStates) {
			expect(WORKTREE_STATE_DISPLAY[state]).toBeDefined();
		}
	});
});
