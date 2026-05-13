<script lang="ts">
	import { cn, type WithoutChild } from '$lib/utils.js';
	import { Select as SelectPrimitive } from 'bits-ui';
	import CheckIcon from '@lucide/svelte/icons/check';

	let {
		ref = $bindable(null),
		class: className,
		value,
		label,
		children: childrenProp,
		...restProps
	}: WithoutChild<SelectPrimitive.ItemProps> = $props();
</script>

<SelectPrimitive.Item
	bind:ref
	{value}
	{label}
	data-slot="select-item"
	class={cn(
		'flex cursor-default select-none items-center gap-2 rounded-sm px-2 py-1.5 text-(length:--text-md) text-foreground outline-none transition-colors',
		'data-highlighted:bg-surface-2',
		'data-[selected=]:bg-primary-soft',
		'data-disabled:pointer-events-none data-disabled:opacity-50',
		className,
	)}
	{...restProps}
>
	{#snippet children({ selected, highlighted })}
		{#if selected}
			<CheckIcon class="size-2.75 shrink-0" />
		{:else}
			<span class="inline-block size-2.75 shrink-0"></span>
		{/if}
		{#if childrenProp}
			{@render childrenProp({ selected, highlighted })}
		{:else}
			{label ?? value}
		{/if}
	{/snippet}
</SelectPrimitive.Item>
