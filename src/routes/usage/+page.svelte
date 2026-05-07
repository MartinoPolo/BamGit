<script lang="ts">
	import { invoke } from '$lib/tauri.js';
	import { cn } from '$lib/utils.js';
	import RefreshCwIcon from '@lucide/svelte/icons/refresh-cw';
	import DownloadIcon from '@lucide/svelte/icons/download';
	import TrophyIcon from '@lucide/svelte/icons/trophy';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';

	type MetricsPeriod = 'today' | 'week' | 'thirty-days' | 'month' | 'all';

	interface UsageStats {
		total_cost_usd: number;
		session_count: number;
		one_shot_rate: number;
		cache_hit_ratio: number;
		cost_delta_percent: number | null;
		session_count_delta: number | null;
	}

	interface DailyCost {
		date: string;
		cost_usd: number;
		session_count: number;
	}

	interface ActivityBreakdown {
		category: string;
		cost_usd: number;
		turn_count: number;
		one_shot_percent: number;
	}

	interface TopSession {
		session_id: string;
		issue_name: string | null;
		issue_number: number | null;
		cost_usd: number;
		turn_count: number;
		tool_call_count: number;
		started_at: string;
	}

	interface ToolUsageBreakdown {
		tool_name: string;
		call_count: number;
	}

	interface UsageDashboardData {
		stats: UsageStats;
		daily_costs: DailyCost[];
		activity_breakdown: ActivityBreakdown[];
		top_sessions: TopSession[];
		tool_usage: ToolUsageBreakdown[];
	}

	interface Achievement {
		kind: string;
		display_name: string;
		description: string;
		threshold: number;
		progress: number;
		unlocked_at: string | null;
	}

	const PERIODS: { value: MetricsPeriod; label: string }[] = [
		{ value: 'today', label: 'Today' },
		{ value: 'week', label: '7d' },
		{ value: 'thirty-days', label: '30d' },
		{ value: 'month', label: 'Month' },
		{ value: 'all', label: 'All' },
	];

	let activePeriod = $state<MetricsPeriod>('thirty-days');
	let dashboardData = $state<UsageDashboardData | null>(null);
	let achievements = $state<Achievement[]>([]);
	let loading = $state(true);
	let showAchievements = $state(false);

	async function loadData() {
		loading = true;
		try {
			const [dashboard, achievementList] = await Promise.all([
				invoke<UsageDashboardData>('get_usage_dashboard', { period: activePeriod }),
				invoke<Achievement[]>('get_achievements'),
			]);
			dashboardData = dashboard;
			achievements = achievementList;
		} catch (err) {
			console.error('Failed to load usage data:', err);
		} finally {
			loading = false;
		}
	}

	$effect(() => {
		void activePeriod;
		void loadData();
	});

	function formatCost(value: number): string {
		return `$${value.toFixed(2)}`;
	}

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

	let maxDailyCost = $derived(
		dashboardData ? Math.max(...dashboardData.daily_costs.map((d) => d.cost_usd), 0.01) : 1,
	);

	let maxToolCount = $derived(
		dashboardData ? Math.max(...dashboardData.tool_usage.map((t) => t.call_count), 1) : 1,
	);

	let maxActivityCost = $derived(
		dashboardData
			? Math.max(...dashboardData.activity_breakdown.map((a) => a.cost_usd), 0.01)
			: 1,
	);

	let unlockedCount = $derived(achievements.filter((a) => a.unlocked_at !== null).length);
</script>

<div class="flex flex-col gap-6 p-8">
	<!-- Header -->
	<div class="flex items-center justify-between">
		<h1 class="text-2xl font-bold text-foreground">Usage Analytics</h1>
		<div class="flex items-center gap-2">
			<Button
				variant="secondary"
				size="sm"
				onclick={() => (showAchievements = !showAchievements)}
			>
				<TrophyIcon />
				{unlockedCount}/{achievements.length}
			</Button>
			<Button variant="secondary" size="sm" onclick={() => loadData()}>
				<RefreshCwIcon />
			</Button>
			<Button variant="secondary" size="sm">
				<DownloadIcon />
				Export CSV
			</Button>
		</div>
	</div>

	<!-- Period tabs -->
	<div class="flex gap-1 rounded-lg bg-muted p-1">
		{#each PERIODS as period (period.value)}
			<button
				class={cn(
					'rounded-md px-4 py-1.5 text-sm font-medium transition-colors',
					activePeriod === period.value
						? 'bg-background text-foreground shadow-sm'
						: 'text-muted-foreground hover:text-foreground',
				)}
				onclick={() => (activePeriod = period.value)}
			>
				{period.label}
			</button>
		{/each}
	</div>

	{#if loading || !dashboardData}
		<div class="flex h-64 items-center justify-center text-muted-foreground">Loading...</div>
	{:else}
		<!-- KPI Cards -->
		<div class="grid grid-cols-4 gap-4">
			<Card.Card>
				<div class="p-4">
					<div class="text-sm text-muted-foreground">Total cost</div>
					<div class="text-2xl font-bold">
						{formatCost(dashboardData.stats.total_cost_usd)}
					</div>
					<div class={cn('text-xs', deltaTone(dashboardData.stats.cost_delta_percent))}>
						{formatDelta(dashboardData.stats.cost_delta_percent)} vs prev period
					</div>
				</div>
			</Card.Card>
			<Card.Card>
				<div class="p-4">
					<div class="text-sm text-muted-foreground">Sessions</div>
					<div class="text-2xl font-bold">{dashboardData.stats.session_count}</div>
					<div class="text-xs text-muted-foreground">
						{#if dashboardData.stats.session_count_delta != null}
							{dashboardData.stats.session_count_delta >= 0 ? '+' : ''}{dashboardData
								.stats.session_count_delta} vs prev period
						{/if}
					</div>
				</div>
			</Card.Card>
			<Card.Card>
				<div class="p-4">
					<div class="text-sm text-muted-foreground">One-shot rate</div>
					<div class="text-2xl font-bold">
						{dashboardData.stats.one_shot_rate.toFixed(0)}%
					</div>
					<div class="text-xs text-muted-foreground">industry avg ≈ 62%</div>
				</div>
			</Card.Card>
			<Card.Card>
				<div class="p-4">
					<div class="text-sm text-muted-foreground">Cache hit</div>
					<div class="text-2xl font-bold">
						{dashboardData.stats.cache_hit_ratio.toFixed(0)}%
					</div>
					<div class="text-xs text-muted-foreground">
						saving ≈ {formatCost(
							dashboardData.stats.total_cost_usd *
								(dashboardData.stats.cache_hit_ratio / 100) *
								0.9,
						)}/mo
					</div>
				</div>
			</Card.Card>
		</div>

		<!-- Daily Cost Chart -->
		<Card.Card>
			<div class="px-4 pt-4 pb-2">
				<h3 class="text-base font-semibold">Cost per day</h3>
			</div>
			<div class="px-4 pb-4">
				<div class="flex h-32 items-end gap-0.5">
					{#each dashboardData.daily_costs as day (day.date)}
						<div
							class="flex-1 rounded-t bg-primary transition-all hover:opacity-80"
							style:height="{Math.max((day.cost_usd / maxDailyCost) * 100, 2)}%"
							title="{day.date}: {formatCost(
								day.cost_usd,
							)} ({day.session_count} sessions)"
						></div>
					{/each}
				</div>
				<div class="mt-1 flex justify-between text-xs text-muted-foreground">
					<span>{dashboardData.daily_costs[0]?.date ?? ''}</span>
					<span
						>{dashboardData.daily_costs[dashboardData.daily_costs.length - 1]?.date ??
							''}</span
					>
				</div>
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
						{#each dashboardData.activity_breakdown as activity (activity.category)}
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
									>{formatCost(activity.cost_usd)}</span
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
							{#each dashboardData.top_sessions as session (session.session_id)}
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
										>{formatCost(session.cost_usd)}</span
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
							{#each dashboardData.tool_usage as tool (tool.tool_name)}
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

		<!-- Achievements Section -->
		{#if showAchievements}
			<Card.Card>
				<div class="px-4 pt-4 pb-2">
					<h3 class="text-base font-semibold">Achievements</h3>
					<p class="text-sm text-muted-foreground">
						{unlockedCount} of {achievements.length} unlocked
					</p>
				</div>
				<div class="px-4 pb-4">
					<div class="grid grid-cols-2 gap-3">
						{#each achievements as achievement (achievement.kind)}
							<div
								class={cn(
									'flex items-center gap-3 rounded-lg border p-3 transition-colors',
									achievement.unlocked_at
										? 'border-primary/30 bg-primary/5'
										: 'opacity-50',
								)}
							>
								<div
									class={cn(
										'flex size-10 shrink-0 items-center justify-center rounded-lg text-lg',
										achievement.unlocked_at ? 'bg-primary/10' : 'bg-muted',
									)}
								>
									<TrophyIcon
										class={cn(
											'size-5',
											achievement.unlocked_at
												? 'text-primary'
												: 'text-muted-foreground',
										)}
									/>
								</div>
								<div class="min-w-0">
									<div class="truncate text-sm font-medium">
										{achievement.display_name}
									</div>
									<div class="text-xs text-muted-foreground">
										{achievement.description}
									</div>
									<div class="mt-1 h-1 overflow-hidden rounded-full bg-muted">
										<div
											class="h-full rounded-full bg-primary"
											style:width="{Math.min(
												(achievement.progress / achievement.threshold) *
													100,
												100,
											)}%"
										></div>
									</div>
								</div>
							</div>
						{/each}
					</div>
				</div>
			</Card.Card>
		{/if}
	{/if}
</div>
