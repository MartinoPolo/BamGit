import {
	ACTION_IDS,
	type ActionId,
	type ContextualActionInput,
	type DerivedActions,
} from './types.js';

const ALL_ACTION_IDS = Object.values(ACTION_IDS);

const COMMIT_ACTIONS: ActionId[] = [
	ACTION_IDS.Commit,
	ACTION_IDS.CommitAndPush,
	ACTION_IDS.CommitPushAndPr,
];

function buildResult(
	primary: ActionId | null,
	secondary: ActionId | null,
	overflow: ActionId[],
	disabled: ActionId[],
): DerivedActions {
	return { primary, secondary, overflow, disabled };
}

function disableAllExcept(...kept: (ActionId | null)[]): ActionId[] {
	const keptSet = new Set(kept.filter(Boolean));
	return ALL_ACTION_IDS.filter((id) => !keptSet.has(id));
}

function isActiveSession(sessionState: ContextualActionInput['sessionState']): boolean {
	return (
		sessionState === 'executing' ||
		sessionState === 'hitl' ||
		sessionState === 'review' ||
		sessionState === 'error' ||
		sessionState === 'paused'
	);
}

function hasHitlLabel(labels: ContextualActionInput['labels']): boolean {
	return labels.some((label) => label.name.toLowerCase() === 'hitl');
}

function hasNoWorktree(worktreeState: ContextualActionInput['worktreeState']): boolean {
	return worktreeState === 'none' || worktreeState === 'removing' || worktreeState === 'removed';
}

function isActivePrState(prState: ContextualActionInput['prState']): boolean {
	return (
		prState === 'draft' ||
		prState === 'open' ||
		prState === 'review-requested' ||
		prState === 'changes-requested' ||
		prState === 'approved' ||
		prState === 'ready-to-merge'
	);
}

// fallow-ignore-next-line complexity
export function deriveContextualActions(input: ContextualActionInput): DerivedActions {
	// Level 1: Session running
	if (isActiveSession(input.sessionState)) {
		return buildResult(
			ACTION_IDS.ViewSession,
			null,
			[],
			disableAllExcept(ACTION_IDS.ViewSession),
		);
	}

	// Level 2: Worktree failed
	if (input.worktreeState === 'failed') {
		return buildResult(
			ACTION_IDS.RetryWorktree,
			ACTION_IDS.RemoveWorktree,
			[],
			disableAllExcept(ACTION_IDS.RetryWorktree, ACTION_IDS.RemoveWorktree),
		);
	}

	// Level 3: Merge conflict
	if (input.mergeConflict) {
		return buildResult(
			ACTION_IDS.SyncBase,
			ACTION_IDS.Run,
			[ACTION_IDS.RemoveWorktree],
			[
				...COMMIT_ACTIONS,
				ACTION_IDS.Push,
				ACTION_IDS.CreatePr,
				ACTION_IDS.Merge,
				ACTION_IDS.Review,
			],
		);
	}

	// Level 4: Local changes, no PR
	if (input.hasLocalChanges && !isActivePrState(input.prState)) {
		return buildResult(
			ACTION_IDS.CommitPushAndPr,
			ACTION_IDS.CommitAndPush,
			[
				ACTION_IDS.Commit,
				ACTION_IDS.Review,
				ACTION_IDS.CheckAndFix,
				ACTION_IDS.Run,
				ACTION_IDS.CodeClean,
			],
			[ACTION_IDS.Push, ACTION_IDS.CreatePr, ACTION_IDS.Merge],
		);
	}

	// Level 5: Local changes, PR exists
	if (input.hasLocalChanges && isActivePrState(input.prState)) {
		return buildResult(
			ACTION_IDS.CommitAndPush,
			ACTION_IDS.Commit,
			[ACTION_IDS.Review, ACTION_IDS.CheckAndFix, ACTION_IDS.Run, ACTION_IDS.CodeClean],
			[ACTION_IDS.Push, ACTION_IDS.CreatePr, ACTION_IDS.Merge],
		);
	}

	// Level 6: Ahead of remote, no PR
	if (input.aheadRemoteCount > 0 && !isActivePrState(input.prState)) {
		return buildResult(
			ACTION_IDS.CreatePr,
			ACTION_IDS.Push,
			[ACTION_IDS.Review, ACTION_IDS.CheckAndFix, ACTION_IDS.Run, ACTION_IDS.SyncBase],
			[...COMMIT_ACTIONS, ACTION_IDS.Merge],
		);
	}

	// Level 7: Ahead of remote, PR exists
	if (input.aheadRemoteCount > 0 && isActivePrState(input.prState)) {
		return buildResult(
			ACTION_IDS.Push,
			ACTION_IDS.Review,
			[ACTION_IDS.CheckAndFix, ACTION_IDS.Run, ACTION_IDS.SyncBase],
			[...COMMIT_ACTIONS, ACTION_IDS.CreatePr, ACTION_IDS.Merge],
		);
	}

	// Level 8: PR changes-requested
	if (input.prState === 'changes-requested') {
		return buildResult(
			ACTION_IDS.Run,
			ACTION_IDS.Review,
			[ACTION_IDS.CheckAndFix, ACTION_IDS.SyncBase, ACTION_IDS.CodeClean],
			[...COMMIT_ACTIONS, ACTION_IDS.Push, ACTION_IDS.Merge],
		);
	}

	// Level 9: PR approved / ready-to-merge
	if (input.prState === 'approved' || input.prState === 'ready-to-merge') {
		return buildResult(
			ACTION_IDS.Merge,
			ACTION_IDS.Review,
			[ACTION_IDS.SyncBase],
			[...COMMIT_ACTIONS, ACTION_IDS.Push, ACTION_IDS.Run],
		);
	}

	// Level 10: PR open / review-requested / draft
	if (
		input.prState === 'open' ||
		input.prState === 'review-requested' ||
		input.prState === 'draft'
	) {
		return buildResult(
			ACTION_IDS.Review,
			ACTION_IDS.CheckAndFix,
			[ACTION_IDS.Run, ACTION_IDS.SyncBase, ACTION_IDS.CodeClean],
			[...COMMIT_ACTIONS, ACTION_IDS.Push, ACTION_IDS.Merge],
		);
	}

	// Level 11: Behind base
	if (input.behindBaseCount > 0) {
		return buildResult(
			ACTION_IDS.SyncBase,
			ACTION_IDS.Run,
			[ACTION_IDS.Review, ACTION_IDS.CheckAndFix],
			[...COMMIT_ACTIONS, ACTION_IDS.Push, ACTION_IDS.Merge],
		);
	}

	// Level 12: HITL label
	if (hasHitlLabel(input.labels)) {
		return buildResult(
			ACTION_IDS.Hitl,
			ACTION_IDS.Run,
			[ACTION_IDS.Review, ACTION_IDS.CheckAndFix],
			[...COMMIT_ACTIONS, ACTION_IDS.Push, ACTION_IDS.Merge],
		);
	}

	// Level 13: No worktree
	if (hasNoWorktree(input.worktreeState)) {
		return buildResult(
			ACTION_IDS.Run,
			ACTION_IDS.SetupWorktree,
			[],
			disableAllExcept(ACTION_IDS.Run, ACTION_IDS.SetupWorktree),
		);
	}

	// Level 14: Default (active, clean, idle)
	return buildResult(
		ACTION_IDS.Run,
		ACTION_IDS.Review,
		[ACTION_IDS.CheckAndFix, ACTION_IDS.CodeClean],
		[...COMMIT_ACTIONS, ACTION_IDS.Push, ACTION_IDS.Merge],
	);
}
