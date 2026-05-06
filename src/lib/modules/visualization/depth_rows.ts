import type { IssueDependency } from '$lib/types/generated';

// fallow-ignore-next-line complexity
export function computeDepthRows(
	issueIds: readonly string[],
	dependencies: readonly IssueDependency[],
): Map<string, number> {
	const depthMap = new Map<string, number>();
	const issueSet = new Set(issueIds);

	for (const id of issueIds) {
		depthMap.set(id, 0);
	}

	if (dependencies.length === 0) {
		return depthMap;
	}

	const inDegree = new Map<string, number>();
	const adjacency = new Map<string, string[]>();

	for (const id of issueIds) {
		inDegree.set(id, 0);
		adjacency.set(id, []);
	}

	for (const dep of dependencies) {
		if (!issueSet.has(dep.blocker_issue_id) || !issueSet.has(dep.blocked_issue_id)) {
			continue;
		}
		adjacency.get(dep.blocker_issue_id)!.push(dep.blocked_issue_id);
		inDegree.set(dep.blocked_issue_id, inDegree.get(dep.blocked_issue_id)! + 1);
	}

	// Kahn's algorithm — longest-path variant
	const queue: string[] = [];
	for (const [id, degree] of inDegree) {
		if (degree === 0) {
			queue.push(id);
		}
	}

	let processed = 0;
	while (queue.length > 0) {
		const current = queue.shift()!;
		processed++;
		const currentDepth = depthMap.get(current)!;

		for (const neighbor of adjacency.get(current)!) {
			const candidateDepth = currentDepth + 1;
			if (candidateDepth > depthMap.get(neighbor)!) {
				depthMap.set(neighbor, candidateDepth);
			}
			inDegree.set(neighbor, inDegree.get(neighbor)! - 1);
			if (inDegree.get(neighbor) === 0) {
				queue.push(neighbor);
			}
		}
	}

	// Cycle handling: any unprocessed nodes stay at their current depth (0 or partial)
	if (processed < issueIds.length) {
		for (const id of issueIds) {
			if (!depthMap.has(id)) {
				depthMap.set(id, 0);
			}
		}
	}

	return depthMap;
}
