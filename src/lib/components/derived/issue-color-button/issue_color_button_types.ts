import type { Snippet } from 'svelte';
import type { ButtonProps } from '$lib/components/shadcn/button/index.js';

/** @public */
export type IssueColorButtonProps = Omit<ButtonProps, 'intent' | 'children'> & {
	color?: string | null;
	children?: Snippet;
};
