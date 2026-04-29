import type { Snippet } from 'svelte';
import type { WithElementRef } from '$lib/utils.js';
import type { HTMLAttributes } from 'svelte/elements';
import { type VariantProps, tv } from 'tailwind-variants';

export const BADGE_VARIANT_OPTIONS = [
	'default',
	'success',
	'warning',
	'danger',
	'info',
	'moss',
	'amber',
	'mono',
] as const;

export const BADGE_DOT_OPTIONS = ['static', 'pulsing'] as const;

export const badgeVariants = tv({
	base: 'inline-flex items-center gap-1 h-5 px-[7px] text-[11px] font-medium rounded-full border tracking-[0.01em] whitespace-nowrap',
	variants: {
		variant: {
			default: 'bg-surface-2 text-foreground-muted border-border',
			success:
				'bg-[color-mix(in_oklch,var(--status-success)_14%,transparent)] text-status-success border-[color-mix(in_oklch,var(--status-success)_30%,transparent)]',
			warning:
				'bg-[color-mix(in_oklch,var(--status-warning)_14%,transparent)] text-[color-mix(in_oklch,var(--status-warning)_70%,var(--foreground))] border-[color-mix(in_oklch,var(--status-warning)_30%,transparent)]',
			danger: 'bg-[color-mix(in_oklch,var(--status-danger)_14%,transparent)] text-status-danger border-[color-mix(in_oklch,var(--status-danger)_30%,transparent)]',
			info: 'bg-[color-mix(in_oklch,var(--status-info)_14%,transparent)] text-status-info border-[color-mix(in_oklch,var(--status-info)_30%,transparent)]',
			moss: 'bg-[color-mix(in_oklch,var(--primary)_14%,transparent)] text-primary border-[color-mix(in_oklch,var(--primary)_30%,transparent)]',
			amber: 'bg-[color-mix(in_oklch,var(--accent)_16%,transparent)] text-[color-mix(in_oklch,var(--accent)_70%,var(--foreground))] border-[color-mix(in_oklch,var(--accent)_32%,transparent)]',
			mono: 'bg-surface-2 text-foreground-muted border-border font-mono text-[10.5px]',
		},
	},
	defaultVariants: {
		variant: 'default',
	},
});

export type BadgeVariant = VariantProps<typeof badgeVariants>['variant'];
export type BadgeDot = (typeof BADGE_DOT_OPTIONS)[number];

export type BadgeProps = WithElementRef<HTMLAttributes<HTMLSpanElement>, HTMLSpanElement> & {
	variant?: BadgeVariant;
	dot?: BadgeDot;
	icon?: Snippet;
	children?: Snippet;
};
