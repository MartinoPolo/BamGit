import type { Issue } from '$lib/modules/issues';
import type { IssueDependency } from '$lib/types/generated';
import { SPECIAL_LABELS } from '$lib/modules/visualization';
import { hasLabel } from './ready_state';

export function isPrdIssue(issue: Issue): boolean {
	return hasLabel(issue, SPECIAL_LABELS.prd);
}

export function findPrdId(issueId: string, issuesById: ReadonlyMap<string, Issue>): string | null {
	let cursor = issuesById.get(issueId);
	const visited = new Set<string>();
	while (cursor !== undefined && !visited.has(cursor.id)) {
		if (isPrdIssue(cursor)) {
			return cursor.id;
		}
		visited.add(cursor.id);
		if (cursor.parent_issue_id === null) {
			return null;
		}
		cursor = issuesById.get(cursor.parent_issue_id);
	}
	return null;
}

export function buildIssuesById(issues: readonly Issue[]): Map<string, Issue> {
	const map = new Map<string, Issue>();
	for (const issue of issues) {
		map.set(issue.id, issue);
	}
	return map;
}

export interface PrdGroup {
	prd: Issue;
	subIssues: Issue[];
}

export function groupIssuesByPrd(issues: readonly Issue[]): {
	groups: PrdGroup[];
	orphans: Issue[];
} {
	const issuesById = buildIssuesById(issues);
	const groupsByPrdId = new Map<string, PrdGroup>();
	const orphans: Issue[] = [];

	for (const issue of issues) {
		if (isPrdIssue(issue)) {
			if (!groupsByPrdId.has(issue.id)) {
				groupsByPrdId.set(issue.id, { prd: issue, subIssues: [] });
			}
		}
	}

	for (const issue of issues) {
		if (isPrdIssue(issue)) {
			continue;
		}
		const prdId = findPrdId(issue.id, issuesById);
		if (prdId === null) {
			orphans.push(issue);
			continue;
		}
		const group = groupsByPrdId.get(prdId);
		if (group !== undefined) {
			group.subIssues.push(issue);
		} else {
			orphans.push(issue);
		}
	}

	return {
		groups: Array.from(groupsByPrdId.values()),
		orphans,
	};
}

export function isCrossPrdEdge(
	dependency: IssueDependency,
	issuesById: ReadonlyMap<string, Issue>,
): boolean {
	const blockerPrd = findPrdId(dependency.blocker_issue_id, issuesById);
	const blockedPrd = findPrdId(dependency.blocked_issue_id, issuesById);
	if (blockerPrd === null || blockedPrd === null) {
		return false;
	}
	return blockerPrd !== blockedPrd;
}

export interface PrdEdge {
	blockerPrdId: string;
	blockedPrdId: string;
	count: number;
}

export function aggregatePrdEdges(
	dependencies: readonly IssueDependency[],
	issuesById: ReadonlyMap<string, Issue>,
): PrdEdge[] {
	const counts = new Map<string, PrdEdge>();
	for (const dependency of dependencies) {
		const blockerPrd = findPrdId(dependency.blocker_issue_id, issuesById);
		const blockedPrd = findPrdId(dependency.blocked_issue_id, issuesById);
		if (blockerPrd === null || blockedPrd === null || blockerPrd === blockedPrd) {
			continue;
		}
		const key = `${blockerPrd}->${blockedPrd}`;
		const existing = counts.get(key);
		if (existing === undefined) {
			counts.set(key, { blockerPrdId: blockerPrd, blockedPrdId: blockedPrd, count: 1 });
		} else {
			existing.count += 1;
		}
	}
	return Array.from(counts.values());
}
