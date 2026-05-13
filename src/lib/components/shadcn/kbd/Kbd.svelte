<script lang="ts">
	import { cn } from '$lib/utils.js';
	import { kbdVariants, type KbdProps } from './kbd-variants.js';

	let {
		class: className,
		variant = 'default',
		tone = 'neutral',
		ref = $bindable(null),
		children,
		...restProps
	}: KbdProps = $props();
</script>

<kbd
	bind:this={ref}
	data-slot="kbd"
	class={cn(kbdVariants({ variant, tone }), className)}
	{...restProps}
>
	{@render children?.()}
</kbd>
