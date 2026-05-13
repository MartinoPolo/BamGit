<script lang="ts">
	import { cn } from '$lib/utils.js';
	import { alertVariants, type AlertProps } from './alert-variants.js';

	let {
		ref = $bindable(null),
		class: className,
		variant = 'default',
		children,
		...restProps
	}: AlertProps = $props();
</script>

<div
	bind:this={ref}
	data-slot="alert"
	role="alert"
	class={cn(alertVariants({ variant }), className)}
	{...restProps}
>
	{@render children?.()}
</div>
