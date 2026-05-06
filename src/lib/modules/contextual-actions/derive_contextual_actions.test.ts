import { describe, it, expect } from 'vitest';
import { deriveContextualActions } from './derive_contextual_actions.js';
import { ACTION_IDS } from './types.js';
import type { ContextualActionInput } from './types.js';

const COMMIT_ACTIONS = [ACTION_IDS.Commit, ACTION_IDS.CommitAndPush, ACTION_IDS.CommitPushAndPr];

function makeInput(overrides: Partial<ContextualActionInput> = {}): ContextualActionInput {
	return {
		worktreeState: 'active',
		sessionState: null,
		prState: null,
		hasLocalChanges: false,
		aheadRemoteCount: 0,
		behindBaseCount: 0,
		mergeConflict: false,
		labels: [],
		...overrides,
	};
}

describe('deriveContextualActions', () => {
	describe('priority cascade (first match wins)', () => {
		it('level 1: session running → View Session primary, all others disabled', () => {
			const result = deriveContextualActions(makeInput({ sessionState: 'executing' }));
			expect(result.primary).toBe(ACTION_IDS.ViewSession);
			expect(result.secondary).toBeNull();
			expect(result.overflow).toHaveLength(0);
			expect(result.disabled.length).toBeGreaterThan(0);
		});

		it('level 1: session hitl also triggers View Session', () => {
			const result = deriveContextualActions(makeInput({ sessionState: 'hitl' }));
			expect(result.primary).toBe(ACTION_IDS.ViewSession);
		});

		it('level 1: session review also triggers View Session', () => {
			const result = deriveContextualActions(makeInput({ sessionState: 'review' }));
			expect(result.primary).toBe(ACTION_IDS.ViewSession);
		});

		it('level 1: session paused also triggers View Session', () => {
			const result = deriveContextualActions(makeInput({ sessionState: 'paused' }));
			expect(result.primary).toBe(ACTION_IDS.ViewSession);
		});

		it('level 1: session error also triggers View Session', () => {
			const result = deriveContextualActions(makeInput({ sessionState: 'error' }));
			expect(result.primary).toBe(ACTION_IDS.ViewSession);
		});

		it('level 1: session done does NOT trigger View Session', () => {
			const result = deriveContextualActions(makeInput({ sessionState: 'done' }));
			expect(result.primary).not.toBe(ACTION_IDS.ViewSession);
		});

		it('level 2: worktree failed → Retry Worktree primary, Remove secondary', () => {
			const result = deriveContextualActions(makeInput({ worktreeState: 'failed' }));
			expect(result.primary).toBe(ACTION_IDS.RetryWorktree);
			expect(result.secondary).toBe(ACTION_IDS.RemoveWorktree);
			expect(result.overflow).toHaveLength(0);
		});

		it('level 3: merge conflict → Sync Base primary, Run secondary', () => {
			const result = deriveContextualActions(makeInput({ mergeConflict: true }));
			expect(result.primary).toBe(ACTION_IDS.SyncBase);
			expect(result.secondary).toBe(ACTION_IDS.Run);
			expect(result.overflow).toContain(ACTION_IDS.RemoveWorktree);
			expect(result.disabled).toEqual(
				expect.arrayContaining([
					...COMMIT_ACTIONS,
					ACTION_IDS.Push,
					ACTION_IDS.CreatePr,
					ACTION_IDS.Merge,
					ACTION_IDS.Review,
				]),
			);
		});

		// fallow-ignore-next-line code-duplication
		it('level 4: local changes, no PR → Commit Push PR primary, Commit Push secondary', () => {
			const result = deriveContextualActions(
				makeInput({ hasLocalChanges: true, prState: null }),
			);
			expect(result.primary).toBe(ACTION_IDS.CommitPushAndPr);
			expect(result.secondary).toBe(ACTION_IDS.CommitAndPush);
			expect(result.overflow).toEqual(
				expect.arrayContaining([
					ACTION_IDS.Commit,
					ACTION_IDS.Review,
					ACTION_IDS.CheckAndFix,
					ACTION_IDS.Run,
					ACTION_IDS.CodeClean,
				]),
			);
			expect(result.disabled).toEqual(
				expect.arrayContaining([ACTION_IDS.Push, ACTION_IDS.CreatePr, ACTION_IDS.Merge]),
			);
		});

		it('level 5: local changes, PR exists → Commit Push primary, Commit secondary', () => {
			const result = deriveContextualActions(
				makeInput({ hasLocalChanges: true, prState: 'open' }),
			);
			expect(result.primary).toBe(ACTION_IDS.CommitAndPush);
			expect(result.secondary).toBe(ACTION_IDS.Commit);
			expect(result.overflow).toEqual(
				expect.arrayContaining([
					ACTION_IDS.Review,
					ACTION_IDS.CheckAndFix,
					ACTION_IDS.Run,
					ACTION_IDS.CodeClean,
				]),
			);
			expect(result.disabled).toEqual(
				expect.arrayContaining([ACTION_IDS.Push, ACTION_IDS.CreatePr, ACTION_IDS.Merge]),
			);
		});

		it('level 6: ahead of remote, no PR → Create PR primary, Push secondary', () => {
			const result = deriveContextualActions(
				makeInput({ aheadRemoteCount: 3, prState: null }),
			);
			expect(result.primary).toBe(ACTION_IDS.CreatePr);
			expect(result.secondary).toBe(ACTION_IDS.Push);
			expect(result.overflow).toEqual(
				expect.arrayContaining([
					ACTION_IDS.Review,
					ACTION_IDS.CheckAndFix,
					ACTION_IDS.Run,
					ACTION_IDS.SyncBase,
				]),
			);
			expect(result.disabled).toEqual(
				expect.arrayContaining([...COMMIT_ACTIONS, ACTION_IDS.Merge]),
			);
		});

		it('level 7: ahead of remote, PR exists → Push primary, Review secondary', () => {
			const result = deriveContextualActions(
				makeInput({ aheadRemoteCount: 2, prState: 'open' }),
			);
			expect(result.primary).toBe(ACTION_IDS.Push);
			expect(result.secondary).toBe(ACTION_IDS.Review);
			expect(result.overflow).toEqual(
				expect.arrayContaining([
					ACTION_IDS.CheckAndFix,
					ACTION_IDS.Run,
					ACTION_IDS.SyncBase,
				]),
			);
			expect(result.disabled).toEqual(
				expect.arrayContaining([...COMMIT_ACTIONS, ACTION_IDS.CreatePr, ACTION_IDS.Merge]),
			);
		});

		it('level 8: PR changes-requested → Run primary, Review secondary', () => {
			const result = deriveContextualActions(makeInput({ prState: 'changes-requested' }));
			expect(result.primary).toBe(ACTION_IDS.Run);
			expect(result.secondary).toBe(ACTION_IDS.Review);
			expect(result.overflow).toEqual(
				expect.arrayContaining([
					ACTION_IDS.CheckAndFix,
					ACTION_IDS.SyncBase,
					ACTION_IDS.CodeClean,
				]),
			);
			expect(result.disabled).toEqual(
				expect.arrayContaining([...COMMIT_ACTIONS, ACTION_IDS.Push, ACTION_IDS.Merge]),
			);
		});

		it('level 9: PR approved → Merge primary, Review secondary', () => {
			const result = deriveContextualActions(makeInput({ prState: 'approved' }));
			expect(result.primary).toBe(ACTION_IDS.Merge);
			expect(result.secondary).toBe(ACTION_IDS.Review);
			expect(result.overflow).toContain(ACTION_IDS.SyncBase);
			expect(result.disabled).toEqual(
				expect.arrayContaining([...COMMIT_ACTIONS, ACTION_IDS.Push, ACTION_IDS.Run]),
			);
		});

		it('level 9: PR ready-to-merge also → Merge primary', () => {
			const result = deriveContextualActions(makeInput({ prState: 'ready-to-merge' }));
			expect(result.primary).toBe(ACTION_IDS.Merge);
		});

		it('level 10: PR open → Review primary, Check & Fix secondary', () => {
			const result = deriveContextualActions(makeInput({ prState: 'open' }));
			expect(result.primary).toBe(ACTION_IDS.Review);
			expect(result.secondary).toBe(ACTION_IDS.CheckAndFix);
			expect(result.overflow).toEqual(
				expect.arrayContaining([ACTION_IDS.Run, ACTION_IDS.SyncBase, ACTION_IDS.CodeClean]),
			);
			expect(result.disabled).toEqual(
				expect.arrayContaining([...COMMIT_ACTIONS, ACTION_IDS.Push, ACTION_IDS.Merge]),
			);
		});

		it('level 10: PR draft also → Review primary', () => {
			const result = deriveContextualActions(makeInput({ prState: 'draft' }));
			expect(result.primary).toBe(ACTION_IDS.Review);
		});

		it('level 10: PR review-requested also → Review primary', () => {
			const result = deriveContextualActions(makeInput({ prState: 'review-requested' }));
			expect(result.primary).toBe(ACTION_IDS.Review);
		});

		it('level 11: behind base → Sync Base primary, Run secondary', () => {
			const result = deriveContextualActions(makeInput({ behindBaseCount: 5 }));
			expect(result.primary).toBe(ACTION_IDS.SyncBase);
			expect(result.secondary).toBe(ACTION_IDS.Run);
			expect(result.overflow).toEqual(
				expect.arrayContaining([ACTION_IDS.Review, ACTION_IDS.CheckAndFix]),
			);
			expect(result.disabled).toEqual(
				expect.arrayContaining([...COMMIT_ACTIONS, ACTION_IDS.Push, ACTION_IDS.Merge]),
			);
		});

		it('level 12: HITL label, idle → HITL primary, Run secondary', () => {
			const result = deriveContextualActions(
				makeInput({ labels: [{ name: 'HITL', color: '#ff0000' }] }),
			);
			expect(result.primary).toBe(ACTION_IDS.Hitl);
			expect(result.secondary).toBe(ACTION_IDS.Run);
			expect(result.overflow).toEqual(
				expect.arrayContaining([ACTION_IDS.Review, ACTION_IDS.CheckAndFix]),
			);
		});

		it('level 12: hitl label (lowercase) also matches', () => {
			const result = deriveContextualActions(
				makeInput({ labels: [{ name: 'hitl', color: '#ff0000' }] }),
			);
			expect(result.primary).toBe(ACTION_IDS.Hitl);
		});

		it('level 13: no worktree → Run primary, Setup Worktree secondary', () => {
			const result = deriveContextualActions(makeInput({ worktreeState: 'none' }));
			expect(result.primary).toBe(ACTION_IDS.Run);
			expect(result.secondary).toBe(ACTION_IDS.SetupWorktree);
			expect(result.overflow).toHaveLength(0);
		});

		// fallow-ignore-next-line code-duplication
		it('level 14: default (active, clean, idle) → Run primary, Review secondary', () => {
			const result = deriveContextualActions(makeInput());
			expect(result.primary).toBe(ACTION_IDS.Run);
			expect(result.secondary).toBe(ACTION_IDS.Review);
			expect(result.overflow).toEqual(
				expect.arrayContaining([ACTION_IDS.CheckAndFix, ACTION_IDS.CodeClean]),
			);
			expect(result.disabled).toEqual(
				expect.arrayContaining([...COMMIT_ACTIONS, ACTION_IDS.Push, ACTION_IDS.Merge]),
			);
		});
	});

	describe('priority ordering', () => {
		it('session running overrides merge conflict', () => {
			const result = deriveContextualActions(
				makeInput({ sessionState: 'executing', mergeConflict: true }),
			);
			expect(result.primary).toBe(ACTION_IDS.ViewSession);
		});

		it('worktree failed overrides local changes', () => {
			const result = deriveContextualActions(
				makeInput({ worktreeState: 'failed', hasLocalChanges: true }),
			);
			expect(result.primary).toBe(ACTION_IDS.RetryWorktree);
		});

		it('merge conflict overrides local changes', () => {
			const result = deriveContextualActions(
				makeInput({ mergeConflict: true, hasLocalChanges: true }),
			);
			expect(result.primary).toBe(ACTION_IDS.SyncBase);
		});

		it('local changes overrides ahead of remote', () => {
			const result = deriveContextualActions(
				makeInput({ hasLocalChanges: true, aheadRemoteCount: 5 }),
			);
			expect(result.primary).toBe(ACTION_IDS.CommitPushAndPr);
		});

		it('ahead of remote overrides PR changes-requested', () => {
			const result = deriveContextualActions(
				makeInput({ aheadRemoteCount: 2, prState: 'changes-requested' }),
			);
			expect(result.primary).toBe(ACTION_IDS.Push);
		});

		it('HITL label overrides no-worktree when worktree is active', () => {
			const result = deriveContextualActions(
				makeInput({
					worktreeState: 'active',
					labels: [{ name: 'HITL', color: '#ff0000' }],
				}),
			);
			expect(result.primary).toBe(ACTION_IDS.Hitl);
		});
	});

	describe('edge cases', () => {
		it('worktree pending treated like active (not "none")', () => {
			const result = deriveContextualActions(makeInput({ worktreeState: 'pending' }));
			expect(result.primary).toBe(ACTION_IDS.Run);
			expect(result.secondary).toBe(ACTION_IDS.Review);
		});

		it('worktree removing treated like no worktree', () => {
			const result = deriveContextualActions(makeInput({ worktreeState: 'removing' }));
			expect(result.primary).toBe(ACTION_IDS.Run);
			expect(result.secondary).toBe(ACTION_IDS.SetupWorktree);
		});

		it('worktree removed treated like no worktree', () => {
			const result = deriveContextualActions(makeInput({ worktreeState: 'removed' }));
			expect(result.primary).toBe(ACTION_IDS.Run);
			expect(result.secondary).toBe(ACTION_IDS.SetupWorktree);
		});

		it('PR merged/closed does not trigger PR-related levels', () => {
			const result = deriveContextualActions(makeInput({ prState: 'merged' }));
			expect(result.primary).toBe(ACTION_IDS.Run);
			expect(result.secondary).toBe(ACTION_IDS.Review);
		});

		it('PR closed does not trigger PR-related levels', () => {
			const result = deriveContextualActions(makeInput({ prState: 'closed' }));
			expect(result.primary).toBe(ACTION_IDS.Run);
			expect(result.secondary).toBe(ACTION_IDS.Review);
		});

		it('no actions are both in overflow and disabled', () => {
			const result = deriveContextualActions(makeInput());
			const overflowSet = new Set(result.overflow);
			for (const disabledId of result.disabled) {
				expect(overflowSet.has(disabledId)).toBe(false);
			}
		});

		it('primary and secondary are not in overflow or disabled', () => {
			const result = deriveContextualActions(makeInput({ hasLocalChanges: true }));
			const overflowSet = new Set(result.overflow);
			const disabledSet = new Set(result.disabled);
			if (result.primary) {
				expect(overflowSet.has(result.primary)).toBe(false);
				expect(disabledSet.has(result.primary)).toBe(false);
			}
			if (result.secondary) {
				expect(overflowSet.has(result.secondary)).toBe(false);
				expect(disabledSet.has(result.secondary)).toBe(false);
			}
		});
	});
});
