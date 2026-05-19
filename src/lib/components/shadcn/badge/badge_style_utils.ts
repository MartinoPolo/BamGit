import type { BadgeStyleOption } from '$lib/components/blocks/issue-card/index.js';

const BADGE_STYLE_CLASSES: Record<BadgeStyleOption, string> = {
	solid: 'bg-[color-mix(in_oklch,var(--badge-color)_20%,transparent)] text-[var(--badge-color)] border border-[color-mix(in_oklch,var(--badge-color)_35%,transparent)]',
	'borderless-dark':
		'bg-[color-mix(in_oklch,var(--badge-color)_18%,var(--surface))] text-[var(--badge-color)] border border-transparent',
	'bordered-dark':
		'bg-[color-mix(in_oklch,var(--badge-color)_18%,var(--surface))] text-[var(--badge-color)] border border-[color-mix(in_oklch,var(--badge-color)_30%,transparent)]',
};

export function resolveBadgeStyleClass(style: BadgeStyleOption): string {
	return BADGE_STYLE_CLASSES[style];
}
