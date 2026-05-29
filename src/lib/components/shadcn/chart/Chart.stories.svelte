<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import { ChartContainer, ChartTooltip, type ChartConfig } from './index.js';

	const { Story } = defineMeta({
		title: 'Base/Chart',
		component: ChartContainer,
		tags: ['autodocs'],
	});

	const singleSeriesConfig = {
		revenue: {
			label: 'Revenue',
			color: 'var(--chart-1)',
		},
	} satisfies ChartConfig;

	const multiSeriesConfig = {
		revenue: {
			label: 'Revenue',
			color: 'var(--chart-1)',
		},
		expenses: {
			label: 'Expenses',
			color: 'var(--chart-2)',
		},
		profit: {
			label: 'Profit',
			color: 'var(--chart-3)',
		},
	} satisfies ChartConfig;

	const weeklyData = [
		{ date: 'Mon', revenue: 420, expenses: 280 },
		{ date: 'Tue', revenue: 680, expenses: 310 },
		{ date: 'Wed', revenue: 540, expenses: 420 },
		{ date: 'Thu', revenue: 820, expenses: 390 },
		{ date: 'Fri', revenue: 760, expenses: 450 },
		{ date: 'Sat', revenue: 340, expenses: 220 },
		{ date: 'Sun', revenue: 290, expenses: 180 },
	];

	const monthlyData = [
		{ month: 'Jan', revenue: 4200, expenses: 2800, profit: 1400 },
		{ month: 'Feb', revenue: 5100, expenses: 3100, profit: 2000 },
		{ month: 'Mar', revenue: 4800, expenses: 3400, profit: 1400 },
		{ month: 'Apr', revenue: 6300, expenses: 3900, profit: 2400 },
		{ month: 'May', revenue: 7200, expenses: 4100, profit: 3100 },
		{ month: 'Jun', revenue: 6800, expenses: 4500, profit: 2300 },
	];
</script>

<script lang="ts">
	import { scaleBand } from 'd3-scale';
	import { BarChart, AreaChart } from 'layerchart';
</script>

<Story name="All Variants">
	{#snippet template()}
		<div class="flex flex-col gap-10 p-6">
			<div class="flex flex-col gap-3">
				<p class="text-sm font-medium text-foreground-muted">Bar chart — single series</p>
				<ChartContainer config={singleSeriesConfig} class="h-48 w-full">
					<BarChart
						data={weeklyData}
						x="date"
						y="revenue"
						xScale={scaleBand().padding(0.2)}
						axis={true}
						props={{ bars: { stroke: 'none', radius: 4 } }}
					>
						{#snippet tooltip()}
							<ChartTooltip />
						{/snippet}
					</BarChart>
				</ChartContainer>
			</div>

			<div class="flex flex-col gap-3">
				<p class="text-sm font-medium text-foreground-muted">
					Bar chart — multi-series stacked
				</p>
				<ChartContainer config={multiSeriesConfig} class="h-48 w-full">
					<BarChart
						data={monthlyData}
						x="month"
						series={[
							{
								key: 'revenue',
								label: 'Revenue',
								value: 'revenue',
								color: 'var(--chart-1)',
							},
							{
								key: 'expenses',
								label: 'Expenses',
								value: 'expenses',
								color: 'var(--chart-2)',
							},
						]}
						seriesLayout="stack"
						xScale={scaleBand().padding(0.2)}
						axis={true}
						props={{ bars: { stroke: 'none', radius: 4 } }}
					>
						{#snippet tooltip()}
							<ChartTooltip />
						{/snippet}
					</BarChart>
				</ChartContainer>
			</div>

			<div class="flex flex-col gap-3">
				<p class="text-sm font-medium text-foreground-muted">Area chart — multi-series</p>
				<ChartContainer config={multiSeriesConfig} class="h-48 w-full">
					<AreaChart
						data={monthlyData}
						x="month"
						series={[
							{
								key: 'revenue',
								label: 'Revenue',
								value: 'revenue',
								color: 'var(--chart-1)',
							},
							{
								key: 'expenses',
								label: 'Expenses',
								value: 'expenses',
								color: 'var(--chart-2)',
							},
							{
								key: 'profit',
								label: 'Profit',
								value: 'profit',
								color: 'var(--chart-3)',
							},
						]}
						axis={true}
					>
						{#snippet tooltip()}
							<ChartTooltip />
						{/snippet}
					</AreaChart>
				</ChartContainer>
			</div>
		</div>
	{/snippet}
</Story>

<Story name="Bar Chart">
	{#snippet template()}
		<div class="w-full p-6">
			<ChartContainer config={singleSeriesConfig} class="h-56 w-full">
				<BarChart
					data={weeklyData}
					x="date"
					y="revenue"
					xScale={scaleBand().padding(0.2)}
					axis={true}
					props={{ bars: { stroke: 'none', radius: 4 } }}
				>
					{#snippet tooltip()}
						<ChartTooltip />
					{/snippet}
				</BarChart>
			</ChartContainer>
		</div>
	{/snippet}
</Story>

<Story name="Area Chart">
	{#snippet template()}
		<div class="w-full p-6">
			<ChartContainer config={multiSeriesConfig} class="h-56 w-full">
				<AreaChart
					data={monthlyData}
					x="month"
					series={[
						{
							key: 'revenue',
							label: 'Revenue',
							value: 'revenue',
							color: 'var(--chart-1)',
						},
						{
							key: 'expenses',
							label: 'Expenses',
							value: 'expenses',
							color: 'var(--chart-2)',
						},
						{
							key: 'profit',
							label: 'Profit',
							value: 'profit',
							color: 'var(--chart-3)',
						},
					]}
					axis={true}
				>
					{#snippet tooltip()}
						<ChartTooltip />
					{/snippet}
				</AreaChart>
			</ChartContainer>
		</div>
	{/snippet}
</Story>

<Story name="Multi-Series Stacked">
	{#snippet template()}
		<div class="w-full p-6">
			<ChartContainer config={multiSeriesConfig} class="h-56 w-full">
				<BarChart
					data={monthlyData}
					x="month"
					series={[
						{
							key: 'revenue',
							label: 'Revenue',
							value: 'revenue',
							color: 'var(--chart-1)',
						},
						{
							key: 'expenses',
							label: 'Expenses',
							value: 'expenses',
							color: 'var(--chart-2)',
						},
					]}
					seriesLayout="stack"
					xScale={scaleBand().padding(0.2)}
					axis={true}
					props={{ bars: { stroke: 'none', radius: 4 } }}
				>
					{#snippet tooltip()}
						<ChartTooltip />
					{/snippet}
				</BarChart>
			</ChartContainer>
		</div>
	{/snippet}
</Story>

<Story name="With Custom Colors">
	{#snippet template()}
		{@const customConfig = {
			revenue: {
				label: 'Revenue',
				theme: {
					light: 'oklch(0.6 0.17 145)',
					dark: 'oklch(0.7 0.17 145)',
				},
			},
		} satisfies ChartConfig}
		<div class="w-full p-6">
			<ChartContainer config={customConfig} class="h-56 w-full">
				<BarChart
					data={weeklyData}
					x="date"
					y="revenue"
					xScale={scaleBand().padding(0.2)}
					axis={true}
					props={{ bars: { stroke: 'none', radius: 4 } }}
				>
					{#snippet tooltip()}
						<ChartTooltip />
					{/snippet}
				</BarChart>
			</ChartContainer>
		</div>
	{/snippet}
</Story>
