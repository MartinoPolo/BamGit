<script lang="ts">
	import CircleCheckIcon from '@lucide/svelte/icons/circle-check';
	import CircleXIcon from '@lucide/svelte/icons/circle-x';
	import ClockIcon from '@lucide/svelte/icons/clock';
	import SquareIcon from '@lucide/svelte/icons/square';
	import { cn } from '$lib/utils.js';
	import { Badge } from '$lib/components/shadcn/badge/index.js';
	import type { BadgeTone } from '$lib/components/shadcn/badge/index.js';
	import type {
		CommandResultBadgeProps,
		CommandResultState,
	} from './command_result_badge_types.js';

	let {
		state,
		commandName,
		isStale = false,
		badgeStyle = 'subtle',
		restartCount,
		maxRestarts,
	}: CommandResultBadgeProps = $props();

	const TONE_MAP: Record<CommandResultState, BadgeTone> = {
		running: 'info',
		passed: 'success',
		failed: 'danger',
		timeout: 'warning',
		stopped: 'neutral',
	};

	let tone = $derived(TONE_MAP[state]);
	let isCollapsed = $derived(state !== 'running');
</script>

<Badge
	{tone}
	{badgeStyle}
	format="mono"
	collapsed={isCollapsed}
	class={cn(isStale && 'opacity-40')}
	role="status"
	aria-label="{commandName}: {state}"
>
	{#snippet icon()}
		{#if state === 'running'}
			<span
				class="size-2.5 shrink-0 animate-spin rounded-full border-2 border-current border-t-transparent"
			></span>
		{:else if state === 'passed'}
			<CircleCheckIcon class="size-3 shrink-0" />
		{:else if state === 'failed'}
			<CircleXIcon class="size-3 shrink-0" />
		{:else if state === 'timeout'}
			<ClockIcon class="size-3 shrink-0" />
		{:else}
			<SquareIcon class="size-3 shrink-0" />
		{/if}
	{/snippet}
	{commandName}
	{#if restartCount !== undefined && restartCount > 0}
		<span class="text-[9px] opacity-70">↻{restartCount}/{maxRestarts ?? 3}</span>
	{/if}
</Badge>
