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
		accentBarColor != null && 'border-l-[3px]',
		gradientTint != null && 'gk-card-gradient-tint',
		className,
	)}
	style:border-left-color={accentBarColor}
	style:--gk-card-tint-color={gradientTint}
	{...restProps}
>
	{@render children?.()}
	{#if state === 'loading'}
		<div class="gk-card-shimmer"></div>
	{/if}
</div>
