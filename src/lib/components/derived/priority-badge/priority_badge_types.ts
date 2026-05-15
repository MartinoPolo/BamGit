import type { BadgeStyle } from '$lib/components/shadcn/badge/index.js';
import type { IssuePriority } from '$lib/modules/issues/types.js';

export const PRIORITY_POSITIONS = [
	'header-right',
	'preview-bottom-half',
	'preview-top-half',
	'preview-bottom-inside',
	'preview-top-inside',
	'preview-tl',
	'preview-tr',
	'preview-bl',
	'preview-br',
] as const;

/** @public */
export type PriorityPosition = (typeof PRIORITY_POSITIONS)[number];

/** @public */
export type DisplayPriority = Exclude<IssuePriority, 'medium'>;

/** @public */
export const PRIORITY_LABELS = {
	top: 'TOP',
	high: 'HIGH',
	low: 'LOW',
	lowest: 'LOWEST',
} as const satisfies Record<DisplayPriority, string>;

/** @public */
export const PRIORITY_COLOR_VARIABLES = {
	top: '--priority-top',
	high: '--priority-high',
	low: '--priority-low',
	lowest: '--priority-lowest',
} as const satisfies Record<DisplayPriority, string>;

/** @public */
export interface PriorityBadgeProps {
	priority: DisplayPriority;
	position?: PriorityPosition;
	badgeStyle?: BadgeStyle;
	onclick?: () => void;
}
