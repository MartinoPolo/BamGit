import * as m from '$lib/paraglide/messages.js';
import type { IssuePriority } from '$lib/modules/issues';
import { Persisted, jsonSerde } from '$lib/reactivity/persisted.svelte';

// ─── Priority Display Constants ─────────────────────────────────────────────

export const PRIORITY_BORDER_CLASSES = {
	top: 'border-l-red-500',
	high: 'border-l-orange-400',
	medium: 'border-l-yellow-400',
	low: 'border-l-blue-400',
	lowest: 'border-l-gray-400',
} as const satisfies Record<IssuePriority, string>;

export const PRIORITY_BADGE_CLASSES = {
	top: 'bg-red-900/40 text-red-400',
	high: 'bg-orange-900/40 text-orange-400',
	medium: 'bg-yellow-900/40 text-yellow-400',
	low: 'bg-blue-900/40 text-blue-400',
	lowest: 'bg-gray-800/40 text-gray-400',
} as const satisfies Record<IssuePriority, string>;

export const PRIORITY_OPTIONS: { value: IssuePriority | null; label: () => string }[] = [
	{ value: 'top', label: () => m.priority_top() },
	{ value: 'high', label: () => m.priority_high() },
	{ value: 'medium', label: () => m.priority_medium() },
	{ value: 'low', label: () => m.priority_low() },
	{ value: 'lowest', label: () => m.priority_lowest() },
	{ value: null, label: () => m.priority_none() },
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

// ─── Collapse/Expand Persistence ────────────────────────────────────────────

export function isExpandedStates(value: unknown): value is Record<string, boolean> {
	if (typeof value !== 'object' || value === null || Array.isArray(value)) {
		return false;
	}
	return Object.values(value).every((v) => typeof v === 'boolean');
}

export const issueExpandedStates = new Persisted<Record<string, boolean>>({
	key: 'grovekeeper_issue_expanded',
	serde: jsonSerde(isExpandedStates),
	defaultValue: {},
});
