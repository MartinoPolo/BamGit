<script lang="ts">
	import { cn } from '$lib/utils.js';
	import type { StatusRowProps } from './status-row-variants.js';

	let {
		active,
		label,
		meta,
		onclick,
		activeColor = 'var(--moss-400)',
		class: className,
	}: StatusRowProps = $props();
</script>

<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
<div
	class={cn(
		'flex items-center gap-2 rounded-sm border px-2.5 py-2 select-none',
		onclick && 'cursor-pointer',
		className,
	)}
	style:background={active
		? `color-mix(in oklch, ${activeColor} 10%, var(--surface-2))`
		: 'var(--surface-2)'}
	style:border-color={active
		? `color-mix(in oklch, ${activeColor} 32%, var(--border))`
		: 'var(--border)'}
	role={onclick ? 'button' : undefined}
	tabindex={onclick ? 0 : undefined}
	onclick={onclick
		? (event: MouseEvent) => {
				event.stopPropagation();
				onclick();
			}
		: undefined}
	onkeydown={onclick
		? (event: KeyboardEvent) => {
				if (event.key === 'Enter' || event.key === ' ') {
					event.preventDefault();
					event.stopPropagation();
					onclick();
				}
			}
		: undefined}
>
	<span
		class="size-2 shrink-0 rounded-full"
		style:background={active ? activeColor : 'var(--foreground-subtle)'}
		style:box-shadow={active
			? `0 0 8px color-mix(in oklch, ${activeColor} 70%, transparent)`
			: 'none'}
		class:animate-ws-led={active}
	></span>
	<span
		class={cn(
			'text-xs tracking-[-0.005em]',
			active ? 'font-medium text-foreground' : 'text-foreground-muted',
		)}
	>
		{label}
	</span>
	{#if meta}
		<span class="ml-auto font-mono text-[10.5px] tabular-nums text-foreground-subtle">
			{meta}
		</span>
	{/if}
</div>
