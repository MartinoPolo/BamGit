import { describe, it, expect } from 'vitest';
import { deriveWorktreeBadge } from './derive_worktree_badge.js';
import type { WorktreeState } from '$lib/modules/issues/index.js';

describe('deriveWorktreeBadge', () => {
	it('pending → Setting up with warning tone', () => {
		const result = deriveWorktreeBadge('pending');
		expect(result).toEqual({ label: 'Setting up', tone: 'warning' });
	});

	it('active → Worktree with success tone', () => {
		const result = deriveWorktreeBadge('active');
		expect(result).toEqual({ label: 'Worktree', tone: 'success' });
	});

	it('failed → Failed with danger tone', () => {
		const result = deriveWorktreeBadge('failed');
		expect(result).toEqual({ label: 'Failed', tone: 'danger' });
	});

	it('none → null', () => {
		expect(deriveWorktreeBadge('none')).toBeNull();
	});

	it('removing → null', () => {
		expect(deriveWorktreeBadge('removing')).toBeNull();
	});

	it('removed → null', () => {
		expect(deriveWorktreeBadge('removed')).toBeNull();
	});

	it('returns correct type for all WorktreeState values', () => {
		const allStates: WorktreeState[] = [
			'none',
			'pending',
			'active',
			'failed',
			'removing',
			'removed',
		];
		for (const state of allStates) {
			const result = deriveWorktreeBadge(state);
			if (result !== null) {
				expect(result).toHaveProperty('label');
				expect(result).toHaveProperty('tone');
				expect(typeof result.label).toBe('string');
				expect(['warning', 'success', 'danger']).toContain(result.tone);
			}
		}
	});
});
