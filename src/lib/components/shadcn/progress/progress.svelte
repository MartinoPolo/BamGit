<script lang="ts">
	import { Progress as ProgressPrimitive } from 'bits-ui';
	import { cn, type WithoutChildrenOrChild } from '$lib/utils.js';

	let {
		ref = $bindable(null),
		class: className,
		min = 0,
		max = 100,
		value,
		...restProps
	}: WithoutChildrenOrChild<ProgressPrimitive.RootProps> = $props();

	const isIndeterminate = $derived(value === null || value === undefined);

	const fillPercent = $derived(
		isIndeterminate ? 0 : (100 * ((value ?? min) - min)) / ((max ?? 100) - min),
	);
</script>

<ProgressPrimitive.Root
	bind:ref
	data-slot="progress"
	class={cn(
		'bg-primary/20 h-1.5 rounded-full relative flex w-full items-center overflow-hidden',
		className,
	)}
	{value}
	{min}
	{max}
	{...restProps}
>
	<div
		data-slot="progress-indicator"
		class={cn(
			'bg-primary size-full flex-1',
			isIndeterminate
				? 'animate-[indeterminate-progress_1.6s_ease-in-out_infinite] w-1/3 flex-none'
				: 'transition-all duration-5',
		)}
		style={isIndeterminate ? '' : `transform: translateX(-${100 - fillPercent}%)`}
	></div>
</ProgressPrimitive.Root>

<style>
	@keyframes -global-indeterminate-progress {
		0% {
			transform: translateX(-100%);
		}

		60% {
			transform: translateX(400%);
		}

		100% {
			transform: translateX(400%);
		}
	}
</style>
