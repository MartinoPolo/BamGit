import type { BadgeStyleOption } from './badge_types.js';

const BADGE_STYLE_CLASSES: Record<BadgeStyleOption, string> = {
	solid: 'bg-[var(--badge-color)] text-[var(--badge-contrast-text,#fff)] border-transparent',
	subtle: 'bg-[color-mix(in_srgb,var(--badge-color)_18%,var(--surface))] text-[var(--badge-color)] border border-transparent',
	outlined:
		'bg-[color-mix(in_srgb,var(--badge-color)_18%,var(--surface))] text-[var(--badge-color)] border border-[color-mix(in_srgb,var(--badge-color)_30%,transparent)]',
};

export function resolveBadgeStyleClass(style: BadgeStyleOption): string {
	return BADGE_STYLE_CLASSES[style];
}
