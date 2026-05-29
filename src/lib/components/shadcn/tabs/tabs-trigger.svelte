<script lang="ts">
	import { Tabs as TabsPrimitive } from 'bits-ui';
	import { cn } from '$lib/utils.js';
	import { tabsTriggerVariants, type TabsTriggerProps } from './tabs-variants.js';

	let {
		ref = $bindable(null),
		class: className,
		children,
		...restProps
	}: TabsTriggerProps = $props();
</script>

<TabsPrimitive.Trigger
	bind:ref
	data-slot="tabs-trigger"
	class={cn(tabsTriggerVariants(), className)}
	{...restProps}
>
	{@render children?.()}
</TabsPrimitive.Trigger>
