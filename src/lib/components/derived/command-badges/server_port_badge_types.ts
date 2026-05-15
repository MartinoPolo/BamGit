import type { BadgeStyle } from '$lib/components/shadcn/badge/index.js';

/** @public */
export interface ServerPortBadgeProps {
	port: number;
	badgeStyle?: BadgeStyle;
	onclick?: () => void;
}
