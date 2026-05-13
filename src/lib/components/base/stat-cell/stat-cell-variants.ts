import type { Component } from 'svelte';
import { tv } from 'tailwind-variants';

export const statCellVariants = tv({
	base: 'flex flex-col gap-1 rounded-sm border px-2 py-1.75 min-w-0',
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

export type StatCellTone = keyof typeof statCellVariants.variants.tone;

export const STAT_CELL_TONES = Object.keys(statCellVariants.variants.tone) as StatCellTone[];

export interface StatCellProps {
	label: string;
	value: number | string;
	suffix?: string;
	tone?: StatCellTone;
	icon?: Component;
	pulse?: boolean;
	onclick?: () => void;
	class?: string;
}
