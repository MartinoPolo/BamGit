<script lang="ts">
	import { onMount } from 'svelte';
	import RefreshCwIcon from '@lucide/svelte/icons/refresh-cw';
	import { Button } from '$lib/components/shadcn/button/index.js';
	import { WithTooltip } from '$lib/components/shadcn/tooltip/index.js';
	import { cn } from '$lib/utils.js';
	import { REFRESH_STATES, type RefreshState } from '$lib/modules/usage/usage_types.js';

	interface Props {
		refreshState: RefreshState;
		lastUpdatedAt: number | null;
		onrefresh: () => void;
	}

	let { refreshState, lastUpdatedAt, onrefresh }: Props = $props();

	let now = $state(Date.now());

	function formatRelativeTime(timestamp: number): string {
		const diffMs = now - timestamp;
		if (diffMs < 60_000) {
			return 'just now';
		}
		if (diffMs < 3_600_000) {
			return `${Math.floor(diffMs / 60_000)}m ago`;
		}
		return `${Math.floor(diffMs / 3_600_000)}h ago`;
	}

	const tooltipText = $derived.by(() => {
		if (refreshState === REFRESH_STATES.fresh) {
			return 'Updated just now';
		}
		if (refreshState === REFRESH_STATES.stale && lastUpdatedAt !== null) {
			return `Updated ${formatRelativeTime(lastUpdatedAt)}`;
		}
		return '';
	});

	const isLoading = $derived(refreshState === REFRESH_STATES.loading);
	const showBadge = $derived(refreshState === REFRESH_STATES.newDataAvailable);
	const isMuted = $derived(refreshState === REFRESH_STATES.stale);
	const hasTooltip = $derived(
		refreshState === REFRESH_STATES.fresh || refreshState === REFRESH_STATES.stale,
	);

	let intervalId: ReturnType<typeof setInterval> | undefined;

	onMount(() => {
		intervalId = setInterval(() => {
			now = Date.now();
		}, 30_000);

		return () => {
			if (intervalId !== undefined) {
				clearInterval(intervalId);
			}
		};
	});
</script>

{#if hasTooltip}
	<WithTooltip text={tooltipText} side="bottom">
		<Button
			variant="secondary"
			size="sm"
			disabled={isLoading}
			onclick={onrefresh}
			class="relative"
		>
			<RefreshCwIcon
				class={cn(
					'size-3.5',
					isLoading && 'animate-spin',
					isMuted && 'text-muted-foreground',
				)}
			/>
			{#if showBadge}
				<span
					class="absolute right-1 top-1 size-1.5 rounded-full bg-primary"
					aria-hidden="true"
				></span>
			{/if}
		</Button>
	</WithTooltip>
{:else}
	<Button variant="secondary" size="sm" disabled={isLoading} onclick={onrefresh} class="relative">
		<RefreshCwIcon
			class={cn('size-3.5', isLoading && 'animate-spin', isMuted && 'text-muted-foreground')}
		/>
		{#if showBadge}
			<span class="absolute right-1 top-1 size-1.5 rounded-full bg-primary" aria-hidden="true"
			></span>
		{/if}
	</Button>
{/if}
