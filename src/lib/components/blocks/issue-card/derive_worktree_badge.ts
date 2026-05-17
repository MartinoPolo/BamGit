import type { WorktreeState } from '$lib/modules/issues/index.js';
import type { WorktreeBadgeResult } from './types.js';

export function deriveWorktreeBadge(worktreeState: WorktreeState): WorktreeBadgeResult | null {
	if (worktreeState === 'pending') {
		return { label: 'Setting up', tone: 'warning' };
	}

	if (worktreeState === 'active') {
		return { label: 'Worktree', tone: 'success' };
	}

	if (worktreeState === 'failed') {
		return { label: 'Failed', tone: 'danger' };
	}

	return null;
}
