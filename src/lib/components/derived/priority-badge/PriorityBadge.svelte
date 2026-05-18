<script lang="ts">
	import { cn } from '$lib/utils.js';
	import { resolveBadgeStyleClass } from '$lib/components/shadcn/badge/badge_style_utils.js';
	import {
		PRIORITY_LABELS,
		PRIORITY_COLOR_VARIABLES,
		type PriorityBadgeProps,
	} from './priority_badge_types.js';

	let {
		priority,
		position = 'header-right',
		badgeStyle = 'borderless-dark',
		onclick,
	}: PriorityBadgeProps = $props();

	let label = $derived(PRIORITY_LABELS[priority]);
	let priorityColorValue = $derived(`var(${PRIORITY_COLOR_VARIABLES[priority]})`);

	let badgeClasses = $derived.by(() => {
		const base =
			'inline-flex items-center font-mono text-[10px] uppercase tracking-wider leading-none px-1.5 py-1 rounded-sm select-none';
		const interactive = onclick
			? 'cursor-pointer hover:brightness-85 dark:hover:brightness-125'
			: '';

		return cn(base, interactive, resolveBadgeStyleClass(badgeStyle));
	});
</script>

<button
	type="button"
	class={badgeClasses}
	style:--badge-color={priorityColorValue}
	data-position={position}
	disabled={!onclick}
	{onclick}
	aria-label="{label} priority"
>
	{label}
</button>
