import type { BadgeStyle } from '$lib/components/shadcn/badge/index.js';
import type { IssuePriority } from '$lib/modules/issues/types.js';
import type { PriorityPositionOption } from '$lib/components/blocks/issue-card/index.js';

/** @public */
export type PriorityPosition = PriorityPositionOption;

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
	onclick?: (event: MouseEvent) => void;
}
