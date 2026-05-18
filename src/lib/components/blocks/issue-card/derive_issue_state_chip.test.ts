import { describe, it, expect } from 'vitest';
import { deriveIssueStateChipLabel } from './derive_issue_state_chip.js';
import { CHIP_COLORS, type IssueStateChipInput } from './types.js';

function makeInput(overrides: Partial<IssueStateChipInput> = {}): IssueStateChipInput {
	return {
		aggregateSessionState: 'no-session',
		executionPhase: 'none',
		syncStatus: { type: 'up-to-date' },
		worktreeState: 'active',
		pullRequestState: 'no-pr',
		githubIssueState: 'open',
		activeCheckCommandCount: 0,
		activeTestCommandCount: 0,
		prCiStatus: null,
		...overrides,
	};
}

describe('deriveIssueStateChipLabel', () => {
	describe('22-rule cascade (first match wins)', () => {
		it('rule 1: errored session -> ERROR (error)', () => {
			const result = deriveIssueStateChipLabel(
				makeInput({ aggregateSessionState: 'errored' }),
			);
			expect(result).toEqual({ label: 'ERROR', colorVariable: CHIP_COLORS.error });
		});

		it('rule 2: needs-input session -> NEEDS INPUT (warning)', () => {
			const result = deriveIssueStateChipLabel(
				makeInput({ aggregateSessionState: 'needs-input' }),
			);
			expect(result).toEqual({ label: 'NEEDS INPUT', colorVariable: CHIP_COLORS.warning });
		});

		it('rule 3: merge-conflict sync -> MERGE CONFLICT (error)', () => {
			const result = deriveIssueStateChipLabel(
				makeInput({ syncStatus: { type: 'merge-conflict' } }),
			);
			expect(result).toEqual({
				label: 'MERGE CONFLICT',
				colorVariable: CHIP_COLORS.error,
			});
		});

		it('rule 4: worktree failed -> SETUP FAILED (error)', () => {
			const result = deriveIssueStateChipLabel(makeInput({ worktreeState: 'failed' }));
			expect(result).toEqual({
				label: 'SETUP FAILED',
				colorVariable: CHIP_COLORS.error,
			});
		});

		it('rule 5: running + analyzing -> ANALYZING (success)', () => {
			const result = deriveIssueStateChipLabel(
				makeInput({ aggregateSessionState: 'running', executionPhase: 'analyzing' }),
			);
			expect(result).toEqual({ label: 'ANALYZING', colorVariable: CHIP_COLORS.success });
		});

		it('rule 6: running + tdd -> BUILDING (success)', () => {
			const result = deriveIssueStateChipLabel(
				makeInput({ aggregateSessionState: 'running', executionPhase: 'tdd' }),
			);
			expect(result).toEqual({ label: 'BUILDING', colorVariable: CHIP_COLORS.success });
		});

		it('rule 7: running + reviewing -> REVIEWING (info, NOT success)', () => {
			const result = deriveIssueStateChipLabel(
				makeInput({ aggregateSessionState: 'running', executionPhase: 'reviewing' }),
			);
			expect(result).toEqual({ label: 'REVIEWING', colorVariable: CHIP_COLORS.info });
		});

		it('rule 8: running + verifying -> VERIFYING (success)', () => {
			const result = deriveIssueStateChipLabel(
				makeInput({ aggregateSessionState: 'running', executionPhase: 'verifying' }),
			);
			expect(result).toEqual({ label: 'VERIFYING', colorVariable: CHIP_COLORS.success });
		});

		it('rule 9: running + committing -> SHIPPING (success)', () => {
			const result = deriveIssueStateChipLabel(
				makeInput({ aggregateSessionState: 'running', executionPhase: 'committing' }),
			);
			expect(result).toEqual({ label: 'SHIPPING', colorVariable: CHIP_COLORS.success });
		});

		it('rule 10: running + none -> EXECUTING (success)', () => {
			const result = deriveIssueStateChipLabel(
				makeInput({ aggregateSessionState: 'running', executionPhase: 'none' }),
			);
			expect(result).toEqual({ label: 'EXECUTING', colorVariable: CHIP_COLORS.success });
		});

		it('rule 11: needs-review -> REVIEW (info)', () => {
			const result = deriveIssueStateChipLabel(
				makeInput({ aggregateSessionState: 'needs-review' }),
			);
			expect(result).toEqual({ label: 'REVIEW', colorVariable: CHIP_COLORS.info });
		});

		it('rule 12: paused -> PAUSED (muted)', () => {
			const result = deriveIssueStateChipLabel(
				makeInput({ aggregateSessionState: 'paused' }),
			);
			expect(result).toEqual({ label: 'PAUSED', colorVariable: CHIP_COLORS.muted });
		});

		it('rule 13: active check commands -> RUNNING CHECKS (info)', () => {
			const result = deriveIssueStateChipLabel(makeInput({ activeCheckCommandCount: 2 }));
			expect(result).toEqual({
				label: 'RUNNING CHECKS',
				colorVariable: CHIP_COLORS.info,
			});
		});

		it('rule 14: active test commands -> RUNNING TESTS (info)', () => {
			const result = deriveIssueStateChipLabel(makeInput({ activeTestCommandCount: 1 }));
			expect(result).toEqual({
				label: 'RUNNING TESTS',
				colorVariable: CHIP_COLORS.info,
			});
		});

		it('rule 15: behind-base sync -> BEHIND BASE (warning)', () => {
			const result = deriveIssueStateChipLabel(
				makeInput({ syncStatus: { type: 'behind-base', count: 3 } }),
			);
			expect(result).toEqual({
				label: 'BEHIND BASE',
				colorVariable: CHIP_COLORS.warning,
			});
		});

		it('rule 16: changes-requested PR -> CHANGES REQ (warning)', () => {
			const result = deriveIssueStateChipLabel(
				makeInput({ pullRequestState: 'changes-requested' }),
			);
			expect(result).toEqual({
				label: 'CHANGES REQ',
				colorVariable: CHIP_COLORS.warning,
			});
		});

		it('rule 17: prCiStatus running -> CI RUNNING (info)', () => {
			const result = deriveIssueStateChipLabel(makeInput({ prCiStatus: 'running' }));
			expect(result).toEqual({
				label: 'CI RUNNING',
				colorVariable: CHIP_COLORS.info,
			});
		});

		it('rule 18: approved PR -> APPROVED (success)', () => {
			const result = deriveIssueStateChipLabel(makeInput({ pullRequestState: 'approved' }));
			expect(result).toEqual({ label: 'APPROVED', colorVariable: CHIP_COLORS.success });
		});

		it('rule 19: ready-to-merge PR -> READY TO MERGE (success)', () => {
			const result = deriveIssueStateChipLabel(
				makeInput({ pullRequestState: 'ready-to-merge' }),
			);
			expect(result).toEqual({
				label: 'READY TO MERGE',
				colorVariable: CHIP_COLORS.success,
			});
		});

		it('rule 20: worktree pending -> WORKTREE SETUP (warning)', () => {
			const result = deriveIssueStateChipLabel(makeInput({ worktreeState: 'pending' }));
			expect(result).toEqual({
				label: 'WORKTREE SETUP',
				colorVariable: CHIP_COLORS.warning,
			});
		});

		it('rule 21: worktree removing -> REMOVING WORKTREE (warning)', () => {
			const result = deriveIssueStateChipLabel(makeInput({ worktreeState: 'removing' }));
			expect(result).toEqual({
				label: 'REMOVING WORKTREE',
				colorVariable: CHIP_COLORS.warning,
			});
		});

		it('rule 22: closed issue + merged PR -> DONE (muted)', () => {
			const result = deriveIssueStateChipLabel(
				makeInput({ githubIssueState: 'closed', pullRequestState: 'merged' }),
			);
			expect(result).toEqual({ label: 'DONE', colorVariable: CHIP_COLORS.muted });
		});
	});

	describe('priority ordering', () => {
		it('errored overrides merge-conflict (rule 1 > 3)', () => {
			const result = deriveIssueStateChipLabel(
				makeInput({
					aggregateSessionState: 'errored',
					syncStatus: { type: 'merge-conflict' },
				}),
			);
			expect(result?.label).toBe('ERROR');
		});

		it('needs-input overrides running session phase (rule 2 > 5-10)', () => {
			const result = deriveIssueStateChipLabel(
				makeInput({
					aggregateSessionState: 'needs-input',
					executionPhase: 'tdd',
				}),
			);
			expect(result?.label).toBe('NEEDS INPUT');
		});

		it('merge-conflict overrides setup-failed (rule 3 > 4)', () => {
			const result = deriveIssueStateChipLabel(
				makeInput({
					syncStatus: { type: 'merge-conflict' },
					worktreeState: 'failed',
				}),
			);
			expect(result?.label).toBe('MERGE CONFLICT');
		});

		it('setup-failed overrides execution phase (rule 4 > 5)', () => {
			const result = deriveIssueStateChipLabel(
				makeInput({
					worktreeState: 'failed',
					aggregateSessionState: 'running',
					executionPhase: 'analyzing',
				}),
			);
			expect(result?.label).toBe('SETUP FAILED');
		});

		it('running+phase overrides running+none (rule 5 > 10)', () => {
			const result = deriveIssueStateChipLabel(
				makeInput({
					aggregateSessionState: 'running',
					executionPhase: 'analyzing',
				}),
			);
			expect(result?.label).toBe('ANALYZING');
			expect(result?.label).not.toBe('EXECUTING');
		});

		it('running overrides needs-review (rules 5-10 > 11)', () => {
			const result = deriveIssueStateChipLabel(
				makeInput({
					aggregateSessionState: 'running',
					executionPhase: 'tdd',
				}),
			);
			expect(result?.label).toBe('BUILDING');
		});

		it('needs-review overrides paused (rule 11 > 12)', () => {
			const result = deriveIssueStateChipLabel(
				makeInput({ aggregateSessionState: 'needs-review' }),
			);
			expect(result?.label).toBe('REVIEW');
		});

		it('paused overrides behind-base (rule 12 > 15)', () => {
			const result = deriveIssueStateChipLabel(
				makeInput({
					aggregateSessionState: 'paused',
					syncStatus: { type: 'behind-base', count: 5 },
				}),
			);
			expect(result?.label).toBe('PAUSED');
		});

		it('behind-base overrides changes-requested (rule 15 > 16)', () => {
			const result = deriveIssueStateChipLabel(
				makeInput({
					syncStatus: { type: 'behind-base', count: 2 },
					pullRequestState: 'changes-requested',
				}),
			);
			expect(result?.label).toBe('BEHIND BASE');
		});
	});

	describe('edge cases', () => {
		it('no matching state returns null', () => {
			const result = deriveIssueStateChipLabel(makeInput());
			expect(result).toBeNull();
		});

		it('finished session returns null (no chip for finished)', () => {
			const result = deriveIssueStateChipLabel(
				makeInput({ aggregateSessionState: 'finished' }),
			);
			expect(result).toBeNull();
		});

		it('no-session with no triggers returns null', () => {
			const result = deriveIssueStateChipLabel(
				makeInput({ aggregateSessionState: 'no-session' }),
			);
			expect(result).toBeNull();
		});

		it('multiple simultaneous: errored + merge-conflict + failed -> ERROR (highest priority)', () => {
			const result = deriveIssueStateChipLabel(
				makeInput({
					aggregateSessionState: 'errored',
					syncStatus: { type: 'merge-conflict' },
					worktreeState: 'failed',
				}),
			);
			expect(result?.label).toBe('ERROR');
		});

		it('prCiStatus passed does not trigger any chip', () => {
			const result = deriveIssueStateChipLabel(makeInput({ prCiStatus: 'passed' }));
			expect(result).toBeNull();
		});

		it('prCiStatus failed does not trigger any chip', () => {
			const result = deriveIssueStateChipLabel(makeInput({ prCiStatus: 'failed' }));
			expect(result).toBeNull();
		});

		it('closed issue without merged PR is NOT done', () => {
			const result = deriveIssueStateChipLabel(
				makeInput({ githubIssueState: 'closed', pullRequestState: 'no-pr' }),
			);
			expect(result).toBeNull();
		});

		it('merged PR without closed issue is NOT done', () => {
			const result = deriveIssueStateChipLabel(
				makeInput({ githubIssueState: 'open', pullRequestState: 'merged' }),
			);
			expect(result).toBeNull();
		});
	});

	describe('simultaneous PR + session states', () => {
		it('running session overrides approved PR (rule 10 > 18)', () => {
			const result = deriveIssueStateChipLabel(
				makeInput({
					aggregateSessionState: 'running',
					pullRequestState: 'approved',
				}),
			);
			expect(result?.label).toBe('EXECUTING');
		});

		it('paused session overrides changes-requested PR (rule 12 > 16)', () => {
			const result = deriveIssueStateChipLabel(
				makeInput({
					aggregateSessionState: 'paused',
					pullRequestState: 'changes-requested',
				}),
			);
			expect(result?.label).toBe('PAUSED');
		});

		it('no-session with approved PR and CI running -> CI RUNNING (rule 17 > 18)', () => {
			const result = deriveIssueStateChipLabel(
				makeInput({
					aggregateSessionState: 'no-session',
					pullRequestState: 'approved',
					prCiStatus: 'running',
				}),
			);
			expect(result?.label).toBe('CI RUNNING');
		});

		it('no-session with ready-to-merge PR -> READY TO MERGE (rule 19)', () => {
			const result = deriveIssueStateChipLabel(
				makeInput({
					aggregateSessionState: 'no-session',
					pullRequestState: 'ready-to-merge',
				}),
			);
			expect(result?.label).toBe('READY TO MERGE');
		});
	});

	describe('design exceptions', () => {
		it('rule 7: REVIEWING uses info color (blue/cyan), NOT success (green)', () => {
			const result = deriveIssueStateChipLabel(
				makeInput({ aggregateSessionState: 'running', executionPhase: 'reviewing' }),
			);
			expect(result?.colorVariable).toBe(CHIP_COLORS.info);
			expect(result?.colorVariable).not.toBe(CHIP_COLORS.success);
		});
	});

	describe('optional fields — undefined skips those rules', () => {
		it('skips execution phase rules when executionPhase is undefined (running -> EXECUTING)', () => {
			const result = deriveIssueStateChipLabel(
				makeInput({ aggregateSessionState: 'running', executionPhase: undefined }),
			);
			expect(result).toEqual({ label: 'EXECUTING', colorVariable: CHIP_COLORS.success });
		});

		it('skips command count rules when activeCheckCommandCount is undefined', () => {
			const result = deriveIssueStateChipLabel(
				makeInput({ activeCheckCommandCount: undefined }),
			);
			expect(result).toBeNull();
		});

		it('skips command count rules when activeTestCommandCount is undefined', () => {
			const result = deriveIssueStateChipLabel(
				makeInput({ activeTestCommandCount: undefined }),
			);
			expect(result).toBeNull();
		});

		it('skips CI status rule when prCiStatus is undefined', () => {
			const result = deriveIssueStateChipLabel(makeInput({ prCiStatus: undefined }));
			expect(result).toBeNull();
		});

		it('omitting all optional fields still resolves non-optional rules (merge-conflict)', () => {
			const result = deriveIssueStateChipLabel({
				aggregateSessionState: 'no-session',
				syncStatus: { type: 'merge-conflict' },
				worktreeState: 'active',
				pullRequestState: 'no-pr',
				githubIssueState: 'open',
			});
			expect(result).toEqual({ label: 'MERGE CONFLICT', colorVariable: CHIP_COLORS.error });
		});
	});
});
