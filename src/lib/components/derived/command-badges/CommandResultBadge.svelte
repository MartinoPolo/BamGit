<script lang="ts">
	import CircleCheckIcon from '@lucide/svelte/icons/circle-check';
	import CircleXIcon from '@lucide/svelte/icons/circle-x';
	import { cn } from '$lib/utils.js';
	import { resolveBadgeStyleClasses } from '$lib/components/shadcn/badge/badge_style_utils.js';
	import type { CommandResultBadgeProps } from './command_result_badge_types.js';

	let {
		state,
		commandName,
		isStale = false,
		badgeStyle = 'borderless-dark',
	}: CommandResultBadgeProps = $props();

	let isCollapsed = $derived(state !== 'running');

	let cmdColorValue = $derived.by(() => {
		if (state === 'passed') {
			return 'var(--status-success)';
		}
		if (state === 'failed') {
			return 'var(--status-danger)';
		}
		return 'var(--status-info)';
	});

	let badgeClasses = $derived.by(() => {
		const base =
			'inline-flex items-center gap-1.5 font-mono text-[10px] leading-none overflow-hidden transition-all duration-300 ease-in-out';

		const sizing = isCollapsed
			? 'size-5 p-0 justify-center rounded-full'
			: 'h-5 px-1.5 py-1 rounded-full';
		const staleClass = isStale ? 'opacity-40' : '';

		return cn(base, sizing, staleClass, resolveBadgeStyleClasses('--cmd-color', badgeStyle));
	});
</script>

<span
	class={badgeClasses}
	style:--cmd-color={cmdColorValue}
	role="status"
	aria-label="{commandName}: {state}"
>
	{#if state === 'running'}
		<span
			class="size-2.5 shrink-0 animate-spin rounded-full border-2 border-current border-t-transparent"
		></span>
		<span class="truncate">{commandName}</span>
	{:else if state === 'passed'}
		<CircleCheckIcon class="size-3 shrink-0" />
	{:else}
		<CircleXIcon class="size-3 shrink-0" />
	{/if}
</span>
