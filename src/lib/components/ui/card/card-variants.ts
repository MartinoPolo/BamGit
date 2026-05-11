import type { Snippet } from 'svelte';
import type { WithElementRef } from '$lib/utils.js';
import type { HTMLAttributes } from 'svelte/elements';
import { type VariantProps, tv } from 'tailwind-variants';

export const CARD_STATE_OPTIONS = [
	'default',
	'hover',
	'selected',
	'focus',
	'dragging',
	'loading',
	'error',
	'success',
	'archived',
	'disabled',
] as const;

export type CardState = (typeof CARD_STATE_OPTIONS)[number];

export const CARD_STATE_CLASSES: Partial<Record<CardState, string>> = {
	hover: 'border-border-strong shadow-md',
	selected:
		'border-primary shadow-[0_0_0_3px_color-mix(in_oklch,var(--primary)_22%,transparent)]',
	focus: 'outline-2 outline-solid outline-offset-2 outline-ring',
	dragging: '-rotate-1 scale-[1.02] shadow-lg cursor-grabbing opacity-[0.92]',
	loading: 'relative overflow-hidden',
	error: 'border-[color-mix(in_oklch,var(--status-danger)_50%,var(--border))] border-l-0.75 border-l-status-danger',
	success: 'border-l-0.75 border-l-status-success',
	archived: 'opacity-55',
	disabled: 'opacity-45 pointer-events-none',
};

export const cardVariants = tv({
	base: 'relative bg-surface border rounded-lg shadow-sm',
	variants: {
		padding: {
			none: '',
			padded: 'p-4',
		},
	},
	defaultVariants: {
		padding: 'none',
	},
});

export type CardPadding = VariantProps<typeof cardVariants>['padding'];

export type CardProps = WithElementRef<HTMLAttributes<HTMLDivElement>, HTMLDivElement> & {
	padding?: CardPadding;
	state?: CardState;
	accentBarColor?: string;
	gradientTint?: string;
	children?: Snippet;
};
