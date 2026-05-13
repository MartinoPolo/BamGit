<script lang="ts">
	import { cn } from '$lib/utils.js';
	import type { HTMLAttributes } from 'svelte/elements';

	let { class: className, ...restProps }: HTMLAttributes<HTMLDivElement> = $props();
</script>

<div
	data-slot="select-separator"
	role="separator"
	class={cn('-mx-1.5 my-1 h-px bg-border', className)}
	{...restProps}
></div>
