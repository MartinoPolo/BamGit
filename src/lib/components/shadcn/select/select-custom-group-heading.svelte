<script lang="ts">
	import { cn } from '$lib/utils.js';
	import { Select as SelectPrimitive } from 'bits-ui';
	import type { ComponentProps } from 'svelte';

	let {
		ref = $bindable(null),
		class: className,
		...restProps
	}: ComponentProps<typeof SelectPrimitive.GroupHeading> = $props();
</script>

<SelectPrimitive.GroupHeading
	bind:ref
	data-slot="select-group-heading"
	class={cn(
		'px-2 py-1 text-(length:--text-xs) font-medium uppercase tracking-wider text-foreground-subtle',
		className,
	)}
	{...restProps}
/>
