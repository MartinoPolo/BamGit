<script lang="ts">
	import { cn } from '$lib/utils.js';
	import { selectVariants, type SelectProps } from './select-variants.js';

	let {
		ref = $bindable(null),
		value = $bindable(),
		state = 'default',
		class: className,
		children,
		...restProps
	}: SelectProps = $props();
</script>

<select
	bind:this={ref}
	bind:value
	data-slot="select"
	data-state={state}
	aria-invalid={state === 'error' ? true : undefined}
	class={cn(selectVariants({ state }), className)}
	{...restProps}
>
	{@render children?.()}
</select>
