import type { IssuePriority } from './types.js';

export const PRIORITY_ORDER = {
	top: 0,
	high: 1,
	medium: 2,
	low: 3,
	lowest: 4,
} as const satisfies Record<IssuePriority, number>;

export const PRIORITY_ORDER_NONE = 5;

export function priorityRank(priority: IssuePriority | null): number {
	return priority !== null ? PRIORITY_ORDER[priority] : PRIORITY_ORDER_NONE;
}
