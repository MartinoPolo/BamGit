import type { BadgeStyle } from '$lib/components/shadcn/badge/index.js';
import type { ChipColor } from '$lib/components/blocks/issue-card/index.js';

/** @public */
export interface IssueStateChipProps {
	label: string;
	colorVariable: ChipColor;
	badgeStyle?: BadgeStyle;
}
