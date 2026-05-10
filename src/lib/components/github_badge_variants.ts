import type { PullRequestState } from '$lib/types/generated';

export const VARIANT_CLASSES = {
	success:
		'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/40 dark:text-green-300 dark:border-green-700/50',
	danger: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/40 dark:text-red-300 dark:border-red-700/50',
	warning:
		'bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/40 dark:text-yellow-300 dark:border-yellow-700/50',
	orange: 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-900/40 dark:text-orange-300 dark:border-orange-700/50',
	info: 'bg-cyan-50 text-cyan-700 border-cyan-200 dark:bg-cyan-900/40 dark:text-cyan-300 dark:border-cyan-700/50',
	emerald:
		'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-300 dark:border-emerald-700/50',
	purple: 'bg-[color-mix(in_oklch,var(--status-merged)_14%,transparent)] text-status-merged border-[color-mix(in_oklch,var(--status-merged)_30%,transparent)]',
	neutral:
		'bg-neutral-50 text-neutral-600 border-neutral-200 dark:bg-neutral-800/40 dark:text-neutral-400 dark:border-neutral-600/50',
} as const satisfies Record<string, string>;

type GitHubBadgeVariant = keyof typeof VARIANT_CLASSES;

export interface StateConfig {
	variant: GitHubBadgeVariant;
	label: string;
	prefix: string;
}

type IssueState = 'open' | 'closed';

export const ISSUE_STATE_CONFIG: Record<IssueState, StateConfig> = {
	open: { variant: 'success', label: 'Open', prefix: 'Issue' },
	closed: { variant: 'purple', label: 'Closed', prefix: 'Issue' },
};

export const PR_STATE_CONFIG: Record<PullRequestState, StateConfig> = {
	open: { variant: 'success', label: 'Open', prefix: 'PR' },
	draft: { variant: 'neutral', label: 'Draft', prefix: 'PR' },
	'review-requested': { variant: 'warning', label: 'Review', prefix: 'PR' },
	'changes-requested': { variant: 'orange', label: 'Changes', prefix: 'PR' },
	approved: { variant: 'emerald', label: 'Approved', prefix: 'PR' },
	'ready-to-merge': { variant: 'info', label: 'Ready', prefix: 'PR' },
	merged: { variant: 'purple', label: 'Merged', prefix: 'PR' },
	closed: { variant: 'danger', label: 'Closed', prefix: 'PR' },
};
