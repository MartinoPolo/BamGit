<script lang="ts">
	import { Checkbox as CheckboxPrimitive } from 'bits-ui';
	import { cn } from '$lib/utils.js';
	import CheckIcon from '@lucide/svelte/icons/check';
	import MinusIcon from '@lucide/svelte/icons/minus';
	import type { CheckboxProps } from './checkbox-variants.js';

	let {
		ref = $bindable(null),
		checked = $bindable(false),
		indeterminate = $bindable(false),
		class: className,
		...restProps
	}: CheckboxProps = $props();
</script>

<CheckboxPrimitive.Root
	bind:ref
	data-slot="checkbox"
	class={cn(
		'flex size-4 shrink-0 cursor-pointer items-center justify-center rounded-sm border-[1.5px] border-border-strong bg-surface outline-none transition-[background,border-color] duration-120 ease-[ease] hover:border-ring focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-40 data-[state=checked]:border-primary data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground',
		className,
	)}
	bind:checked
	bind:indeterminate
	{...restProps}
>
	{#snippet children({ checked, indeterminate })}
		<div
			data-slot="checkbox-indicator"
			class="grid place-content-center text-current [&>svg]:size-3"
		>
			{#if indeterminate}
				<MinusIcon />
			{:else if checked}
				<CheckIcon />
			{/if}
		</div>
	{/snippet}
</CheckboxPrimitive.Root>
