<script lang="ts">
	import { cn } from '$lib/utils.js';
	import { button_variants, type ButtonProps } from './button-variants.js';

	let {
		class: class_name,
		variant = 'default',
		size = 'default',
		ref = $bindable(null),
		href = undefined,
		type = 'button',
		disabled,
		children,
		...rest_props
	}: ButtonProps = $props();
</script>

{#if href}
	<!-- eslint-disable svelte/no-navigation-without-resolve -- generic component, href may be external -->
	<a
		bind:this={ref}
		data-slot="button"
		class={cn(button_variants({ variant, size }), class_name)}
		href={disabled === true ? undefined : href}
		aria-disabled={disabled === true ? true : undefined}
		role={disabled === true ? 'link' : undefined}
		tabindex={disabled === true ? -1 : undefined}
		{...rest_props}
	>
		{@render children?.()}
	</a>
	<!-- eslint-enable svelte/no-navigation-without-resolve -->
{:else}
	<button
		bind:this={ref}
		data-slot="button"
		class={cn(button_variants({ variant, size }), class_name)}
		{type}
		{disabled}
		{...rest_props}
	>
		{@render children?.()}
	</button>
{/if}
