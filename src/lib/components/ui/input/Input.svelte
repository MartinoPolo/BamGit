<script lang="ts">
	import { cn } from '$lib/utils.js';
	import { inputVariants, type InputProps } from './input-variants.js';

	let {
		ref = $bindable(null),
		value = $bindable(),
		state = 'default',
		class: className,
		...restProps
	}: InputProps = $props();
</script>

<input
	bind:this={ref}
	bind:value
	data-slot="input"
	data-state={state}
	aria-invalid={state === 'error' ? true : undefined}
	class={cn(inputVariants({ state }), className)}
	{...restProps}
/>
