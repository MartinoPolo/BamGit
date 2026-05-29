<script lang="ts">
	import { Tabs as TabsPrimitive } from 'bits-ui';
	import { cn } from '$lib/utils.js';
	import { tabsListVariants, type TabsListProps } from './tabs-variants.js';

	let {
		ref = $bindable(null),
		class: className,
		children,
		...restProps
	}: TabsListProps = $props();
</script>

<TabsPrimitive.List
	bind:ref
	data-slot="tabs-list"
	class={cn(tabsListVariants(), className)}
	{...restProps}
>
	{@render children?.()}
</TabsPrimitive.List>
