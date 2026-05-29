<script lang="ts">
	import { Tabs as TabsPrimitive } from 'bits-ui';
	import { cn } from '$lib/utils.js';
	import type { TabsContentProps } from './tabs-variants.js';

	let {
		ref = $bindable(null),
		class: className,
		children,
		...restProps
	}: TabsContentProps = $props();
</script>

<TabsPrimitive.Content bind:ref data-slot="tabs-content" class={cn(className)} {...restProps}>
	{@render children?.()}
</TabsPrimitive.Content>
