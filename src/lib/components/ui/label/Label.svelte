<script lang="ts">
	import { Label as LabelPrimitive } from 'bits-ui';
	import { cn } from '$lib/utils.js';
	import type { LabelProps } from './label-variants.js';

	let { ref = $bindable(null), class: className, ...restProps }: LabelProps = $props();
</script>

<LabelPrimitive.Root
	bind:ref
	data-slot="label"
	class={cn(
		'mb-1.5 block text-(length:--text-sm) font-medium leading-none tracking-[0.01em] text-foreground-muted select-none group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:opacity-50 peer-disabled:cursor-not-allowed peer-disabled:opacity-50',
		className,
	)}
	{...restProps}
/>
