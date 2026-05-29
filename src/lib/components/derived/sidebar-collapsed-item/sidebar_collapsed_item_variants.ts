import { tv } from 'tailwind-variants';

export const sidebarCollapsedItemVariants = tv({
	base: 'flex size-(--size-control-md) items-center justify-center rounded-md text-(--sidebar-fg) cursor-pointer transition-[background,color] duration-2 relative outline-none focus-visible:outline-2 focus-visible:outline-solid focus-visible:outline-offset-2 focus-visible:outline-ring disabled:opacity-40 disabled:pointer-events-none',
	variants: {
		active: {
			true: 'bg-primary-soft text-primary',
			false: 'hover:bg-surface-hover',
		},
	},
	defaultVariants: { active: false },
});
