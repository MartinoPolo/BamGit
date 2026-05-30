<script lang="ts">
	import { SvelteMap, SvelteSet } from 'svelte/reactivity';
	import { scaleBand } from 'd3-scale';
	import { BarChart } from 'layerchart';
	import * as Chart from '$lib/components/shadcn/chart/index.js';
	import {
		CHART_COLOR_THEMES,
		GROUP_BY_OPTIONS,
		type ChartColorTheme,
		type GroupByOption,
		type MetricsPeriod,
	} from '$lib/modules/usage/usage_types.js';
	import type { TimeBucketCost, GroupedCostEntry } from '$lib/types/generated/index.js';

	interface GroupedChartRow {
		date: string;
		[group: string]: number | string;
	}

	interface Props {
		data: TimeBucketCost[];
		groupedData: GroupedCostEntry[];
		colorTheme: ChartColorTheme;
		groupBy: GroupByOption;
		period: MetricsPeriod;
		formatCostValue?: (amountUsd: number) => string;
		currencyCode?: string;
	}

	let {
		data,
		groupedData = [],
		colorTheme,
		groupBy,
		period,
		formatCostValue,
		currencyCode = 'USD',
	}: Props = $props();

	const chartColors = [
		'var(--chart-1)',
		'var(--chart-2)',
		'var(--chart-3)',
		'var(--chart-4)',
		'var(--chart-5)',
	];

	const isGrouped = $derived(groupBy !== GROUP_BY_OPTIONS.none);

	const uniqueGroups = $derived.by(() => {
		const groups = new SvelteSet<string>();
		for (const entry of groupedData) {
			groups.add(entry.group);
		}
		return [...groups];
	});

	const groupedChartData = $derived.by((): GroupedChartRow[] => {
		const byDate = new SvelteMap<string, GroupedChartRow>();
		for (const entry of groupedData) {
			const existing = byDate.get(entry.date);
			if (existing !== undefined) {
				existing[entry.group] =
					((existing[entry.group] as number | undefined) ?? 0) + entry.cost_usd;
			} else {
				byDate.set(entry.date, { date: entry.date, [entry.group]: entry.cost_usd });
			}
		}
		return [...byDate.values()];
	});

	const groupedSeries = $derived(
		uniqueGroups.map((group, index) => ({
			key: group,
			label: group,
			value: group,
			color: chartColors[index % chartColors.length],
		})),
	);

	const maxCostValue = $derived(
		data.length === 0 ? 1 : Math.max(...data.map((d) => d.cost_usd), 0.01),
	);

	function trafficLightColor(costUsd: number): string {
		const ratio = costUsd / maxCostValue;
		if (ratio <= 0.33) {
			return 'var(--color-green-500, oklch(0.6 0.17 145))';
		}
		if (ratio <= 0.66) {
			return 'var(--color-amber-400, oklch(0.79 0.17 70))';
		}
		return 'var(--color-red-500, oklch(0.58 0.22 25))';
	}

	function gradientColor(costUsd: number): string {
		const ratio = costUsd / maxCostValue;
		if (ratio <= 0.33) {
			return 'var(--color-blue-500, oklch(0.6 0.2 240))';
		}
		if (ratio <= 0.66) {
			return 'var(--color-yellow-400, oklch(0.85 0.18 90))';
		}
		return 'var(--color-red-500, oklch(0.58 0.22 25))';
	}

	function colorAccessor(d: TimeBucketCost): string {
		if (colorTheme === CHART_COLOR_THEMES.trafficLight) {
			return trafficLightColor(d.cost_usd);
		}
		if (colorTheme === CHART_COLOR_THEMES.gradient) {
			return gradientColor(d.cost_usd);
		}
		const ratio = d.cost_usd / maxCostValue;
		const alpha = 0.3 + ratio * 0.7;
		return `oklch(0.58 0.096 134 / ${alpha})`;
	}

	function formatXLabel(value: unknown): string {
		if (typeof value !== 'string') {
			return String(value);
		}
		const date = new Date(value);
		if (isNaN(date.getTime())) {
			return value;
		}
		if (period === 'today') {
			return date.toLocaleTimeString('en-US', {
				hour: '2-digit',
				minute: '2-digit',
				hour12: false,
			});
		}
		return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
	}

	function formatYLabel(value: unknown): string {
		if (typeof value !== 'number') {
			return String(value);
		}
		if (formatCostValue !== undefined) {
			return formatCostValue(value);
		}
		if (value === 0) {
			return '$0';
		}
		if (value >= 1) {
			return `$${value.toFixed(0)}`;
		}
		return `$${value.toFixed(2)}`;
	}

	const chartConfig = $derived.by(() => {
		if (isGrouped) {
			const config: Chart.ChartConfig = {};
			for (const [index, group] of uniqueGroups.entries()) {
				config[group] = {
					label: group,
					color: chartColors[index % chartColors.length],
				};
			}
			return config;
		}
		return {
			cost_usd: {
				label: `Cost (${currencyCode})`,
				color: 'var(--chart-1)',
			},
		} satisfies Chart.ChartConfig;
	});
</script>

<div class="flex flex-col gap-2">
	<Chart.Container config={chartConfig} class="h-48 w-full">
		{#if isGrouped}
			<BarChart
				data={groupedChartData}
				x="date"
				series={groupedSeries}
				seriesLayout="stack"
				xScale={scaleBand().padding(0.2)}
				axis={true}
				props={{
					xAxis: { format: formatXLabel },
					yAxis: { format: formatYLabel },
					bars: { stroke: 'none', radius: 4 },
				}}
			>
				{#snippet tooltip()}
					<Chart.Tooltip
						labelFormatter={(value) => formatXLabel(value)}
						valueFormatter={formatCostValue}
					/>
				{/snippet}
			</BarChart>
		{:else}
			<BarChart
				{data}
				x="date"
				y="cost_usd"
				c={colorAccessor}
				xScale={scaleBand().padding(0.2)}
				axis={true}
				props={{
					xAxis: { format: formatXLabel },
					yAxis: { format: formatYLabel },
					bars: { stroke: 'none', radius: 4 },
				}}
			>
				{#snippet tooltip()}
					<Chart.Tooltip
						labelFormatter={(value, payload) => {
							const sessionCount =
								payload.length > 0
									? (payload[0] as Record<string, unknown>)?.['session_count']
									: undefined;
							const label = formatXLabel(value);
							if (sessionCount != null) {
								return `${label} · ${sessionCount} sessions`;
							}
							return label;
						}}
						valueFormatter={formatCostValue}
					/>
				{/snippet}
			</BarChart>
		{/if}
	</Chart.Container>
	{#if isGrouped}
		<div class="flex flex-wrap gap-3 text-xs text-muted-foreground">
			{#each uniqueGroups as group, index (group)}
				<div class="flex items-center gap-1.5">
					<span
						class="inline-block size-2.5 rounded-sm"
						style:background={chartColors[index % chartColors.length]}
					></span>
					<span>{group}</span>
				</div>
			{/each}
		</div>
	{/if}
</div>
