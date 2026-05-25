<script lang="ts">
	import { onMount } from 'svelte';
	import * as m from '$lib/paraglide/messages.js';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { openPath } from '$lib/opener.js';
	import { useBoard } from '$lib/modules/board';
	import { setUsageContext } from '$lib/modules/usage/usage.context.svelte.js';
	import { USAGE_SCOPES } from '$lib/modules/usage/usage_types.js';
	import { useVersionControl } from '$lib/modules/version-control';
	import { getOverviewData, openWorkspaceWindow } from '$lib/modules/window';
	import OverviewHeader from '$lib/components/blocks/overview/OverviewHeader.svelte';
	import OverviewToolbar from '$lib/components/blocks/overview/OverviewToolbar.svelte';
	import OverviewSummaryBasin from '$lib/components/blocks/overview/OverviewSummaryBasin.svelte';
	import OverviewWorkspaceGrid from '$lib/components/blocks/overview/OverviewWorkspaceGrid.svelte';
	import WorkspaceDeleteDialog from '$lib/components/blocks/workspace/WorkspaceDeleteDialog.svelte';
	import { setOverviewToolbarContext } from '$lib/components/blocks/overview/overview_toolbar.context.svelte.js';
	import {
		searchWorkspaces,
		filterWorkspaces,
		sortWorkspaces,
	} from '$lib/components/blocks/overview/overview_toolbar_types.js';
	import {
		calculateOverviewWorkspaceTotals,
		deriveRecentWorkspaceActivities,
		estimateMonthlyCacheSavings,
		getMaximumToolCallCount,
	} from '$lib/modules/overview/overview_summary.js';
	import { formatWorkspaceActivityRelativeTime } from '$lib/modules/overview/overview_time.js';
	import type { OverviewWorkspaceData } from '$lib/types/generated';

	const boardStore = useBoard();
	const versionControl = useVersionControl();
	const usageCtx = setUsageContext();
	const toolbar = setOverviewToolbarContext();

	usageCtx.scope.current = USAGE_SCOPES.global;
	usageCtx.activePeriod.current = 'thirty-days';

	let workspaces = $state.raw<OverviewWorkspaceData[]>([]);
	let loading = $state(true);
	let error = $state<string | null>(null);

	$effect(() => {
		void boardStore.dashboards;
		const includeArchived = toolbar.showArchived.current;
		void (async () => {
			loading = true;
			try {
				workspaces = await getOverviewData(includeArchived);
				error = null;
			} catch (err) {
				error = String(err);
			} finally {
				loading = false;
			}
		})();
	});

	onMount(() => {
		void usageCtx.loadData();
		return () => usageCtx.clearTimers();
	});

	const displayedWorkspaces = $derived.by(() => {
		const searched = searchWorkspaces(workspaces, toolbar.searchQuery.current);
		const filtered = filterWorkspaces(searched, toolbar.filterMode.current);
		return sortWorkspaces(filtered, toolbar.sortMode.current, toolbar.sortDirection.current);
	});

	const workspaceTotals = $derived(calculateOverviewWorkspaceTotals(workspaces));
	const recentWorkspaceActivities = $derived(deriveRecentWorkspaceActivities(workspaces, 4));
	const usageData = $derived(usageCtx.dashboardData.current);
	const maxToolCallCount = $derived(getMaximumToolCallCount(usageData?.tool_usage ?? []));
	const maxTrendCost = $derived(
		Math.max(...(usageData?.time_bucket_costs.map((entry) => entry.cost_usd) ?? []), 0.01),
	);
	const cacheSavingsEstimate = $derived(
		usageData
			? estimateMonthlyCacheSavings(
					usageData.stats.total_cost_usd,
					usageData.stats.cache_hit_ratio,
				)
			: 0,
	);

	let deleteTarget = $state<{ id: string; name: string } | null>(null);

	async function handleArchiveWorkspace(workspace: OverviewWorkspaceData) {
		try {
			await boardStore.archiveDashboard(workspace.dashboard_id);
		} catch (err) {
			console.error('Failed to archive workspace:', err);
		}
	}

	async function handleUnarchiveWorkspace(workspace: OverviewWorkspaceData) {
		try {
			await boardStore.unarchiveDashboard(workspace.dashboard_id);
		} catch (err) {
			console.error('Failed to unarchive workspace:', err);
		}
	}

	function handleDeleteWorkspace(workspace: OverviewWorkspaceData) {
		deleteTarget = { id: workspace.dashboard_id, name: workspace.name };
	}

	async function handleConfirmDeleteWorkspace() {
		if (deleteTarget === null) {
			return;
		}
		try {
			await boardStore.deleteDashboard(deleteTarget.id, deleteTarget.name);
		} catch (err) {
			console.error('Failed to delete workspace:', err);
		} finally {
			deleteTarget = null;
		}
	}

	async function handleOpenWorkspace(dashboardId: string) {
		try {
			await openWorkspaceWindow(dashboardId);
		} catch (err) {
			console.error('Failed to open workspace window:', err);
		}
	}

	function handleGithubClick(workspace: OverviewWorkspaceData) {
		if (workspace.github_repo == null) {
			handleConfigWizard(workspace.dashboard_id);
			return;
		}
		window.open(`https://github.com/${workspace.github_repo}`, '_blank');
	}

	function handleFolderClick(workspace: OverviewWorkspaceData) {
		if (workspace.local_folder == null) {
			handleConfigWizard(workspace.dashboard_id);
			return;
		}
		void openPath(workspace.local_folder);
	}

	function handleConfigWizard(_dashboardId: string) {
		console.info('Config wizard for', _dashboardId);
	}

	function openUsagePage() {
		void goto(resolve('/usage'));
	}
</script>

<div
	class="flex min-h-full bg-[radial-gradient(780px_380px_at_5%_16%,color-mix(in_oklch,var(--moss-500)_13%,transparent),transparent_72%),radial-gradient(620px_320px_at_72%_-4%,color-mix(in_oklch,var(--teal-500)_8%,transparent),transparent_66%),linear-gradient(180deg,color-mix(in_oklch,var(--surface)_32%,transparent),transparent_420px),var(--background)] px-10 pt-9.5 pb-16 max-md:px-4.5 max-md:py-6"
>
	<div
		class="mx-auto flex min-h-[calc(100vh-102px)] w-full max-w-[1840px] flex-col max-md:min-h-[calc(100vh-56px)]"
	>
		<OverviewHeader />

		<div class="mb-6">
			<OverviewToolbar
				{versionControl}
				filteredCount={displayedWorkspaces.length}
				totalCount={workspaces.length}
			/>
		</div>

		{#if loading}
			<p class="text-muted-foreground">{m.overview_loading()}</p>
		{:else if error !== null}
			<p class="text-destructive">{m.error_prefix({ message: error })}</p>
		{:else}
			<OverviewWorkspaceGrid
				workspaces={displayedWorkspaces}
				footerContent={toolbar.footerContent.current}
				onAddWorkspace={() => (boardStore.showCreateDialog = true)}
				onOpenWorkspace={handleOpenWorkspace}
				onGithubClick={handleGithubClick}
				onFolderClick={handleFolderClick}
				onConfigureWorkspace={handleConfigWizard}
				onArchive={handleArchiveWorkspace}
				onUnarchive={handleUnarchiveWorkspace}
				onDelete={handleDeleteWorkspace}
			/>

			<WorkspaceDeleteDialog
				open={deleteTarget !== null}
				workspaceName={deleteTarget?.name ?? ''}
				onconfirm={handleConfirmDeleteWorkspace}
				onclose={() => (deleteTarget = null)}
			/>

			<OverviewSummaryBasin
				{usageData}
				{cacheSavingsEstimate}
				{maxToolCallCount}
				{maxTrendCost}
				activities={recentWorkspaceActivities}
				totals={workspaceTotals}
				formatRelativeTime={formatWorkspaceActivityRelativeTime}
				onOpenUsage={openUsagePage}
				onOpenWorkspace={handleOpenWorkspace}
			/>
		{/if}
	</div>
</div>
