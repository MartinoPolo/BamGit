import * as m from '$lib/paraglide/messages.js';
import type { IssuePriority } from '$lib/modules/issues';

// ─── Priority Display Constants ─────────────────────────────────────────────

export const PRIORITY_BORDER_CLASSES = {
	top: 'border-l-priority-top',
	high: 'border-l-priority-high',
	medium: 'border-l-priority-medium',
	low: 'border-l-priority-low',
	lowest: 'border-l-priority-lowest',
} as const satisfies Record<IssuePriority, string>;

export const PRIORITY_BADGE_CLASSES = {
	top: 'bg-[color-mix(in_oklch,var(--priority-top)_14%,transparent)] text-priority-top',
	high: 'bg-[color-mix(in_oklch,var(--priority-high)_14%,transparent)] text-priority-high',
	medium: 'bg-[color-mix(in_oklch,var(--priority-medium)_14%,transparent)] text-priority-medium',
	low: 'bg-[color-mix(in_oklch,var(--priority-low)_14%,transparent)] text-priority-low',
	lowest: 'bg-[color-mix(in_oklch,var(--priority-lowest)_14%,transparent)] text-priority-lowest',
} as const satisfies Record<IssuePriority, string>;

export const PRIORITY_OPTIONS: { value: IssuePriority; label: () => string }[] = [
	{ value: 'top', label: () => m.priority_top() },
	{ value: 'high', label: () => m.priority_high() },
	{ value: 'medium', label: () => m.priority_medium() },
	{ value: 'low', label: () => m.priority_low() },
	{ value: 'lowest', label: () => m.priority_lowest() },
];

// ─── Priority Border Class Logic ────────────────────────────────────────────

export function getPriorityBorderClass(
	priority: IssuePriority | null,
	prioritiesEnabled: boolean,
): string {
	if (!prioritiesEnabled || priority === null) {
		return 'border-l-transparent';
	}
	return PRIORITY_BORDER_CLASSES[priority];
}
