<script lang="ts">
	import { Button } from '$lib/components/shadcn/button/index.js';
	import { formatCostWithFallback } from '$lib/modules/usage/currency.js';
	import type { UsageDashboardData } from '$lib/types/generated';
	import {
		overviewMetricCardClass,
		overviewPanelClass,
		overviewPanelHeaderClass,
	} from './overview_style.js';

	interface Props {
		usageData: UsageDashboardData | null;
		cacheSavingsEstimate: number;
		maxToolCallCount: number;
		maxTrendCost: number;
		formatCost?: (amountUsd: number) => string;
		onOpenUsage: () => void;
	}

	let {
		usageData,
		cacheSavingsEstimate,
		maxToolCallCount,
		maxTrendCost,
		formatCost = (amountUsd: number) => formatCostWithFallback(amountUsd, 'USD', 1),
		onOpenUsage,
	}: Props = $props();

	function formatDelta(value: number | null | undefined): string {
		if (value == null) {
			return 'no comparison';
		}
		return `${value >= 0 ? '+' : ''}${value.toFixed(0)}% vs previous`;
	}

	function formatSessionDelta(value: number | null | undefined): string {
		if (value == null) {
			return 'no comparison';
		}
		return `${value >= 0 ? '+' : ''}${value} vs previous`;
	}
</script>

<section class={overviewPanelClass} aria-label="Cost and usage">
	<div class={overviewPanelHeaderClass}>
		<span>Cost and usage</span>
		<Button
			intent="secondary"
			size="sm"
			class="h-7 rounded-sm border-[color-mix(in_oklch,var(--moss-400)_25%,var(--border))] bg-[color-mix(in_oklch,var(--surface-2)_70%,transparent)] px-2 text-[11px] font-medium normal-case text-foreground-muted hover:border-[color-mix(in_oklch,var(--moss-400)_45%,var(--border))] hover:text-foreground"
			onclick={onOpenUsage}
		>
			Open usage
		</Button>
	</div>

	{#if usageData}
		<div class="mt-3.5 grid grid-cols-4 gap-2.5 max-md:grid-cols-2">
			<div class={overviewMetricCardClass}>
				<span class="text-[11px] font-semibold text-foreground-subtle uppercase"
					>30d cost</span
				>
				<strong class="mt-1 block font-mono text-xl leading-none font-semibold">
					{formatCost(usageData.stats.total_cost_usd)}
				</strong>
				<small class="mt-1 block text-[11px] text-foreground-muted">
					{formatDelta(usageData.stats.cost_delta_percent)}
				</small>
			</div>
			<div class={overviewMetricCardClass}>
				<span class="text-[11px] font-semibold text-foreground-subtle uppercase"
					>Sessions</span
				>
				<strong class="mt-1 block font-mono text-xl leading-none font-semibold">
					{usageData.stats.session_count}
				</strong>
				<small class="mt-1 block text-[11px] text-foreground-muted">
					{formatSessionDelta(usageData.stats.session_count_delta)}
				</small>
			</div>
			<div class={overviewMetricCardClass}>
				<span class="text-[11px] font-semibold text-foreground-subtle uppercase"
					>One-shot</span
				>
				<strong class="mt-1 block font-mono text-xl leading-none font-semibold">
					{usageData.stats.one_shot_rate.toFixed(0)}%
				</strong>
				<small class="mt-1 block text-[11px] text-foreground-muted"
					>first-pass completion</small
				>
			</div>
			<div class={overviewMetricCardClass}>
				<span class="text-[11px] font-semibold text-foreground-subtle uppercase"
					>Cache hit</span
				>
				<strong class="mt-1 block font-mono text-xl leading-none font-semibold">
					{usageData.stats.cache_hit_ratio.toFixed(0)}%
				</strong>
				<small class="mt-1 block text-[11px] text-foreground-muted">
					saving ~{formatCost(cacheSavingsEstimate)}/mo
				</small>
			</div>
		</div>

		<div
			class="mt-4 grid grid-cols-[minmax(0,1fr)_minmax(240px,0.8fr)] gap-4 max-lg:grid-cols-1"
		>
			<div>
				<div class="text-[11px] font-semibold text-foreground-subtle uppercase">
					Cost trend
				</div>
				<div class="mt-2.5 flex h-12 items-end gap-1" aria-hidden="true">
					{#each usageData.time_bucket_costs.slice(-14) as bucket (bucket.date)}
						<span
							class="w-full min-w-1.5 rounded-t-xs bg-linear-to-b from-moss-300 to-[color-mix(in_oklch,var(--moss-500)_65%,var(--surface))]"
							title={`${bucket.date}: ${formatCost(bucket.cost_usd)}`}
							style:height={`${Math.max(10, (bucket.cost_usd / maxTrendCost) * 44)}px`}
						></span>
					{/each}
				</div>
			</div>

			<div>
				<div class="text-[11px] font-semibold text-foreground-subtle uppercase">
					Top tools
				</div>
				<div class="mt-2.5 grid gap-1.5">
					{#each usageData.tool_usage.slice(0, 4) as tool (tool.tool_name)}
						<div
							class="grid grid-cols-[76px_minmax(0,1fr)_42px] items-center gap-2 text-xs text-foreground-muted"
						>
							<span class="truncate">{tool.tool_name}</span>
							<div
								class="h-1.5 overflow-hidden rounded-full bg-[color-mix(in_oklch,var(--foreground)_8%,transparent)]"
							>
								<span
									class="block h-full rounded-[inherit] bg-[color-mix(in_oklch,var(--teal-400)_70%,var(--moss-300))]"
									style:width={`${(tool.call_count / maxToolCallCount) * 100}%`}
								></span>
							</div>
							<small class="text-right font-mono">{tool.call_count}</small>
						</div>
					{/each}
				</div>
			</div>
		</div>
	{:else}
		<div class="grid min-h-22 place-items-center text-xs text-foreground-muted">
			Usage metrics loading...
		</div>
	{/if}
</section>
