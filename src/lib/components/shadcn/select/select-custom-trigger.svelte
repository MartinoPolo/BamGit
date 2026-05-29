<script lang="ts">
	import { cn, type WithoutChild } from '$lib/utils.js';
	import { Select as SelectPrimitive } from 'bits-ui';
	import ChevronDownIcon from '@lucide/svelte/icons/chevron-down';
	import type { SelectState } from './select-variants.js';

	let {
		ref = $bindable(null),
		class: className,
		state = 'default' as SelectState,
		children,
		...restProps
	}: WithoutChild<SelectPrimitive.TriggerProps> & {
		state?: SelectState;
	} = $props();
</script>

<SelectPrimitive.Trigger
	bind:ref
	data-slot="select-trigger"
	class={cn(
		'flex h-(--size-control-md) w-full cursor-pointer items-center justify-between rounded-md border border-border bg-surface px-2.5 font-sans text-(length:--text-md) text-foreground outline-none transition-[border-color,box-shadow] duration-2',
		'hover:border-border-strong',
		'aria-expanded:border-ring aria-expanded:shadow-[0_0_0_3px_color-mix(in_oklch,var(--ring)_22%,transparent)]',
		'disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-surface-2 disabled:text-foreground-subtle disabled:opacity-70',
		state === 'error' &&
			'border-status-danger shadow-[0_0_0_3px_color-mix(in_oklch,var(--status-danger)_18%,transparent)]',
		className,
	)}
	{...restProps}
>
	{@render children?.()}
	<ChevronDownIcon class="size-3.5 shrink-0 text-foreground-subtle" />
</SelectPrimitive.Trigger>
