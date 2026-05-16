import { CHIP_COLORS, type IssueStateChipInput, type IssueStateChipResult } from './types.js';

// fallow-ignore-next-line complexity
export function deriveIssueStateChipLabel(input: IssueStateChipInput): IssueStateChipResult | null {
	// Rule 1: Errored session
	if (input.aggregateSessionState === 'errored') {
		return { label: 'ERROR', colorVariable: CHIP_COLORS.error };
	}

	// Rule 2: Needs input
	if (input.aggregateSessionState === 'needs-input') {
		return { label: 'NEEDS INPUT', colorVariable: CHIP_COLORS.warning };
	}

	// Rule 3: Merge conflict
	if (input.syncStatus.type === 'merge-conflict') {
		return { label: 'MERGE CONFLICT', colorVariable: CHIP_COLORS.error };
	}

	// Rule 4: Worktree setup failed
	if (input.worktreeState === 'failed') {
		return { label: 'SETUP FAILED', colorVariable: CHIP_COLORS.error };
	}

	// Rules 5-10: Running session with execution phase
	if (input.aggregateSessionState === 'running') {
		if (input.executionPhase === 'analyzing') {
			return { label: 'ANALYZING', colorVariable: CHIP_COLORS.success };
		}
		if (input.executionPhase === 'tdd') {
			return { label: 'BUILDING', colorVariable: CHIP_COLORS.success };
		}
		if (input.executionPhase === 'reviewing') {
			return { label: 'REVIEWING', colorVariable: CHIP_COLORS.info };
		}
		if (input.executionPhase === 'verifying') {
			return { label: 'VERIFYING', colorVariable: CHIP_COLORS.success };
		}
		if (input.executionPhase === 'committing') {
			return { label: 'SHIPPING', colorVariable: CHIP_COLORS.success };
		}
		// Rule 10: running + none
		return { label: 'EXECUTING', colorVariable: CHIP_COLORS.success };
	}

	// Rule 11: Needs review
	if (input.aggregateSessionState === 'needs-review') {
		return { label: 'REVIEW', colorVariable: CHIP_COLORS.info };
	}

	// Rule 12: Paused
	if (input.aggregateSessionState === 'paused') {
		return { label: 'PAUSED', colorVariable: CHIP_COLORS.muted };
	}

	// Rule 13: Running checks
	if (input.activeCheckCommandCount > 0) {
		return { label: 'RUNNING CHECKS', colorVariable: CHIP_COLORS.info };
	}

	// Rule 14: Running tests
	if (input.activeTestCommandCount > 0) {
		return { label: 'RUNNING TESTS', colorVariable: CHIP_COLORS.info };
	}

	// Rule 15: Behind base
	if (input.syncStatus.type === 'behind-base') {
		return { label: 'BEHIND BASE', colorVariable: CHIP_COLORS.warning };
	}

	// Rule 16: Changes requested
	if (input.pullRequestState === 'changes-requested') {
		return { label: 'CHANGES REQ', colorVariable: CHIP_COLORS.warning };
	}

	// Rule 17: CI running
	if (input.prCiStatus === 'running') {
		return { label: 'CI RUNNING', colorVariable: CHIP_COLORS.info };
	}

	// Rule 18: Approved
	if (input.pullRequestState === 'approved') {
		return { label: 'APPROVED', colorVariable: CHIP_COLORS.success };
	}

	// Rule 19: Ready to merge
	if (input.pullRequestState === 'ready-to-merge') {
		return { label: 'READY TO MERGE', colorVariable: CHIP_COLORS.success };
	}

	// Rule 20: Worktree pending
	if (input.worktreeState === 'pending') {
		return { label: 'WORKTREE SETUP', colorVariable: CHIP_COLORS.warning };
	}

	// Rule 21: Worktree removing
	if (input.worktreeState === 'removing') {
		return { label: 'REMOVING WORKTREE', colorVariable: CHIP_COLORS.warning };
	}

	// Rule 22: Done (closed + merged)
	if (input.githubIssueState === 'closed' && input.pullRequestState === 'merged') {
		return { label: 'DONE', colorVariable: CHIP_COLORS.muted };
	}

	return null;
}
