import type { BadgeStyle } from '$lib/components/shadcn/badge/index.js';
import type { ChipColor } from '$lib/modules/issue-card/index.js';

/** @public */
export interface IssueStateChipProps {
	label: string;
	colorVariable: ChipColor;
	badgeStyle?: BadgeStyle;
}
