import type { Snippet } from 'svelte';
import type { WithElementRef } from '$lib/utils.js';
import type { HTMLAttributes } from 'svelte/elements';
import { tv } from 'tailwind-variants';

export const kbdVariants = tv({
	base: 'inline-flex items-center justify-center min-w-[18px] h-[18px] px-[5px] bg-surface-2 border border-border rounded-[4px] font-mono text-[10.5px] text-foreground-muted',
});

export type KbdProps = WithElementRef<HTMLAttributes<HTMLElement>, HTMLElement> & {
	children?: Snippet;
};
