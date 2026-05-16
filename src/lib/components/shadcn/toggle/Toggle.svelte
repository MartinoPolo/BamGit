<script lang="ts">
	import { Toggle as TogglePrimitive } from 'bits-ui';
	import { cn } from '$lib/utils.js';
	import { toggleVariants, type ToggleProps } from './toggle-variants.js';

	let {
		class: className,
		intent = 'default',
		size = 'md',
		ref = $bindable(null),
		children,
		...restProps
	}: ToggleProps = $props();
</script>

<TogglePrimitive.Root
	bind:ref
	class={cn(toggleVariants({ intent, size }), className)}
	{...restProps}
>
	{#snippet child({ props })}
		<button {...props} data-slot="toggle">
			{@render children?.()}
		</button>
	{/snippet}
</TogglePrimitive.Root>
