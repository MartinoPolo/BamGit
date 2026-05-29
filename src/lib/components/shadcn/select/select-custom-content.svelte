<script lang="ts">
	import { cn, type WithoutChild, type WithoutChildrenOrChild } from '$lib/utils.js';
	import { Select as SelectPrimitive } from 'bits-ui';
	import SelectCustomPortal from './select-custom-portal.svelte';
	import type { ComponentProps } from 'svelte';

	let {
		ref = $bindable(null),
		class: className,
		sideOffset = 4,
		portalProps,
		children,
		...restProps
	}: WithoutChild<SelectPrimitive.ContentProps> & {
		portalProps?: WithoutChildrenOrChild<ComponentProps<typeof SelectCustomPortal>>;
	} = $props();
</script>

<SelectCustomPortal {...portalProps}>
	<SelectPrimitive.Content
		bind:ref
		{sideOffset}
		data-slot="select-content"
		class={cn(
			'data-open:animate-in data-closed:animate-out data-closed:fade-out-0 data-open:fade-in-0 data-closed:zoom-out-95 data-open:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2',
			'z-(--z-dropdown) min-w-(--bits-select-anchor-width) overflow-hidden rounded-lg border border-border bg-surface p-1.5 shadow-lg outline-none duration-1 data-closed:overflow-hidden',
			className,
		)}
		{...restProps}
	>
		<SelectPrimitive.Viewport class="w-full scroll-my-1">
			{@render children?.()}
		</SelectPrimitive.Viewport>
	</SelectPrimitive.Content>
</SelectCustomPortal>
