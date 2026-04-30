<script lang="ts">
	import { cn } from '$lib/utils.js';
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';

	let {
		ref = $bindable<HTMLDivElement | null>(null),
		class: className,
		children,
		...restProps
	}: {
		ref?: HTMLDivElement | null;
		class?: string;
		children?: Snippet;
	} & HTMLAttributes<HTMLDivElement> = $props();
</script>

<div
	bind:this={ref}
	data-slot="dialog-header"
	class={cn('flex items-start justify-between gap-4 border-b border-border px-5 py-4', className)}
	{...restProps}
>
	{@render children?.()}
</div>
