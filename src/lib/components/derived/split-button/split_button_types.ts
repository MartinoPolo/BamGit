import type { ComponentProps } from 'svelte';
import type { ButtonSize } from '$lib/components/shadcn/button/index.js';
import type { WithoutChildrenOrChild } from '$lib/utils.js';
import type DropdownMenuPortal from '$lib/components/shadcn/dropdown-menu/dropdown-menu-portal.svelte';

/** @public */
export interface SplitButtonOption {
	readonly value: string;
	readonly label: string;
}

/** @public */
export interface SplitButtonProps {
	options: readonly SplitButtonOption[];
	defaultValue: string;
	settingsKey?: string;
	size?: ButtonSize;
	disabled?: boolean;
	onselect: (value: string) => void;
	portalProps?: WithoutChildrenOrChild<ComponentProps<typeof DropdownMenuPortal>>;
}
