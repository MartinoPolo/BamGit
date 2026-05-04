import type { Issue as GeneratedIssue } from '$lib/types/generated';
import type { Issue, IssueLabel, IssuePriority, IssueStatus, WorktreeState } from './types.js';

const HEX_COLOR_PATTERN = /^#[0-9a-fA-F]{6}$/;

function deserializeLabels(raw: string | null): IssueLabel[] {
	if (raw === null) {
		return [];
	}
	try {
		const parsed: unknown = JSON.parse(raw);
		if (!Array.isArray(parsed)) {
			return [];
		}
		return (parsed as IssueLabel[]).map((label) => ({
			...label,
			color: HEX_COLOR_PATTERN.test(label.color) ? label.color : '#808080',
		}));
	} catch {
		return [];
	}
}

const VALID_PRIORITIES: ReadonlySet<string> = new Set(['lowest', 'low', 'medium', 'high', 'top']);
const VALID_STATUSES: ReadonlySet<string> = new Set(['active', 'archived']);
const VALID_WORKTREE_STATES: ReadonlySet<string> = new Set([
	'none',
	'pending',
	'active',
	'failed',
	'removing',
	'removed',
]);

function validatePriority(value: string | null): IssuePriority | null {
	if (value === null) {
		return null;
	}
	if (VALID_PRIORITIES.has(value)) {
		return value as IssuePriority;
	}
	return null;
}

function validateStatus(value: string): IssueStatus {
	if (VALID_STATUSES.has(value)) {
		return value as IssueStatus;
	}
	return 'active';
}

export function validateWorktreeState(value: string): WorktreeState {
	if (VALID_WORKTREE_STATES.has(value)) {
		return value as WorktreeState;
	}
	return 'none';
}

export function serializeLabels(labels: IssueLabel[] | undefined): string | null | undefined {
	if (labels === undefined) {
		return undefined;
	}
	return JSON.stringify(labels);
}

export function toIssue(raw: GeneratedIssue): Issue {
	return {
		...raw,
		labels: deserializeLabels(raw.labels),
		priority: validatePriority(raw.priority),
		status: validateStatus(raw.status),
		worktree_state: validateWorktreeState(raw.worktree_state),
	};
}
