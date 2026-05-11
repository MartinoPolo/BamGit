import type { WithElementRef } from '$lib/utils.js';
import type { HTMLAttributes } from 'svelte/elements';
import { tv } from 'tailwind-variants';

export const HELP_TEXT_STATUS = {
	default: 'default',
	error: 'error',
	success: 'success',
} as const;

export type HelpTextStatus = (typeof HELP_TEXT_STATUS)[keyof typeof HELP_TEXT_STATUS];

export const helpTextVariants = tv({
	base: 'mt-1 text-[11px] text-foreground-subtle',
	variants: {
		status: {
			default: '',
			error: 'text-status-danger',
			success: 'text-status-success',
		},
	},
	defaultVariants: {
		status: 'default',
	},
});

export type HelpTextProps = WithElementRef<HTMLAttributes<HTMLParagraphElement>> & {
	status?: HelpTextStatus;
};
