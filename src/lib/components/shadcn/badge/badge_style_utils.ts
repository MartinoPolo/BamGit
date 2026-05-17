import type { BadgeStyleOption } from '$lib/modules/issue-card/index.js';

export function resolveBadgeStyleClasses(colorVar: string, style: BadgeStyleOption): string {
	if (style === 'solid') {
		return `bg-[var(${colorVar})] text-white border border-transparent`;
	}
	if (style === 'bordered-dark') {
		return `bg-[color-mix(in_oklch,var(${colorVar})_14%,transparent)] text-[var(${colorVar})] border border-[color-mix(in_oklch,var(${colorVar})_25%,transparent)]`;
	}
	return `bg-[color-mix(in_oklch,var(${colorVar})_14%,transparent)] text-[var(${colorVar})] border border-transparent`;
}
