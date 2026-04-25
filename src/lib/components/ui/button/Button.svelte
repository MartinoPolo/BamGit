<script lang="ts">
	import { cn } from '$lib/utils.js';
	import { buttonVariants, type ButtonProps } from './button-variants.js';

	let {
		class: className,
		variant = 'default',
		size = 'default',
		ref = $bindable(null),
		href = undefined,
		type = 'button',
		disabled,
		children,
		...restProps
	}: ButtonProps = $props();
</script>

{#if href}
	<!-- eslint-disable svelte/no-navigation-without-resolve -- generic component, href may be external -->
	<a
		bind:this={ref}
		data-slot="button"
		class={cn(buttonVariants({ variant, size }), className)}
		href={disabled === true ? undefined : href}
		aria-disabled={disabled === true ? true : undefined}
		role={disabled === true ? 'link' : undefined}
		tabindex={disabled === true ? -1 : undefined}
		{...restProps}
	>
		{@render children?.()}
	</a>
	<!-- eslint-enable svelte/no-navigation-without-resolve -->
{:else}
	<button
		bind:this={ref}
		data-slot="button"
		class={cn(buttonVariants({ variant, size }), className)}
		{type}
		{disabled}
		{...restProps}
	>
		{@render children?.()}
	</button>
{/if}
