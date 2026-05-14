<script lang="ts">
	import { onMount } from 'svelte';
	import DownloadIcon from '@lucide/svelte/icons/download';
	import { Button } from '$lib/components/shadcn/button/index.js';
	import * as Card from '$lib/components/shadcn/card/index.js';
	import { cn } from '$lib/utils.js';
	import { setUsageContext } from '$lib/modules/usage/usage.context.svelte.js';
	import { initUsageUrlStateSync } from '$lib/modules/usage/url_state_sync.svelte.js';
	import { useWindow } from '$lib/modules/window/window.context.svelte.js';
	import {
		PERIODS,
		USAGE_SCOPES,
		isMetricsPeriod,
		isUsageScope,
		isGroupByOption,
		type MetricsPeriod,
		type GroupByOption,
		type UsageScope,
	} from '$lib/modules/usage/usage_types.js';
	import { exportUsageCsv } from '$lib/components/blocks/usage/csv_export.js';
	import { formatCostDisplay } from '$lib/components/blocks/usage/cost_link_utils.js';

	import CostChart from '$lib/components/blocks/usage/CostChart.svelte';
	import RefreshIndicator from '$lib/components/blocks/usage/RefreshIndicator.svelte';
	import ColorThemePicker from '$lib/components/blocks/usage/ColorThemePicker.svelte';
	import GroupByDropdown from '$lib/components/blocks/usage/GroupByDropdown.svelte';
	import ScopeToggle from '$lib/components/blocks/usage/ScopeToggle.svelte';
	import AchievementsDialog from '$lib/components/blocks/usage/AchievementsDialog.svelte';
	import DateRangePicker from '$lib/components/blocks/usage/DateRangePicker.svelte';

	const ctx = setUsageContext();
	const windowCtx = useWindow();

	if (windowCtx.isOverview) {
		ctx.scope.current = USAGE_SCOPES.global;
	}

	initUsageUrlStateSync({
		get activePeriod() {
			return ctx.activePeriod.current;
		},
		get scope() {
			return ctx.scope.current;
		},
		get groupBy() {
			return ctx.groupBy.current;
		},
		get customDateRange() {
			return ctx.customDateRange.current;
		},
		restoreFromUrl(period, scope, groupBy, customFrom, customTo) {
			if (isMetricsPeriod(period)) {
				ctx.activePeriod.current = period;
			}
			if (isUsageScope(scope)) {
				ctx.scope.current = scope;
			}
			if (isGroupByOption(groupBy)) {
				ctx.groupBy.current = groupBy;
			}
			if (customFrom !== null && customTo !== null) {
				ctx.customDateRange.current = { start: customFrom, end: customTo };
			}
			void ctx.loadData(windowCtx.boundDashboardId ?? undefined);
		},
	});

	function formatDelta(value: number | null | undefined): string {
		if (value == null) {
			return '';
		}
		const sign = value >= 0 ? '+' : '';
		return `${sign}${value.toFixed(0)}%`;
	}

	function deltaTone(value: number | null | undefined): string {
		if (value == null) {
			return 'text-muted-foreground';
		}
		return value <= 0 ? 'text-green-500' : 'text-amber-500';
	}

	function oneShotColor(pct: number): string {
		if (pct >= 75) {
			return 'bg-green-500';
		}
		if (pct >= 60) {
			return 'bg-amber-500';
		}
		if (pct > 0) {
			return 'bg-red-400';
		}
		return 'bg-muted';
	}

	function categoryLabel(category: string): string {
		return category.charAt(0).toUpperCase() + category.slice(1).replace('-', '/');
	}

	let maxActivityCost = $derived(
		ctx.dashboardData.current
			? Math.max(...ctx.dashboardData.current.activity_breakdown.map((a) => a.cost_usd), 0.01)
			: 1,
	);

	let maxToolCount = $derived(
		ctx.dashboardData.current
			? Math.max(...ctx.dashboardData.current.tool_usage.map((t) => t.call_count), 1)
			: 1,
	);

	function handlePeriodChange(period: MetricsPeriod) {
		ctx.activePeriod.current = period;
		ctx.customDateRange.current = null;
		void ctx.loadData(windowCtx.boundDashboardId ?? undefined);
	}

	function handleCustomRange(range: { start: string; end: string }) {
		ctx.customDateRange.current = range;
		ctx.activePeriod.current = 'custom';
		void ctx.loadData(windowCtx.boundDashboardId ?? undefined);
	}

	function handleGroupByChange(option: GroupByOption) {
		ctx.groupBy.current = option;
		void ctx.loadData(windowCtx.boundDashboardId ?? undefined);
	}

	function handleScopeChange(scope: UsageScope) {
		ctx.scope.current = scope;
		void ctx.loadData(
			scope === USAGE_SCOPES.workspace
				? (windowCtx.boundDashboardId ?? undefined)
				: undefined,
		);
	}

	function handleExportCsv() {
		if (ctx.dashboardData.current) {
			void exportUsageCsv(ctx.dashboardData.current, ctx.activePeriod.current);
		}
	}

	onMount(() => {
		return () => {
			ctx.clearTimers();
		};
	});
</script>

<div class="flex flex-col gap-6 p-8">
	<!-- Header -->
	<div class="flex items-center justify-between">
		<h1 class="text-2xl font-bold text-foreground">Usage Analytics</h1>
		<div class="flex items-center gap-2">
			<ColorThemePicker
				value={ctx.colorTheme.current}
				onchange={(theme) => (ctx.colorTheme.current = theme)}
			/>
			<AchievementsDialog
				achievements={ctx.achievements.current}
				unlockedCount={ctx.unlockedCount}
				totalCount={ctx.achievements.current.length}
			/>
			<RefreshIndicator
				refreshState={ctx.refreshState.current}
				lastUpdatedAt={ctx.lastUpdatedAt.current}
				onrefresh={() => ctx.loadData(windowCtx.boundDashboardId ?? undefined)}
			/>
			<Button intent="secondary" size="sm" onclick={handleExportCsv}>
				<DownloadIcon data-icon="inline-start" />
				Export CSV
			</Button>
		</div>
	</div>

	<!-- Filter bar: period tabs + group-by -->
	<div class="flex items-center gap-3">
		<div class="flex gap-1 rounded-lg bg-muted p-1">
			{#each PERIODS as period (period.value)}
				<button
					class={cn(
						'rounded-md px-4 py-1.5 text-sm font-medium transition-colors',
						ctx.activePeriod.current === period.value
							? 'bg-background text-foreground shadow-sm'
							: 'text-muted-foreground hover:text-foreground',
					)}
					onclick={() => handlePeriodChange(period.value)}
				>
					{period.label}
				</button>
			{/each}
			<DateRangePicker
				onselect={handleCustomRange}
				active={ctx.activePeriod.current === 'custom'}
			/>
		</div>
		<ScopeToggle value={ctx.scope.current} onchange={handleScopeChange} />
		<GroupByDropdown value={ctx.groupBy.current} onchange={handleGroupByChange} />
	</div>

	{#if ctx.refreshState.current === 'loading' && !ctx.dashboardData.current}
		<div class="flex h-64 items-center justify-center text-muted-foreground">Loading...</div>
	{:else if ctx.dashboardData.current}
		{@const data = ctx.dashboardData.current}

		<!-- KPI Cards -->
		<div class="grid grid-cols-4 gap-4">
			<Card.Card>
				<div class="p-4">
					<div class="text-sm text-muted-foreground">Total cost</div>
					<div class="text-2xl font-bold">
						{formatCostDisplay(data.stats.total_cost_usd)}
					</div>
					<div class={cn('text-xs', deltaTone(data.stats.cost_delta_percent))}>
						{formatDelta(data.stats.cost_delta_percent)} vs prev period
					</div>
				</div>
			</Card.Card>
			<Card.Card>
				<div class="p-4">
					<div class="text-sm text-muted-foreground">Sessions</div>
					<div class="text-2xl font-bold">{data.stats.session_count}</div>
					<div class="text-xs text-muted-foreground">
						{#if data.stats.session_count_delta != null}
							{data.stats.session_count_delta >= 0 ? '+' : ''}{data.stats
								.session_count_delta} vs prev period
						{/if}
					</div>
				</div>
			</Card.Card>
			<Card.Card>
				<div class="p-4">
					<div class="text-sm text-muted-foreground">One-shot rate</div>
					<div class="text-2xl font-bold">{data.stats.one_shot_rate.toFixed(0)}%</div>
					<div class="text-xs text-muted-foreground">industry avg ≈ 62%</div>
				</div>
			</Card.Card>
			<Card.Card>
				<div class="p-4">
					<div class="text-sm text-muted-foreground">Cache hit</div>
					<div class="text-2xl font-bold">{data.stats.cache_hit_ratio.toFixed(0)}%</div>
					<div class="text-xs text-muted-foreground">
						saving ≈ {formatCostDisplay(
							data.stats.total_cost_usd * (data.stats.cache_hit_ratio / 100) * 0.9,
						)}/mo
					</div>
				</div>
			</Card.Card>
		</div>

		<!-- Cost Chart -->
		<Card.Card>
			<div class="px-4 pt-4 pb-2">
				<h3 class="text-base font-semibold">Cost per period</h3>
			</div>
			<div class="px-4 pb-4">
				<CostChart
					data={data.time_bucket_costs}
					groupedData={data.grouped_costs}
					colorTheme={ctx.colorTheme.current}
					groupBy={ctx.groupBy.current}
					period={ctx.activePeriod.current}
				/>
			</div>
		</Card.Card>

		<!-- Activity Breakdown + Right Column -->
		<div class="grid grid-cols-[1.4fr_1fr] gap-4">
			<!-- Activity Breakdown -->
			<Card.Card>
				<div class="px-4 pt-4 pb-2">
					<h3 class="text-base font-semibold">Activity breakdown</h3>
				</div>
				<div class="px-4 pb-4">
					<div class="space-y-2">
						<div
							class="grid grid-cols-[120px_1fr_64px_44px_44px] gap-2 text-xs font-medium text-muted-foreground"
						>
							<span>Category</span>
							<span></span>
							<span class="text-right">Cost</span>
							<span class="text-right">Turns</span>
							<span class="text-right">1-shot</span>
						</div>
						{#each data.activity_breakdown as activity (activity.category)}
							<div
								class="grid grid-cols-[120px_1fr_64px_44px_44px] items-center gap-2"
							>
								<span class="truncate text-sm"
									>{categoryLabel(activity.category)}</span
								>
								<div class="h-2 overflow-hidden rounded-full bg-muted">
									<div
										class="h-full rounded-full bg-primary"
										style:width="{(activity.cost_usd / maxActivityCost) * 100}%"
									></div>
								</div>
								<span class="text-right text-sm tabular-nums"
									>{formatCostDisplay(activity.cost_usd)}</span
								>
								<span class="text-right text-sm tabular-nums text-muted-foreground"
									>{activity.turn_count}</span
								>
								<span class="text-right text-sm tabular-nums">
									{#if activity.one_shot_percent > 0}
										<span class="inline-flex items-center gap-1">
											<span
												class={cn(
													'inline-block size-1.5 rounded-full',
													oneShotColor(activity.one_shot_percent),
												)}
											></span>
											{activity.one_shot_percent.toFixed(0)}%
										</span>
									{:else}
										<span class="text-muted-foreground">—</span>
									{/if}
								</span>
							</div>
						{/each}
					</div>
				</div>
			</Card.Card>

			<!-- Right Column -->
			<div class="flex flex-col gap-4">
				<!-- Top Sessions -->
				<Card.Card>
					<div class="px-4 pt-4 pb-2">
						<h3 class="text-base font-semibold">Top sessions</h3>
					</div>
					<div class="px-4 pb-4">
						<div class="space-y-2">
							{#each data.top_sessions as session (session.session_id)}
								<div class="flex items-center justify-between text-sm">
									<div class="flex items-center gap-2 truncate">
										{#if session.issue_number}
											<span class="text-muted-foreground"
												>#{session.issue_number}</span
											>
										{/if}
										<span class="truncate"
											>{session.issue_name ?? 'Ad-hoc session'}</span
										>
									</div>
									<span class="shrink-0 tabular-nums font-medium"
										>{formatCostDisplay(session.cost_usd)}</span
									>
								</div>
							{/each}
						</div>
					</div>
				</Card.Card>

				<!-- Tool Calls -->
				<Card.Card>
					<div class="px-4 pt-4 pb-2">
						<h3 class="text-base font-semibold">Tool calls</h3>
					</div>
					<div class="px-4 pb-4">
						<div class="space-y-1.5">
							{#each data.tool_usage as tool (tool.tool_name)}
								<div class="grid grid-cols-[80px_1fr_48px] items-center gap-2">
									<span class="truncate text-sm">{tool.tool_name}</span>
									<div class="h-2 overflow-hidden rounded-full bg-muted">
										<div
											class="h-full rounded-full bg-primary/70"
											style:width="{(tool.call_count / maxToolCount) * 100}%"
										></div>
									</div>
									<span
										class="text-right text-sm tabular-nums text-muted-foreground"
										>{tool.call_count}</span
									>
								</div>
							{/each}
						</div>
					</div>
				</Card.Card>
			</div>
		</div>
	{/if}
</div>
