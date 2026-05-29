<script lang="ts">
	import { Switch as SwitchPrimitive } from 'bits-ui';
	import { cn } from '$lib/utils.js';
	import type { SwitchProps } from './switch-variants.js';

	let {
		ref = $bindable(null),
		class: className,
		checked = $bindable(false),
		...restProps
	}: SwitchProps = $props();
</script>

<SwitchPrimitive.Root
	bind:ref
	bind:checked
	data-slot="switch"
	class={cn(
		'peer relative inline-flex h-4.5 w-8 shrink-0 cursor-pointer items-center rounded-full border border-border bg-surface-3 px-px outline-none transition-[background,border-color] duration-2 ease-[ease] hover:border-border-strong focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 data-[state=checked]:border-primary data-[state=checked]:bg-primary data-disabled:cursor-not-allowed data-disabled:opacity-40',
		className,
	)}
	{...restProps}
>
	<SwitchPrimitive.Thumb
		data-slot="switch-thumb"
		class="pointer-events-none block size-3.5 rounded-full bg-surface shadow-sm transition-transform duration-3 data-[state=checked]:translate-x-3.5 data-[state=unchecked]:translate-x-0"
	/>
</SwitchPrimitive.Root>
