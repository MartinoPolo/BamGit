import type { WithElementRef } from '$lib/utils.js';
import type { HTMLAttributes } from 'svelte/elements';
import { tv } from 'tailwind-variants';

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

export type HelpTextStatus = keyof typeof helpTextVariants.variants.status;

export const HELP_TEXT_STATUSES = Object.keys(helpTextVariants.variants.status) as HelpTextStatus[];

export type HelpTextProps = WithElementRef<HTMLAttributes<HTMLParagraphElement>> & {
	status?: HelpTextStatus;
};
