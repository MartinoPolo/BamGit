import type { WithElementRef } from '$lib/utils.js';
import type { HTMLSelectAttributes } from 'svelte/elements';
import { tv } from 'tailwind-variants';

export type SelectState = 'default' | 'error';

export const selectVariants = tv({
	base: 'h-(--size-control-md) w-full cursor-pointer appearance-none rounded-md border border-border bg-surface px-2.5 pr-8 font-sans text-(length:--text-md) text-foreground outline-none transition-[border-color,box-shadow] duration-120 ease-[ease] bg-[url("data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2212%22%20height%3D%2212%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%23999%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpath%20d%3D%22m6%209%206%206%206-6%22%2F%3E%3C%2Fsvg%3E")] bg-[length:14px] bg-[position:right_8px_center] bg-no-repeat hover:border-border-strong disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-surface-2 disabled:text-foreground-subtle disabled:opacity-70 focus-visible:border-ring focus-visible:shadow-[0_0_0_3px_color-mix(in_oklch,var(--ring)_22%,transparent)]',
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

export type SelectProps = WithElementRef<HTMLSelectAttributes> & {
	state?: SelectState;
};
