// fallow-ignore-next-line complexity
export function computeDepthRows(
	issueIds: readonly string[],
	parentIssueIds: ReadonlyMap<string, string | null>,
	prdIssueId: string | null,
): Map<string, number> {
	const depthMap = new Map<string, number>();

	if (prdIssueId === null) {
		for (const id of issueIds) {
			depthMap.set(id, 0);
		}
		return depthMap;
	}

	const childrenByParent = new Map<string, string[]>();
	for (const id of issueIds) {
		const parentId = parentIssueIds.get(id) ?? null;
		if (parentId !== null) {
			const children = childrenByParent.get(parentId);
			if (children) {
				children.push(id);
			} else {
				childrenByParent.set(parentId, [id]);
			}
		}
	}

	const queue: Array<{ id: string; depth: number }> = [];
	const prdChildren = childrenByParent.get(prdIssueId) ?? [];
	for (const childId of prdChildren) {
		queue.push({ id: childId, depth: 0 });
		depthMap.set(childId, 0);
	}

	while (queue.length > 0) {
		const current = queue.shift()!;
		const children = childrenByParent.get(current.id) ?? [];
		for (const childId of children) {
			if (!depthMap.has(childId)) {
				depthMap.set(childId, current.depth + 1);
				queue.push({ id: childId, depth: current.depth + 1 });
			}
		}
	}

	for (const id of issueIds) {
		if (!depthMap.has(id) && id !== prdIssueId) {
			depthMap.set(id, 0);
		}
	}

	return depthMap;
}
