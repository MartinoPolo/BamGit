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
	'merged',
] as const;

export const BADGE_DOT_OPTIONS = ['static', 'pulsing'] as const;

export const BADGE_SIZE_OPTIONS = ['default', 'compact'] as const;

export const badgeVariants = tv({
	base: 'inline-flex items-center gap-1 font-medium border tracking-[0.01em] whitespace-nowrap',
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
			merged: 'bg-[color-mix(in_oklch,var(--status-merged)_14%,transparent)] text-status-merged border-[color-mix(in_oklch,var(--status-merged)_30%,transparent)]',
		},
		size: {
			default: 'h-5 px-1.75 text-[11px] rounded-full',
			compact: 'px-1.5 py-0.5 text-[10px] leading-tight rounded',
		},
	},
	defaultVariants: {
		variant: 'default',
		size: 'default',
	},
});

export type BadgeVariant = VariantProps<typeof badgeVariants>['variant'];
export type BadgeSize = VariantProps<typeof badgeVariants>['size'];
export type BadgeDot = (typeof BADGE_DOT_OPTIONS)[number];

export type BadgeProps = WithElementRef<HTMLAttributes<HTMLSpanElement>, HTMLSpanElement> & {
	variant?: BadgeVariant;
	size?: BadgeSize;
	dot?: BadgeDot;
	icon?: Snippet;
	children?: Snippet;
};
