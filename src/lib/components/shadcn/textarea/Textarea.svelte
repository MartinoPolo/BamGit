<script lang="ts">
	import { cn } from '$lib/utils.js';
	import { textareaVariants, type TextareaProps } from './textarea-variants.js';

	let {
		ref = $bindable(null),
		value = $bindable(),
		state = 'default',
		class: className,
		...restProps
	}: TextareaProps = $props();
</script>

<textarea
	bind:this={ref}
	bind:value
	data-slot="textarea"
	data-state={state}
	aria-invalid={state === 'error' ? true : undefined}
	class={cn(textareaVariants({ state }), className)}
	{...restProps}
></textarea>
