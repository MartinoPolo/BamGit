<script lang="ts">
	import * as m from '$lib/paraglide/messages.js';
	import type { Issue, IssueCardCallbacks } from '$lib/modules/issues';
	import type {
		AssignedIssue,
		GhAuthStatus,
		GitStatusCache,
		IssueDependency,
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
	import IssueDetail from './IssueDetail.svelte';
	import GhSetupBanner from './GhSetupBanner.svelte';
	import AssignedIssuesPanel from './AssignedIssuesPanel.svelte';

	// fallow-ignore-next-line code-duplication
	interface Props extends IssueCardCallbacks {
		issues: readonly Issue[];
		parentIssues: Issue[];
		archivedIssues: Issue[];
		showArchived: boolean;
		isPortfolio: boolean;
		cacheMap?: Map<string, GitStatusCache>;
		ghAvailable?: boolean;
		prioritiesEnabled?: boolean;
		paletteColors?: string[];
		usedColors?: string[];
		dependencies: readonly IssueDependency[];
		authStatus?: GhAuthStatus;
		onconnect?: () => void;
		assignedIssues?: AssignedIssue[];
		assignedIssuesHasMore?: boolean;
		deletedAssignedIssueNumbers?: readonly number[];
		getVisualization: (issueId: string) => TreeVisualization | undefined;
		getChildren: (parentId: string) => Issue[];
		getNotificationDotColor?: (issueId: string) => string | null;
		onWizardOpen?: (issue: AssignedIssue) => void;
		onQuickAddWithWorktree?: (issue: AssignedIssue) => void;
		onLoadMoreAssignedIssues?: () => void;
		onPrune?: () => void;
	}

	let {
		issues,
		parentIssues,
		archivedIssues,
		showArchived,
		isPortfolio,
		cacheMap = new Map(),
		ghAvailable = false,
		prioritiesEnabled = true,
		paletteColors = [],
		usedColors = [],
		dependencies,
		authStatus,
		onconnect,
		assignedIssues = [],
		assignedIssuesHasMore = false,
		deletedAssignedIssueNumbers = [],
		getVisualization,
		getChildren,
		getNotificationDotColor,
		onArchive,
		onUnarchive,
		onEdit,
		onDelete,
		onChangePriority,
		onRename,
		onSetupWorktree,
		onRemoveWorktree,
		onExecuteAction,
		onChangeColor,
		onWizardOpen,
		onQuickAddWithWorktree,
		onLoadMoreAssignedIssues,
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
		selection.activeIssueId !== null
			? (issues.find((issue) => issue.id === selection.activeIssueId) ?? null)
			: null,
	);

	const defaultTab = $derived(selection.activeTab ?? BOTTOM_PANEL_TABS.issues);

	const shouldShowPrdOverview = $derived(
		selection.showPrdOverview &&
			defaultTab !== BOTTOM_PANEL_TABS.issues &&
			defaultTab !== BOTTOM_PANEL_TABS.kanban,
	);
</script>

<div class="flex h-full flex-col">
	<div class="flex shrink-0 justify-center px-2 pt-1">
		<Tabs.Root>
			{#each tabValues as tab (tab)}
				<Tabs.Tab active={defaultTab === tab} onclick={() => handleTabClick(tab)}>
					{BOTTOM_PANEL_TAB_LABELS[tab]}
				</Tabs.Tab>
			{/each}
		</Tabs.Root>
	</div>

	<div class="flex-1 overflow-auto">
		{#if shouldShowPrdOverview}
			<PrdOverview
				title={prdIssue?.name ?? 'Workspace'}
				completionRatio={prdVisualization?.completionRatio ?? 0}
				issueCount={prdVisualization?.issueCount ?? issues.length}
				{stageCounts}
			/>
		{:else if defaultTab === BOTTOM_PANEL_TABS.issues}
			<div class="flex flex-col gap-4 px-5 pt-3 pb-5">
				{#if authStatus && authStatus.status === 'not-connected'}
					<GhSetupBanner {authStatus} {onconnect} />
				{/if}

				<IssueCardList
					{parentIssues}
					{archivedIssues}
					{showArchived}
					{isPortfolio}
					{cacheMap}
					{ghAvailable}
					{prioritiesEnabled}
					{getChildren}
					{getNotificationDotColor}
					{getVisualization}
					{onArchive}
					{onUnarchive}
					{onEdit}
					{onDelete}
					{onChangePriority}
					{onRename}
					{onSetupWorktree}
					{onRemoveWorktree}
					{onExecuteAction}
					{onChangeColor}
					onBatchPrune={onPrune ? () => onPrune!() : undefined}
				/>

				{#if assignedIssues.length > 0}
					<AssignedIssuesPanel
						issues={assignedIssues}
						dashboardIssues={issues}
						deletedIssueNumbers={deletedAssignedIssueNumbers}
						hasMore={assignedIssuesHasMore}
						disabled={!ghAvailable}
						{onWizardOpen}
						{onQuickAddWithWorktree}
						onLoadMore={onLoadMoreAssignedIssues}
					/>
				{/if}
			</div>
		{:else if defaultTab === BOTTOM_PANEL_TABS.kanban}
			<div class="p-4">
				<p class="text-sm text-muted-foreground">{m.kanban_coming_soon()}</p>
			</div>
		{:else if defaultTab === BOTTOM_PANEL_TABS.issueDetail}
			{#if selectedIssue}
				<IssueDetail
					issue={selectedIssue}
					cache={cacheMap.get(selectedIssue.id)}
					{ghAvailable}
					{paletteColors}
					{usedColors}
					{onArchive}
					{onUnarchive}
					{onEdit}
					{onDelete}
					{onChangePriority}
					{onRename}
					{onSetupWorktree}
					{onRemoveWorktree}
					{onChangeColor}
				/>
			{:else}
				<div class="p-4">
					<p class="text-sm text-muted-foreground">{m.issue_detail_no_selection()}</p>
				</div>
			{/if}
		{:else if defaultTab === BOTTOM_PANEL_TABS.dependencies}
			<DependencyGraphView {issues} {dependencies} />
		{:else if defaultTab === BOTTOM_PANEL_TABS.activity}
			<div class="p-4">
				<p class="text-sm text-muted-foreground">Activity feed coming soon</p>
			</div>
		{:else if defaultTab === BOTTOM_PANEL_TABS.session}
			<div class="p-4">
				<p class="text-sm text-muted-foreground">Session view coming soon</p>
			</div>
		{/if}
	</div>
</div>
