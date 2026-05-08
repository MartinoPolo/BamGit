<script lang="ts">
	import { cn } from '$lib/utils.js';
	import { cardVariants, CARD_STATE_CLASSES, type CardProps } from './card-variants.js';

	let {
		class: className,
		padding = 'none',
		state,
		accentBarColor,
		gradientTint,
		ref = $bindable(null),
		children,
		...restProps
	}: CardProps = $props();

	const stateClass = $derived(
		state && state !== 'default' ? CARD_STATE_CLASSES[state] : undefined,
	);
	const dataState = $derived(state && state !== 'default' ? state : undefined);
</script>

<div
	bind:this={ref}
	data-slot="card"
	data-state={dataState}
	class={cn(
		cardVariants({ padding }),
		stateClass,
		accentBarColor != null && 'overflow-hidden',
		gradientTint != null && 'gk-card-gradient-tint',
		className,
	)}
	style:--gk-card-tint-color={gradientTint}
	{...restProps}
>
	{#if accentBarColor != null}
		<div
			class="absolute inset-y-0 left-0 z-[2] w-[3px]"
			style:background={accentBarColor}
		></div>
	{/if}
	{@render children?.()}
	{#if state === 'loading'}
		<div class="gk-card-shimmer"></div>
	{/if}
</div>
