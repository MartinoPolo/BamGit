<script lang="ts">
	import type { Snippet } from 'svelte';
	import TooltipProvider from './tooltip-provider.svelte';
	import TooltipRoot from './tooltip.svelte';
	import TooltipTrigger from './tooltip-trigger.svelte';
	import TooltipContent from './tooltip-content.svelte';

	interface Props {
		text: string;
		side?: 'top' | 'bottom' | 'left' | 'right';
		children: Snippet;
	}

	let { text, side = 'top', children }: Props = $props();
</script>

<TooltipProvider>
	<TooltipRoot>
		<TooltipTrigger>
			{#snippet child({ props })}
				<span {...props} style="display: contents;">
					{@render children()}
				</span>
			{/snippet}
		</TooltipTrigger>
		<TooltipContent {side} sideOffset={6}>
			{text}
		</TooltipContent>
	</TooltipRoot>
</TooltipProvider>
