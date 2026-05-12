<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import CostChart from './CostChart.svelte';
	import { CHART_COLOR_THEMES, GROUP_BY_OPTIONS } from '$lib/modules/usage/usage_types.js';
	import type { TimeBucketCost, GroupedCostEntry } from '$lib/types/generated/index.js';

	const mockDailyData: TimeBucketCost[] = [
		{ date: '2024-04-24', cost_usd: 1.2, session_count: 3 },
		{ date: '2024-04-25', cost_usd: 3.5, session_count: 7 },
		{ date: '2024-04-26', cost_usd: 0.8, session_count: 2 },
		{ date: '2024-04-27', cost_usd: 2.1, session_count: 5 },
		{ date: '2024-04-28', cost_usd: 4.7, session_count: 9 },
		{ date: '2024-04-29', cost_usd: 1.9, session_count: 4 },
		{ date: '2024-04-30', cost_usd: 6.3, session_count: 12 },
		{ date: '2024-05-01', cost_usd: 2.4, session_count: 6 },
		{ date: '2024-05-02', cost_usd: 0.5, session_count: 1 },
		{ date: '2024-05-03', cost_usd: 3.8, session_count: 8 },
		{ date: '2024-05-04', cost_usd: 5.1, session_count: 10 },
		{ date: '2024-05-05', cost_usd: 1.7, session_count: 4 },
		{ date: '2024-05-06', cost_usd: 2.9, session_count: 6 },
		{ date: '2024-05-07', cost_usd: 4.2, session_count: 8 },
	];

	const mockGroupedData: GroupedCostEntry[] = [
		{ date: '2024-05-01', group: 'claude', cost_usd: 1.8, session_count: 4 },
		{ date: '2024-05-01', group: 'codex', cost_usd: 0.6, session_count: 2 },
		{ date: '2024-05-02', group: 'claude', cost_usd: 0.3, session_count: 1 },
		{ date: '2024-05-02', group: 'codex', cost_usd: 0.2, session_count: 1 },
		{ date: '2024-05-03', group: 'claude', cost_usd: 2.5, session_count: 5 },
		{ date: '2024-05-03', group: 'codex', cost_usd: 1.3, session_count: 3 },
		{ date: '2024-05-04', group: 'claude', cost_usd: 3.1, session_count: 6 },
		{ date: '2024-05-04', group: 'codex', cost_usd: 2.0, session_count: 4 },
		{ date: '2024-05-05', group: 'claude', cost_usd: 1.1, session_count: 3 },
		{ date: '2024-05-05', group: 'codex', cost_usd: 0.6, session_count: 2 },
		{ date: '2024-05-06', group: 'claude', cost_usd: 1.9, session_count: 4 },
		{ date: '2024-05-06', group: 'codex', cost_usd: 1.0, session_count: 2 },
		{ date: '2024-05-07', group: 'claude', cost_usd: 2.7, session_count: 5 },
		{ date: '2024-05-07', group: 'codex', cost_usd: 1.5, session_count: 3 },
	];

	const { Story } = defineMeta({
		title: 'Blocks/Usage/CostChart',
		component: CostChart,
		tags: ['autodocs'],
	});
</script>

<Story name="UngroupedMonochrome">
	{#snippet template()}
		<div class="p-8">
			<CostChart
				data={mockDailyData}
				groupedData={[]}
				colorTheme={CHART_COLOR_THEMES.monochrome}
				groupBy={GROUP_BY_OPTIONS.none}
				period="thirty-days"
			/>
		</div>
	{/snippet}
</Story>

<Story name="UngroupedTraffic Light">
	{#snippet template()}
		<div class="p-8">
			<CostChart
				data={mockDailyData}
				groupedData={[]}
				colorTheme={CHART_COLOR_THEMES.trafficLight}
				groupBy={GROUP_BY_OPTIONS.none}
				period="thirty-days"
			/>
		</div>
	{/snippet}
</Story>

<Story name="UngroupedGradient">
	{#snippet template()}
		<div class="p-8">
			<CostChart
				data={mockDailyData}
				groupedData={[]}
				colorTheme={CHART_COLOR_THEMES.gradient}
				groupBy={GROUP_BY_OPTIONS.none}
				period="thirty-days"
			/>
		</div>
	{/snippet}
</Story>

<Story name="Grouped by Provider">
	{#snippet template()}
		<div class="p-8">
			<CostChart
				data={mockDailyData}
				groupedData={mockGroupedData}
				colorTheme={CHART_COLOR_THEMES.monochrome}
				groupBy={GROUP_BY_OPTIONS.provider}
				period="week"
			/>
		</div>
	{/snippet}
</Story>

<Story name="TodayHourly">
	{#snippet template()}
		<div class="p-8">
			<CostChart
				data={[
					{ date: '2024-05-07T08:00:00Z', cost_usd: 0.3, session_count: 1 },
					{ date: '2024-05-07T09:00:00Z', cost_usd: 0.8, session_count: 2 },
					{ date: '2024-05-07T10:00:00Z', cost_usd: 1.5, session_count: 3 },
					{ date: '2024-05-07T11:00:00Z', cost_usd: 0.6, session_count: 2 },
					{ date: '2024-05-07T12:00:00Z', cost_usd: 0.2, session_count: 1 },
					{ date: '2024-05-07T13:00:00Z', cost_usd: 2.1, session_count: 4 },
					{ date: '2024-05-07T14:00:00Z', cost_usd: 1.2, session_count: 3 },
				]}
				groupedData={[]}
				colorTheme={CHART_COLOR_THEMES.gradient}
				groupBy={GROUP_BY_OPTIONS.none}
				period="today"
			/>
		</div>
	{/snippet}
</Story>
