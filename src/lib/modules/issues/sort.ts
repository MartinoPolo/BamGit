import type { Issue } from './types.js';
import type { SortMode } from './types.js';
import { PRIORITY_ORDER, PRIORITY_ORDER_NONE } from './priority.js';

export function sortIssues(issues: readonly Issue[], mode: SortMode): Issue[] {
	const list = [...issues];
	switch (mode) {
		case 'priority':
			return list.sort(
				(a, b) =>
					(a.priority !== null ? PRIORITY_ORDER[a.priority] : PRIORITY_ORDER_NONE) -
					(b.priority !== null ? PRIORITY_ORDER[b.priority] : PRIORITY_ORDER_NONE),
			);
		case 'name':
			return list.sort((a, b) => a.name.localeCompare(b.name));
		case 'date':
			return list.sort(
				(a, b) => a.sort_order - b.sort_order || a.created_at.localeCompare(b.created_at),
			);
	}
}
