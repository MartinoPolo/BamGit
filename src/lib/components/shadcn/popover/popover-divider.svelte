<script lang="ts">
	import { Separator } from '$lib/components/shadcn/separator/index.js';
	import { cn } from '$lib/utils.js';
	import type { Separator as SeparatorPrimitive } from 'bits-ui';

	let {
		ref = $bindable(null),
		class: className,
		...restProps
	}: SeparatorPrimitive.RootProps = $props();
</script>

<Separator bind:ref data-slot="popover-divider" class={cn('my-1', className)} {...restProps} />
