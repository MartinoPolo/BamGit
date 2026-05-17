import type { BadgeStyleOption } from '$lib/components/blocks/issue-card/index.js';

const BADGE_STYLE_CLASSES: Record<BadgeStyleOption, string> = {
	solid: 'badge-style-solid',
	'borderless-dark': 'badge-style-borderless-dark',
	'bordered-dark': 'badge-style-bordered-dark',
};

export function resolveBadgeStyleClass(style: BadgeStyleOption): string {
	return BADGE_STYLE_CLASSES[style];
}
