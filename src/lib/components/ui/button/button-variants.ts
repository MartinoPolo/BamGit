import type { WithElementRef } from '$lib/utils.js';
import type { HTMLAnchorAttributes, HTMLButtonAttributes } from 'svelte/elements';
import { type VariantProps, tv } from 'tailwind-variants';

export const buttonVariants = tv({
	base: 'inline-flex shrink-0 items-center justify-center gap-[6px] whitespace-nowrap rounded-md border border-transparent font-medium leading-none outline-none select-none transition-[background,border-color,color,transform,filter,box-shadow] duration-[120ms] ease-[ease] active:scale-[0.96] focus-visible:outline-2 focus-visible:outline-solid focus-visible:outline-offset-2 focus-visible:outline-ring disabled:pointer-events-none disabled:opacity-45 [&_svg:not([class*="size-"])]:size-4 [&_svg]:pointer-events-none [&_svg]:shrink-0',
	variants: {
		variant: {
			primary:
				'bg-primary text-primary-foreground shadow-sm hover:bg-[color-mix(in_oklch,var(--primary)_88%,white_12%)] dark:hover:bg-[color-mix(in_oklch,var(--primary)_88%,black_12%)]',
			secondary:
				'border-border bg-surface-2 text-foreground hover:bg-surface-3 hover:border-border-strong',
			ghost: 'bg-transparent text-foreground-muted hover:bg-surface-2 hover:text-foreground',
			danger: 'bg-transparent text-status-danger border-[color-mix(in_oklch,var(--status-danger)_35%,transparent)] hover:bg-[color-mix(in_oklch,var(--status-danger)_12%,transparent)]',
		},
		size: {
			sm: 'h-[var(--size-control-sm)] px-[9px] text-[length:var(--text-sm)] rounded-[var(--radius-sm)]',
			md: 'h-[var(--size-control-md)] px-3 text-[length:var(--text-md)]',
			lg: 'h-[var(--size-control-lg)] px-4 text-[length:var(--text-base)]',
			icon: 'size-[var(--size-control-md)] p-0',
			'icon-sm': 'size-[var(--size-control-sm)] p-0',
		},
	},
	defaultVariants: {
		variant: 'primary',
		size: 'md',
	},
});

export type ButtonVariant = VariantProps<typeof buttonVariants>['variant'];
export type ButtonSize = VariantProps<typeof buttonVariants>['size'];

export type ButtonProps = WithElementRef<HTMLButtonAttributes> &
	WithElementRef<HTMLAnchorAttributes> & {
		variant?: ButtonVariant;
		size?: ButtonSize;
	};
