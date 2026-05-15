<script lang="ts">
	import { cn } from '$lib/utils.js';
	import { badgeVariants, type BadgeProps } from './badge-variants.js';

	let {
		class: className,
		tone = 'neutral',
		badgeStyle = 'bordered-dark',
		format = 'default',
		size = 'default',
		dot,
		icon,
		ref = $bindable(null),
		children,
		...restProps
	}: BadgeProps = $props();
</script>

<span
	bind:this={ref}
	data-slot="badge"
	class={cn(badgeVariants({ tone, badgeStyle, format, size }), className)}
	{...restProps}
>
	{#if icon}
		{@render icon()}
	{/if}
	{#if dot}
		<span
			class={cn(
				'size-1.5 shrink-0 rounded-full bg-current',
				dot === 'pulsing' && 'animate-[badge-pulse_2s_ease-in-out_infinite]',
			)}
		></span>
	{/if}
	{@render children?.()}
</span>
