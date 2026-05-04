import type { Snippet } from 'svelte';
import type { WithElementRef } from '$lib/utils.js';
import type { HTMLAttributes } from 'svelte/elements';
import { type VariantProps, tv } from 'tailwind-variants';

export const kbdVariants = tv({
	base: 'inline-flex items-center justify-center min-w-[18px] h-[18px] px-[5px] rounded-[4px] font-mono text-[10.5px] [&_svg:not([class*="size-"])]:size-3 [&_svg]:shrink-0',
	variants: {
		variant: {
			default: 'bg-surface-2 border border-border text-foreground-muted',
			inverted: 'bg-white/20 border border-white/30 text-primary-foreground',
		},
	},
	defaultVariants: {
		variant: 'default',
	},
});

export type KbdVariant = VariantProps<typeof kbdVariants>['variant'];

export type KbdProps = WithElementRef<HTMLAttributes<HTMLElement>, HTMLElement> & {
	variant?: KbdVariant;
	children?: Snippet;
};
