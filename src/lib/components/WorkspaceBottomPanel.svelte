<script lang="ts">
	import * as m from '$lib/paraglide/messages.js';
	import type { Issue, IssueCardCallbacks } from '$lib/modules/issues';
	import type {
		Action,
		GitStatusCache,
		IssueDependency,
		GhCliAvailability,
		AssignedIssue,
	} from '$lib/types/generated';
	import type { TreeVisualization } from '$lib/modules/visualization';
	import {
		useSelection,
		BOTTOM_PANEL_TABS,
		BOTTOM_PANEL_TAB_LABELS,
		computeStageCounts,
	} from '$lib/modules/board';
	import type { BottomPanelTab } from '$lib/modules/board';
	import * as Tabs from '$lib/components/ui/tabs/index.js';
	import PrdOverview from './PrdOverview.svelte';
	import DependencyGraphView from './DependencyGraphView.svelte';
	import IssueCardList from './IssueCardList.svelte';
	import GhSetupBanner from './GhSetupBanner.svelte';
	import AssignedIssuesPanel from './AssignedIssuesPanel.svelte';
	import ScissorsIcon from '@lucide/svelte/icons/scissors';
	import { Button } from '$lib/components/ui/button/index.js';

	interface Props extends IssueCardCallbacks {
		issues: readonly Issue[];
		parentIssues: Issue[];
		archivedIssues: Issue[];
		showArchived: boolean;
		isPortfolio: boolean;
		actions?: Action[];
		forceExpanded?: boolean;
		cacheMap?: Map<string, GitStatusCache>;
		ghAvailable?: boolean;
		dependencies: readonly IssueDependency[];
		ghSetupBanner?: boolean;
		ghAvailability?: GhCliAvailability;
		assignedIssues?: AssignedIssue[];
		isGhAvailable?: boolean;
		getVisualization: (issueId: string) => TreeVisualization | undefined;
		getChildren: (parentId: string) => Issue[];
		getNotificationDotColor?: (issueId: string) => string | null;
		getProgressLines?: (issueId: string) => readonly string[];
		onQuickAdd?: (issue: AssignedIssue) => void;
		onPrune?: () => void;
	}

	let {
		issues,
		parentIssues,
		archivedIssues,
		showArchived,
		isPortfolio,
		actions = [],
		forceExpanded,
		cacheMap = new Map(),
		ghAvailable = false,
		dependencies,
		ghSetupBanner = false,
		ghAvailability,
		assignedIssues = [],
		isGhAvailable = false,
		getVisualization,
		getChildren,
		getNotificationDotColor,
		getProgressLines,
		onArchive,
		onUnarchive,
		onEdit,
		onDelete,
		onChangePriority,
		onRename,
		onSetupWorktree,
		onRemoveWorktree,
		onExecuteAction,
		onQuickAdd,
		onPrune,
	}: Props = $props();

	const selection = useSelection();

	const tabValues = Object.values(BOTTOM_PANEL_TABS);

	const prdIssue = $derived(issues.find((issue) => issue.id === selection.prdIssueId) ?? null);

	const prdVisualization = $derived.by(() => {
		if (prdIssue === null) {
			return null;
		}
		const visualization = getVisualization(prdIssue.id);
		if (visualization?.kind === 'oak') {
			return visualization;
		}
		return null;
	});

	const stageCounts = $derived.by(() => {
		const visualizations: Array<{ kind: string; stage?: string }> = [];
		for (const issue of issues) {
			const visualization = getVisualization(issue.id);
			if (visualization === undefined) {
				continue;
			}
			if (visualization.kind === 'tree') {
				visualizations.push({ kind: 'tree', stage: visualization.config.stage });
			} else if (visualization.kind === 'potted-plant') {
				visualizations.push({ kind: 'potted-plant', stage: visualization.stage });
			} else {
				visualizations.push({ kind: visualization.kind });
			}
		}
		return computeStageCounts(visualizations);
	});

	function handleTabClick(tab: BottomPanelTab) {
		if (selection.activeTab === tab) {
			selection.setActiveTab(null);
		} else {
			selection.setActiveTab(tab);
		}
	}

	const selectedIssue = $derived(
		selection.selectedIssueId !== null
			? (issues.find((issue) => issue.id === selection.selectedIssueId) ?? null)
			: null,
	);

	const defaultTab = $derived(selection.activeTab ?? BOTTOM_PANEL_TABS.issues);
</script>

<div class="flex h-full flex-col">
	<div class="shrink-0 border-b border-border px-2 pt-1">
		<Tabs.Root>
			{#each tabValues as tab (tab)}
				<Tabs.Tab active={defaultTab === tab} onclick={() => handleTabClick(tab)}>
					{BOTTOM_PANEL_TAB_LABELS[tab]}
				</Tabs.Tab>
			{/each}
		</Tabs.Root>
	</div>

	<div class="flex-1 overflow-auto">
		{#if selection.showPrdOverview && defaultTab !== BOTTOM_PANEL_TABS.issues && defaultTab !== BOTTOM_PANEL_TABS.kanban}
			<PrdOverview
				title={prdIssue?.name ?? 'Workspace'}
				completionRatio={prdVisualization?.completionRatio ?? 0}
				issueCount={prdVisualization?.issueCount ?? issues.length}
				{stageCounts}
			/>
		{:else if defaultTab === BOTTOM_PANEL_TABS.issues}
			<div class="flex flex-col gap-4 p-5">
				{#if ghSetupBanner && ghAvailability}
					<GhSetupBanner availability={ghAvailability} />
				{/if}

				<div class="flex items-center justify-between">
					<div></div>
					{#if onPrune}
						<Button
							variant="ghost"
							size="sm"
							title={m.topbar_prune_title()}
							onclick={onPrune}
						>
							<ScissorsIcon size={12} />
							<span>{m.topbar_prune()}</span>
						</Button>
					{/if}
				</div>

				<IssueCardList
					{parentIssues}
					{archivedIssues}
					{showArchived}
					{isPortfolio}
					{actions}
					{forceExpanded}
					{cacheMap}
					{ghAvailable}
					{getChildren}
					{getNotificationDotColor}
					{getProgressLines}
					{onArchive}
					{onUnarchive}
					{onEdit}
					{onDelete}
					{onChangePriority}
					{onRename}
					{onSetupWorktree}
					{onRemoveWorktree}
					{onExecuteAction}
				/>

				{#if assignedIssues.length > 0}
					<AssignedIssuesPanel
						issues={assignedIssues}
						disabled={isGhAvailable !== true}
						{onQuickAdd}
					/>
				{/if}
			</div>
		{:else if defaultTab === BOTTOM_PANEL_TABS.kanban}
			<div class="p-4">
				<p class="text-sm text-muted-foreground">{m.kanban_coming_soon()}</p>
			</div>
		{:else if defaultTab === BOTTOM_PANEL_TABS.issueDetail}
			<div class="p-4">
				{#if selectedIssue}
					<div class="flex flex-col gap-2">
						<h3 class="text-sm font-semibold text-foreground">{selectedIssue.name}</h3>
						<p class="text-xs text-muted-foreground">
							Status: {selectedIssue.status} · Priority: {selectedIssue.priority ??
								'none'}
						</p>
					</div>
				{:else}
					<p class="text-sm text-muted-foreground">Select an issue to view details</p>
				{/if}
			</div>
		{:else if defaultTab === BOTTOM_PANEL_TABS.dependencies}
			<DependencyGraphView {issues} {dependencies} {getVisualization} />
		{:else if defaultTab === BOTTOM_PANEL_TABS.activity}
			<div class="p-4">
				<p class="text-sm text-muted-foreground">Activity feed coming soon</p>
			</div>
		{:else if defaultTab === BOTTOM_PANEL_TABS.session}
			<div class="p-4">
				<p class="text-sm text-muted-foreground">Session view coming soon</p>
			</div>
		{:else}
			<PrdOverview
				title={prdIssue?.name ?? 'Workspace'}
				completionRatio={prdVisualization?.completionRatio ?? 0}
				issueCount={prdVisualization?.issueCount ?? issues.length}
				{stageCounts}
			/>
		{/if}
	</div>
</div>
