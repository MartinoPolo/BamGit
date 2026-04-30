<script lang="ts">
	import { Dialog as DialogPrimitive } from 'bits-ui';
	import type { Snippet } from 'svelte';
	import { cn } from '$lib/utils.js';
	import DialogOverlay from './dialog-overlay.svelte';

	let {
		ref = $bindable(null),
		class: className,
		children,
		portalProps,
		...restProps
	}: DialogPrimitive.ContentProps & {
		children?: Snippet;
		portalProps?: Omit<DialogPrimitive.PortalProps, 'children'>;
	} = $props();
</script>

<DialogPrimitive.Portal {...portalProps}>
	<DialogOverlay />
	<DialogPrimitive.Content
		bind:ref
		data-slot="dialog-content"
		class={cn(
			'data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
			'fixed left-1/2 top-1/2 z-50 w-[90%] max-w-[480px] -translate-x-1/2 -translate-y-1/2 rounded-xl border border-border bg-surface shadow-xl outline-none',
			className,
		)}
		{...restProps}
	>
		{@render children?.()}
	</DialogPrimitive.Content>
</DialogPrimitive.Portal>
