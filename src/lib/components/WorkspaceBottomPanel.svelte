<script lang="ts">
	import type { Issue } from '$lib/modules/issues';
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

	interface Props {
		issues: readonly Issue[];
		getVisualization: (issueId: string) => TreeVisualization | undefined;
	}

	let { issues, getVisualization }: Props = $props();

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
</script>

<div class="flex h-full flex-col">
	<div class="shrink-0 border-b border-border px-2 pt-1">
		<Tabs.Root>
			{#each tabValues as tab (tab)}
				<Tabs.Tab active={selection.activeTab === tab} onclick={() => handleTabClick(tab)}>
					{BOTTOM_PANEL_TAB_LABELS[tab]}
				</Tabs.Tab>
			{/each}
		</Tabs.Root>
	</div>

	<div class="flex-1 overflow-auto">
		{#if selection.showPrdOverview}
			<PrdOverview
				title={prdIssue?.name ?? 'Workspace'}
				completionRatio={prdVisualization?.completionRatio ?? 0}
				issueCount={prdVisualization?.issueCount ?? issues.length}
				{stageCounts}
			/>
		{:else if selection.activeTab === BOTTOM_PANEL_TABS.issueDetail}
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
		{:else if selection.activeTab === BOTTOM_PANEL_TABS.dependencies}
			<div class="p-4">
				<p class="text-sm text-muted-foreground">Dependencies view coming soon</p>
			</div>
		{:else if selection.activeTab === BOTTOM_PANEL_TABS.activity}
			<div class="p-4">
				<p class="text-sm text-muted-foreground">Activity feed coming soon</p>
			</div>
		{:else if selection.activeTab === BOTTOM_PANEL_TABS.session}
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
