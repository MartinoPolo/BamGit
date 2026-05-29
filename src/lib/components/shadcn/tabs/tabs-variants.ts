import { tv } from 'tailwind-variants';
import type { Tabs as TabsPrimitive } from 'bits-ui';
import type { WithoutChild } from '$lib/utils.js';

export const tabsListVariants = tv({
	base: 'inline-flex bg-surface-2 border border-border p-0.75 rounded-md gap-0.5',
});

export const tabsTriggerVariants = tv({
	base: 'inline-flex items-center gap-1.5 px-3 py-1.25 text-xs font-medium rounded-sm text-foreground-muted cursor-pointer transition-all duration-2 ease-[ease] border-none bg-transparent hover:text-foreground hover:bg-[color-mix(in_oklch,var(--foreground)_4%,transparent)] focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-2 disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.97] active:bg-[color-mix(in_oklch,var(--foreground)_8%,transparent)] data-[state=active]:bg-surface data-[state=active]:text-foreground data-[state=active]:shadow-sm data-[state=active]:hover:bg-surface-hover',
});

export type TabsListProps = WithoutChild<TabsPrimitive.ListProps>;

export type TabsTriggerProps = WithoutChild<TabsPrimitive.TriggerProps>;

export type TabsContentProps = WithoutChild<TabsPrimitive.ContentProps>;
