<script lang="ts">
	import { cn } from '$lib/utils.js';
	import { helpTextVariants, type HelpTextProps } from './help-text-variants.js';

	let {
		ref = $bindable(null),
		status = 'default',
		class: className,
		children,
		...restProps
	}: HelpTextProps = $props();
</script>

<p
	bind:this={ref}
	data-slot="help-text"
	data-status={status}
	class={cn(helpTextVariants({ status }), className)}
	{...restProps}
>
	{@render children?.()}
</p>
