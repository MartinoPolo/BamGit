<script lang="ts">
	import { ToggleGroup as ToggleGroupPrimitive } from 'bits-ui';
	import { cn } from '$lib/utils.js';
	import { getContext } from 'svelte';
	import { toggleVariants } from '../toggle/toggle-variants.js';
	import type { ToggleIntent, ToggleSize } from '../toggle/toggle-variants.js';
	import type { ToggleGroupItemProps } from './toggle-group-variants.js';

	let {
		class: className,
		intent,
		size,
		children,
		ref = $bindable(null),
		...restProps
	}: ToggleGroupItemProps = $props();

	const groupContext = getContext<{ intent: ToggleIntent; size: ToggleSize }>('toggle-group');

	const resolvedIntent = $derived(intent ?? groupContext.intent);
	const resolvedSize = $derived(size ?? groupContext.size);
</script>

<ToggleGroupPrimitive.Item
	bind:ref
	class={cn(toggleVariants({ intent: resolvedIntent, size: resolvedSize }), className)}
	{...restProps}
>
	{#snippet child({ props })}
		<button {...props} data-slot="toggle-group-item">
			{@render children?.()}
		</button>
	{/snippet}
</ToggleGroupPrimitive.Item>
