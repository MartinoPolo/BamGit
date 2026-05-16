import type { ButtonSize } from '$lib/components/shadcn/button/index.js';

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
}
