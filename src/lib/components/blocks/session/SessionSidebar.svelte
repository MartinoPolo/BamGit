<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { Session } from '$lib/types/generated/Session.js';
	import PanelLeftIcon from '@lucide/svelte/icons/panel-left';
	import CpuIcon from '@lucide/svelte/icons/cpu';
	import { Button } from '$lib/components/shadcn/button/index.js';
	import { Badge } from '$lib/components/shadcn/badge/index.js';
	import ProgressBar from './ProgressBar.svelte';
	import ProviderChip from './ProviderChip.svelte';
	import { getContextColor, getQuotaColor, getStatePulseColor } from './session_theme_utils.js';

	interface Props {
		session: Session;
		contextPercent?: number;
		quota5hPercent?: number;
		quota7dPercent?: number;
		subAgentCount?: number;
		subAgentTree?: Snippet;
	}

	let {
		session,
		contextPercent = 0,
		quota5hPercent = 0,
		quota7dPercent = 0,
		subAgentCount = 0,
		subAgentTree,
	}: Props = $props();

	let collapsed = $state(false);

	const costDisplay = $derived(
		session.cost_usd !== null ? `$${session.cost_usd.toFixed(3)}` : '$0.000',
	);

	const tokenDisplay = $derived.by(() => {
		const total = session.token_count ?? 0;
		if (total >= 1000) {
			return `${(total / 1000).toFixed(1)}K`;
		}
		return String(total);
	});

	const contextLabel = $derived(`${contextPercent}% · ${Math.round(contextPercent * 2)}K`);

	const quota5hRemaining = $derived.by(() => {
		const minutesLeft = Math.round((1 - quota5hPercent / 100) * 300);
		if (minutesLeft >= 60) {
			return `${Math.floor(minutesLeft / 60)}h ${minutesLeft % 60}m`;
		}
		return `${minutesLeft}m left`;
	});

	const quota7dRemaining = $derived.by(() => {
		const hoursLeft = Math.round((1 - quota7dPercent / 100) * 168);
		if (hoursLeft >= 24) {
			return `${Math.floor(hoursLeft / 24)}d ${hoursLeft % 24}h`;
		}
		return `${hoursLeft}h left`;
	});

	const pulseColor = $derived(getStatePulseColor(session.state));
</script>

{#if collapsed}
	<!-- Collapsed sidebar (44px) -->
	<div
		class="flex w-11 shrink-0 flex-col items-center gap-2.5 border-l border-border bg-(--sidebar-bg,var(--surface)) pt-2"
	>
		<Button intent="ghost" size="icon-sm" onclick={() => (collapsed = false)}>
			<PanelLeftIcon size={14} strokeWidth={1.8} class="-scale-x-100" />
		</Button>

		<!-- State pulse dot -->
		<div
			class="size-2 rounded-full animate-[badge-pulse_1.8s_ease-in-out_infinite]"
			style="background: {pulseColor}"
		></div>

		<!-- Vertical context bar -->
		<div class="relative h-10 w-1.25 overflow-hidden rounded-0.75 bg-surface-3">
			<div
				class="absolute bottom-0 w-full rounded-0.75"
				style="height: {contextPercent}%; background: {getContextColor(contextPercent)}"
			></div>
		</div>
		<span
			class="font-mono text-[9px] tracking-[0.04em] text-foreground-subtle"
			style="writing-mode: vertical-lr; transform: rotate(180deg)"
		>
			{contextPercent}%
		</span>

		<div class="flex-1"></div>

		{#if subAgentCount > 0}
			<span
				class="mb-2.5 font-mono text-[9px] text-foreground-subtle"
				style="writing-mode: vertical-lr; transform: rotate(180deg)"
			>
				{subAgentCount} agents
			</span>
		{/if}
	</div>
{:else}
	<!-- Expanded sidebar (272px) -->
	<div
		class="flex w-68 shrink-0 flex-col overflow-hidden border-l border-border bg-(--sidebar-bg,var(--surface))"
	>
		<!-- Header with collapse toggle -->
		<div class="flex items-center border-b border-border px-2.5 py-2">
			<Button intent="ghost" size="icon-sm" onclick={() => (collapsed = true)}>
				<PanelLeftIcon size={13} strokeWidth={1.8} class="-scale-x-100" />
			</Button>
		</div>

		<!-- Provider -->
		<div class="border-b border-border px-3 py-2.5">
			<div
				class="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-foreground-subtle"
			>
				Provider
			</div>
			<ProviderChip provider={session.provider} />
		</div>

		<!-- Global usage -->
		<div class="border-b border-border px-3 py-2.5">
			<div
				class="mb-2 text-[10px] font-semibold uppercase tracking-wider text-foreground-subtle"
			>
				Global Usage
			</div>
			<div class="flex flex-col gap-1.5">
				<!-- 5h quota -->
				<div class="flex items-center gap-0">
					<span class="w-13 shrink-0 text-[10.5px] text-foreground-subtle">5h quota</span>
					<div class="flex-1 px-2">
						<ProgressBar
							percent={quota5hPercent}
							color={getQuotaColor(quota5hPercent)}
						/>
					</div>
					<span class="min-w-12 text-right font-mono text-[10px] text-foreground-subtle">
						{quota5hRemaining}
					</span>
				</div>
				<!-- 7d quota -->
				<div class="flex items-center gap-0">
					<span class="w-13 shrink-0 text-[10.5px] text-foreground-subtle">7d quota</span>
					<div class="flex-1 px-2">
						<ProgressBar
							percent={quota7dPercent}
							color={getQuotaColor(quota7dPercent)}
						/>
					</div>
					<span class="min-w-12 text-right font-mono text-[10px] text-foreground-subtle">
						{quota7dRemaining}
					</span>
				</div>
			</div>
		</div>

		<!-- Session metrics -->
		<div class="border-b border-border px-3 py-2.5">
			<div
				class="mb-2 text-[10px] font-semibold uppercase tracking-wider text-foreground-subtle"
			>
				Session
			</div>
			<div class="flex flex-col gap-1.5">
				<!-- Context -->
				<div class="flex items-center gap-0">
					<span class="w-13 shrink-0 text-[10.5px] text-foreground-subtle">Context</span>
					<div class="flex-1 px-2">
						<ProgressBar
							percent={contextPercent}
							color={getContextColor(contextPercent)}
						/>
					</div>
					<span class="min-w-12 text-right font-mono text-[10px] text-foreground-subtle">
						{contextLabel}
					</span>
				</div>
				<!-- Cost -->
				<div class="flex items-center gap-0">
					<span class="w-13 shrink-0 text-[10.5px] text-foreground-subtle">Cost</span>
					<span
						class="flex-1 text-right font-mono text-[11.5px] font-semibold text-foreground"
					>
						{costDisplay}
					</span>
				</div>
				<!-- Tokens -->
				<div class="flex items-center gap-0">
					<span class="w-13 shrink-0 text-[10.5px] text-foreground-subtle">Tokens</span>
					<span class="flex-1 text-right font-mono text-[10.5px] text-foreground-subtle">
						{tokenDisplay} in · 0 out
					</span>
				</div>
			</div>
		</div>

		<!-- Sub-agents -->
		<div class="flex flex-1 flex-col overflow-hidden">
			<div class="flex items-center gap-1.5 border-b border-border px-3 py-2">
				<CpuIcon size={12} strokeWidth={1.8} class="text-foreground-subtle" />
				<span class="flex-1 text-[11px] font-semibold">Sub-Agents</span>
				<Badge>{subAgentCount}</Badge>
			</div>
			<div class="flex-1 overflow-auto px-1 py-1.5">
				{#if subAgentTree}
					{@render subAgentTree()}
				{:else}
					<div class="py-5 text-center text-[11px] text-foreground-subtle">
						No sub-agents spawned yet
					</div>
				{/if}
			</div>
		</div>
	</div>
{/if}
