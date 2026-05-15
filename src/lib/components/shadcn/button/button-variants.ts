import type { WithElementRef } from '$lib/utils.js';
import type { HTMLAnchorAttributes, HTMLButtonAttributes } from 'svelte/elements';
import { tv } from 'tailwind-variants';
import { asExhaustiveArray } from '$lib/utils/variants.js';

const FILLED_BUTTON_KBD_CLASSES =
	'[&_[data-slot=kbd]]:border-[color-mix(in_oklch,currentColor_28%,transparent)] [&_[data-slot=kbd]]:bg-[color-mix(in_oklch,currentColor_16%,transparent)] [&_[data-slot=kbd]]:text-current';

export const buttonVariants = tv({
	base: 'inline-flex shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-md border border-transparent font-medium leading-none outline-none select-none transition-[background,border-color,color,transform,filter,box-shadow] duration-120 ease-[ease] active:scale-[0.96] focus-visible:outline-2 focus-visible:outline-solid focus-visible:outline-offset-2 focus-visible:outline-ring disabled:pointer-events-none disabled:opacity-45 [&_[data-icon]]:pointer-events-none [&_[data-icon]]:shrink-0',
	variants: {
		intent: {
			primary: `bg-primary text-primary-foreground shadow-sm hover:bg-[color-mix(in_oklch,var(--primary)_88%,white_12%)] dark:hover:bg-[color-mix(in_oklch,var(--primary)_88%,black_12%)] ${FILLED_BUTTON_KBD_CLASSES}`,
			secondary:
				'border-border bg-surface-2 text-foreground hover:bg-surface-3 hover:border-border-strong',
			ghost: 'bg-transparent text-foreground-muted hover:bg-surface-2 hover:text-foreground',
			'ghost-overlay':
				'bg-transparent border-transparent text-current opacity-60 hover:opacity-90 hover:bg-[color-mix(in_oklch,currentColor_10%,transparent)]',
			danger: 'bg-transparent text-status-danger border-[color-mix(in_oklch,var(--status-danger)_35%,transparent)] hover:bg-[color-mix(in_oklch,var(--status-danger)_12%,transparent)]',
			'contextual-primary': `bg-moss-700 text-white shadow-sm hover:bg-moss-600 dark:bg-moss-600 dark:hover:bg-moss-500 ${FILLED_BUTTON_KBD_CLASSES}`,
			'primary-destructive': `bg-status-danger text-white shadow-sm hover:bg-[color-mix(in_oklch,var(--status-danger)_88%,white_12%)] dark:hover:bg-[color-mix(in_oklch,var(--status-danger)_88%,black_12%)] ${FILLED_BUTTON_KBD_CLASSES}`,
			'issue-color': `bg-[var(--issue-btn-bg,var(--surface-2))] text-[var(--issue-btn-text,var(--foreground))] border-[var(--issue-btn-border,var(--border))] shadow-sm hover:brightness-110 ${FILLED_BUTTON_KBD_CLASSES}`,
		},
		size: {
			sm: 'h-(--size-control-sm) px-2.25 text-(length:--text-sm) rounded-sm [&_[data-icon]]:size-3.5',
			md: 'h-(--size-control-md) px-3 text-(length:--text-md) [&_[data-icon]]:size-4',
			lg: 'h-(--size-control-lg) px-4 text-(length:--text-base) [&_[data-icon]]:size-4',
			icon: 'size-(--size-control-md) p-0 [&_[data-icon]]:size-4',
			'icon-sm': 'size-(--size-control-sm) p-0 [&_[data-icon]]:size-3.5',
		},
	},
	defaultVariants: {
		intent: 'primary',
		size: 'md',
	},
});

export type ButtonIntent = keyof typeof buttonVariants.variants.intent;
export type ButtonSize = keyof typeof buttonVariants.variants.size;

export const BUTTON_INTENTS = Object.keys(buttonVariants.variants.intent) as ButtonIntent[];

export const BUTTON_TEXT_SIZES = ['sm', 'md', 'lg'] as const satisfies ReadonlyArray<ButtonSize>;
export const BUTTON_ICON_SIZES = ['icon', 'icon-sm'] as const satisfies ReadonlyArray<ButtonSize>;
// Exhaustiveness is enforced here: adding a new size to tv() without updating
// BUTTON_TEXT_SIZES or BUTTON_ICON_SIZES causes a compile error on this line.
export const BUTTON_SIZES = asExhaustiveArray<ButtonSize>()([
	...BUTTON_TEXT_SIZES,
	...BUTTON_ICON_SIZES,
]);

export type ButtonProps = WithElementRef<HTMLButtonAttributes> &
	WithElementRef<HTMLAnchorAttributes> & {
		intent?: ButtonIntent;
		size?: ButtonSize;
	};
