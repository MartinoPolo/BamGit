<script lang="ts">
	import OverviewCostUsagePanel from './OverviewCostUsagePanel.svelte';
	import OverviewRecentActivityPanel from './OverviewRecentActivityPanel.svelte';
	import type { UsageDashboardData } from '$lib/types/generated';
	import type {
		OverviewWorkspaceActivity,
		OverviewWorkspaceTotals,
	} from '$lib/modules/overview/overview_summary.js';

	interface Props {
		usageData: UsageDashboardData | null;
		cacheSavingsEstimate: number;
		maxToolCallCount: number;
		maxTrendCost: number;
		formatCost?: (amountUsd: number) => string;
		activities: OverviewWorkspaceActivity[];
		totals: OverviewWorkspaceTotals;
		formatRelativeTime: (isoString: string | null) => string;
		onOpenUsage: () => void;
		onOpenWorkspace: (dashboardId: string) => void;
	}

	let {
		usageData,
		cacheSavingsEstimate,
		maxToolCallCount,
		maxTrendCost,
		formatCost,
		activities,
		totals,
		formatRelativeTime,
		onOpenUsage,
		onOpenWorkspace,
	}: Props = $props();
</script>

<div
	class="mt-auto grid grid-cols-[minmax(0,1.35fr)_minmax(300px,0.65fr)] gap-4 pt-7 max-lg:grid-cols-1"
>
	<OverviewCostUsagePanel
		{usageData}
		{cacheSavingsEstimate}
		{maxToolCallCount}
		{maxTrendCost}
		{formatCost}
		{onOpenUsage}
	/>
	<OverviewRecentActivityPanel {activities} {totals} {formatRelativeTime} {onOpenWorkspace} />
</div>
