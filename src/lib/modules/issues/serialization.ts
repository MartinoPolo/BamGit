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
		priority: raw.priority as IssuePriority | null,
		status: raw.status as IssueStatus,
		worktree_state: raw.worktree_state as WorktreeState,
	};
}
