import type { AssignedIssue } from '$lib/types/generated';
import type { Issue } from '$lib/modules/issues';

/** @public */
export interface CategorizedAssignedIssues {
	unlinked: AssignedIssue[];
	linked: AssignedIssue[];
	deleted: AssignedIssue[];
}

export function categorizeAssignedIssues(
	assignedIssues: readonly AssignedIssue[],
	dashboardIssues: readonly Issue[],
	deletedIssueNumbers: readonly number[],
): CategorizedAssignedIssues {
	const linkedNumbers = new Set<number>();
	for (const issue of dashboardIssues) {
		if (issue.github_issue_number !== null) {
			linkedNumbers.add(issue.github_issue_number);
		}
	}

	const deletedSet = new Set(deletedIssueNumbers);

	const unlinked: AssignedIssue[] = [];
	const linked: AssignedIssue[] = [];
	const deleted: AssignedIssue[] = [];

	for (const assignedIssue of assignedIssues) {
		if (linkedNumbers.has(assignedIssue.number)) {
			linked.push(assignedIssue);
		} else if (deletedSet.has(assignedIssue.number)) {
			deleted.push(assignedIssue);
		} else {
			unlinked.push(assignedIssue);
		}
	}

	return { unlinked, linked, deleted };
}
