import type { Issue } from '$lib/modules/issues';
import { SPECIAL_LABELS } from '$lib/modules/visualization';

export const READY_STATE = {
	readyToExecute: 'ready-to-execute',
	readyToGrill: 'ready-to-grill',
	needsDesign: 'needs-design',
	none: 'none',
} as const;

export type ReadyState = (typeof READY_STATE)[keyof typeof READY_STATE];

export const DESIGN_NEEDED_LABEL = 'design-needed';

interface ClassifyArgs {
	issue: Issue;
	hasOpenBlockers: boolean;
}

export function hasLabel(issue: Issue, labelName: string): boolean {
	return issue.labels.some((label) => label.name === labelName);
}

export function isClosedIssue(issue: Issue): boolean {
	return issue.status === 'archived';
}

export function classifyReadyState({ issue, hasOpenBlockers }: ClassifyArgs): ReadyState {
	if (isClosedIssue(issue)) {
		return READY_STATE.none;
	}

	if (hasLabel(issue, DESIGN_NEEDED_LABEL)) {
		return READY_STATE.needsDesign;
	}

	if (hasOpenBlockers) {
		return READY_STATE.none;
	}

	if (hasLabel(issue, SPECIAL_LABELS.afk)) {
		return READY_STATE.readyToExecute;
	}

	if (hasLabel(issue, SPECIAL_LABELS.hitl)) {
		return READY_STATE.readyToGrill;
	}

	return READY_STATE.none;
}

export function buildOpenBlockerCounts(
	issues: readonly Issue[],
	dependencies: readonly { blocker_issue_id: string; blocked_issue_id: string }[],
): Map<string, number> {
	const issueById = new Map<string, Issue>();
	for (const issue of issues) {
		issueById.set(issue.id, issue);
	}

	const counts = new Map<string, number>();
	for (const dependency of dependencies) {
		const blocker = issueById.get(dependency.blocker_issue_id);
		if (blocker !== undefined && !isClosedIssue(blocker)) {
			counts.set(
				dependency.blocked_issue_id,
				(counts.get(dependency.blocked_issue_id) ?? 0) + 1,
			);
		}
	}
	return counts;
}
