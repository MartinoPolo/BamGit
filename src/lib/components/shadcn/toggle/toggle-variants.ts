import type { Toggle as TogglePrimitive } from 'bits-ui';
import type { WithoutChildrenOrChild } from '$lib/utils.js';
import type { Snippet } from 'svelte';
import { tv } from 'tailwind-variants';

export const toggleVariants = tv({
	base: 'inline-flex shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-md border border-transparent font-medium leading-none outline-none select-none transition-[background,border-color,color,transform,filter,box-shadow] duration-120 ease-[ease] active:scale-[0.96] focus-visible:outline-2 focus-visible:outline-solid focus-visible:outline-offset-2 focus-visible:outline-ring disabled:pointer-events-none disabled:opacity-45 [&_[data-icon]]:pointer-events-none [&_[data-icon]]:shrink-0',
	variants: {
		intent: {
			default:
				'bg-transparent text-foreground-muted hover:bg-surface-2 hover:text-foreground data-[state=on]:bg-surface-2 data-[state=on]:text-foreground',
			outline:
				'border-border bg-surface-2 text-foreground hover:bg-surface-3 hover:border-border-strong data-[state=on]:bg-primary data-[state=on]:text-primary-foreground data-[state=on]:border-transparent',
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
		intent: 'default',
		size: 'md',
	},
});

export type ToggleIntent = keyof typeof toggleVariants.variants.intent;
export type ToggleSize = keyof typeof toggleVariants.variants.size;

export const TOGGLE_INTENTS = Object.keys(toggleVariants.variants.intent) as ToggleIntent[];
export const TOGGLE_SIZES = Object.keys(toggleVariants.variants.size) as ToggleSize[];

export type ToggleProps = WithoutChildrenOrChild<TogglePrimitive.RootProps> & {
	intent?: ToggleIntent;
	size?: ToggleSize;
	children?: Snippet;
};
