<script lang="ts">
	import { cn } from '$lib/utils.js';
	import { inputVariants } from '$lib/components/ui/input/input-variants.js';
	import SearchIcon from '@lucide/svelte/icons/search';
	import type { SearchFieldProps } from './search-field-variants.js';

	let {
		ref = $bindable(null),
		value = $bindable(),
		children,
		class: className,
		...restProps
	}: SearchFieldProps = $props();
</script>

<div class="relative" data-slot="search-field">
	<SearchIcon
		class="pointer-events-none absolute left-2.5 top-[9px] size-[13px] text-foreground-subtle"
	/>
	<input
		bind:this={ref}
		bind:value
		data-slot="search-field-input"
		class={cn(inputVariants(), 'pl-[30px]', className)}
		type="search"
		{...restProps}
	/>
	{#if children}
		{@render children()}
	{/if}
</div>
