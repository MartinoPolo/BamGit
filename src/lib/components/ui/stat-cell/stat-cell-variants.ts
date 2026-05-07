import type { Component } from 'svelte';
import { type VariantProps, tv } from 'tailwind-variants';

export const STAT_CELL_TONE_OPTIONS = ['neutral', 'zero', 'warning', 'danger'] as const;

export const statCellVariants = tv({
	base: 'flex flex-col gap-1 rounded-[var(--radius-sm)] border px-2 py-[7px] min-w-0',
	variants: {
		tone: {
			neutral: 'bg-[color-mix(in_oklch,var(--surface-2)_60%,transparent)] border-border',
			zero: 'bg-[color-mix(in_oklch,var(--surface-2)_60%,transparent)] border-border',
			warning:
				'bg-[color-mix(in_oklch,var(--status-warning)_12%,transparent)] border-[color-mix(in_oklch,var(--status-warning)_35%,transparent)]',
			danger: 'bg-[color-mix(in_oklch,var(--status-danger)_14%,transparent)] border-[color-mix(in_oklch,var(--status-danger)_40%,transparent)]',
		},
	},
	defaultVariants: {
		tone: 'neutral',
	},
});

export type StatCellTone = VariantProps<typeof statCellVariants>['tone'];

export interface StatCellProps {
	label: string;
	value: number | string;
	tone?: StatCellTone;
	icon?: Component;
	pulse?: boolean;
	onclick?: () => void;
	class?: string;
}
