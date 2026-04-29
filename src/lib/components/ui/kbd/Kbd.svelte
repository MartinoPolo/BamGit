<script lang="ts">
	import { cn } from '$lib/utils.js';
	import { kbdVariants, type KbdProps } from './kbd-variants.js';

	let { class: className, ref = $bindable(null), children, ...restProps }: KbdProps = $props();
</script>

<kbd bind:this={ref} data-slot="kbd" class={cn(kbdVariants(), className)} {...restProps}>
	{@render children?.()}
</kbd>
