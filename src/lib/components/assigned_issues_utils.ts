import type { AssignedIssue } from '$lib/types/generated';
import type { Issue } from '$lib/modules/issues';

/** @public */
export interface CategorizedAssignedIssues {
	unlinked: AssignedIssue[];
	linked: AssignedIssue[];
}

export function categorizeAssignedIssues(
	assignedIssues: readonly AssignedIssue[],
	dashboardIssues: readonly Issue[],
): CategorizedAssignedIssues {
	const linkedNumbers = new Set<number>();
	for (const issue of dashboardIssues) {
		if (issue.github_issue_number !== null) {
			linkedNumbers.add(issue.github_issue_number);
		}
	}

	const unlinked: AssignedIssue[] = [];
	const linked: AssignedIssue[] = [];

	for (const assignedIssue of assignedIssues) {
		if (linkedNumbers.has(assignedIssue.number)) {
			linked.push(assignedIssue);
		} else {
			unlinked.push(assignedIssue);
		}
	}

	return { unlinked, linked };
}

const PRIORITY_LABEL_NAMES = new Set(['afk', 'hitl', 'AFK', 'HITL']);
const SECONDARY_LABEL_NAMES = new Set(['design-needed']);

export function sortLabelsByPriority(
	labels: readonly { name: string; color: string }[],
): { name: string; color: string }[] {
	return [...labels].sort((a, b) => {
		const aPriority = PRIORITY_LABEL_NAMES.has(a.name)
			? 0
			: SECONDARY_LABEL_NAMES.has(a.name)
				? 1
				: 2;
		const bPriority = PRIORITY_LABEL_NAMES.has(b.name)
			? 0
			: SECONDARY_LABEL_NAMES.has(b.name)
				? 1
				: 2;
		return aPriority - bPriority;
	});
}

export type SortColumn = 'prd' | 'number' | 'title' | 'labels';
export type SortDirection = 'asc' | 'desc';

export function sortAssignedIssues(
	issues: readonly AssignedIssue[],
	column: SortColumn,
	direction: SortDirection,
): AssignedIssue[] {
	const sorted = [...issues];
	const multiplier = direction === 'asc' ? 1 : -1;

	sorted.sort((a, b) => {
		switch (column) {
			case 'prd': {
				const aPrd = a.parent_issue_number ?? Infinity;
				const bPrd = b.parent_issue_number ?? Infinity;
				return (aPrd - bPrd) * multiplier;
			}
			case 'number':
				return (a.number - b.number) * multiplier;
			case 'title':
				return a.title.localeCompare(b.title) * multiplier;
			case 'labels': {
				const aCount = a.labels.length;
				const bCount = b.labels.length;
				return (aCount - bCount) * multiplier;
			}
		}
	});

	return sorted;
}

export function filterAssignedIssues(
	issues: readonly AssignedIssue[],
	query: string,
): AssignedIssue[] {
	const trimmed = query.trim().toLowerCase();
	if (trimmed === '') {
		return [...issues];
	}
	return issues.filter((issue) => {
		const numberStr = `#${issue.number}`;
		const prdStr = issue.parent_issue_number !== null ? `#${issue.parent_issue_number}` : '';
		return (
			numberStr.includes(trimmed) ||
			prdStr.includes(trimmed) ||
			issue.title.toLowerCase().includes(trimmed) ||
			issue.number.toString().includes(trimmed)
		);
	});
}
