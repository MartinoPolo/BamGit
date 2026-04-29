import type { WithElementRef, WithoutChildren } from '$lib/utils.js';
import type { HTMLTextareaAttributes } from 'svelte/elements';
import { tv } from 'tailwind-variants';

const TEXTAREA_STATE = {
	default: 'default',
	error: 'error',
} as const;

export type TextareaState = (typeof TEXTAREA_STATE)[keyof typeof TEXTAREA_STATE];

export const textareaVariants = tv({
	base: 'w-full rounded-[var(--radius-md)] border border-border bg-surface px-2.5 py-2 font-sans text-[length:var(--text-md)] leading-[1.5] text-foreground outline-none transition-[border-color,box-shadow] duration-[120ms] ease-[ease] resize-vertical placeholder:text-foreground-subtle hover:border-border-strong disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-surface-2 disabled:text-foreground-subtle disabled:opacity-70 focus-visible:border-ring focus-visible:shadow-[0_0_0_3px_color-mix(in_oklch,var(--ring)_22%,transparent)]',
	variants: {
		state: {
			default: '',
			error: 'border-status-danger shadow-[0_0_0_3px_color-mix(in_oklch,var(--status-danger)_18%,transparent)]',
		},
	},
	defaultVariants: {
		state: 'default',
	},
});

export type TextareaProps = WithoutChildren<WithElementRef<HTMLTextareaAttributes>> & {
	state?: TextareaState;
};
