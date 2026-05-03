import { tv } from 'tailwind-variants';

export const sidebarCollapsedItemVariants = tv({
	base: 'flex size-[var(--size-control-md)] items-center justify-center rounded-[var(--radius-md)] text-[var(--sidebar-fg)] cursor-pointer transition-[background,color] duration-[120ms] relative outline-none focus-visible:outline-2 focus-visible:outline-solid focus-visible:outline-offset-2 focus-visible:outline-ring disabled:opacity-40 disabled:pointer-events-none',
	variants: {
		active: {
			true: 'bg-primary-soft text-primary',
			false: 'hover:bg-surface-hover',
		},
	},
	defaultVariants: { active: false },
});
