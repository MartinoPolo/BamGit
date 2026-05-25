<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import WorkspaceBottomPanel from './WorkspaceBottomPanel.svelte';

	const { Story } = defineMeta({
		title: 'Blocks/Layout/WorkspaceBottomPanel',
		component: WorkspaceBottomPanel,
		tags: ['autodocs'],
	});
</script>

<script lang="ts">
	import { fn } from 'storybook/test';
	import WorkspaceBottomPanelStoryWrapper from './WorkspaceBottomPanelStoryWrapper.svelte';
	import {
		MOCK_ISSUES,
		MOCK_ISSUE_DEPENDENCIES,
		MOCK_ASSIGNED_ISSUES_RESULT,
		MOCK_COLOR_PALETTES,
	} from '$lib/tauri_mock_data.js';
	import type { Issue } from '$lib/modules/issues';
	import type { TreeVisualization } from '$lib/modules/visualization';

	function parseMockIssue(raw: (typeof MOCK_ISSUES)[number]): Issue {
		return {
			...raw,
			labels: typeof raw.labels === 'string' ? JSON.parse(raw.labels) : (raw.labels ?? []),
		} as Issue;
	}

	const issues = MOCK_ISSUES.map(parseMockIssue);
	const parentIssues = issues.filter((issue) => issue.parent_issue_id === null);
	const paletteColors = MOCK_COLOR_PALETTES[0]?.colors ?? [];

	function getVisualization(): TreeVisualization | undefined {
		return undefined;
	}

	function getChildren(_parentId: string): Issue[] {
		return issues.filter((issue) => issue.parent_issue_id === _parentId);
	}

	function getNotificationDotColor(): string | null {
		return null;
	}

	const callbacks = {
		onArchive: fn(),
		onUnarchive: fn(),
		onEdit: fn(),
		onDelete: fn(),
		onChangePriority: fn(),
		onRename: fn(),
		onSetupWorktree: fn(),
		onRemoveWorktree: fn(),
		onExecuteAction: fn(),
		onChangeColor: fn(),
		onconnect: fn(),
		onWizardOpen: fn(),
		onQuickAddWithWorktree: fn(),
		onLoadMoreAssignedIssues: fn(),
		onRefreshAssignedIssues: fn(),
		onPrune: fn(),
	};
</script>

<Story name="Issues Tab (Default)">
	{#snippet template()}
		<WorkspaceBottomPanelStoryWrapper>
			<div class="h-[500px] w-[900px] border border-border">
				<WorkspaceBottomPanel
					{issues}
					{parentIssues}
					archivedIssues={[]}
					showArchived={false}
					ghAvailable={true}
					prioritiesEnabled={true}
					{paletteColors}
					usedColors={[]}
					dependencies={MOCK_ISSUE_DEPENDENCIES}
					{getVisualization}
					{getChildren}
					{getNotificationDotColor}
					{...callbacks}
				/>
			</div>
		</WorkspaceBottomPanelStoryWrapper>
	{/snippet}
</Story>

<Story name="Dependencies Tab">
	{#snippet template()}
		<WorkspaceBottomPanelStoryWrapper>
			<div class="h-[500px] w-[900px] border border-border">
				<WorkspaceBottomPanel
					{issues}
					{parentIssues}
					archivedIssues={[]}
					showArchived={false}
					ghAvailable={true}
					prioritiesEnabled={true}
					{paletteColors}
					usedColors={[]}
					dependencies={MOCK_ISSUE_DEPENDENCIES}
					{getVisualization}
					{getChildren}
					{getNotificationDotColor}
					{...callbacks}
				/>
			</div>
		</WorkspaceBottomPanelStoryWrapper>
	{/snippet}
</Story>

<Story name="Empty State">
	{#snippet template()}
		<WorkspaceBottomPanelStoryWrapper>
			<div class="h-[500px] w-[900px] border border-border">
				<WorkspaceBottomPanel
					issues={[]}
					parentIssues={[]}
					archivedIssues={[]}
					showArchived={false}
					ghAvailable={false}
					prioritiesEnabled={true}
					paletteColors={[]}
					usedColors={[]}
					dependencies={[]}
					{getVisualization}
					{getChildren}
					{getNotificationDotColor}
					{...callbacks}
				/>
			</div>
		</WorkspaceBottomPanelStoryWrapper>
	{/snippet}
</Story>

<Story name="With GitHub Setup Banner">
	{#snippet template()}
		<WorkspaceBottomPanelStoryWrapper>
			<div class="h-[500px] w-[900px] border border-border">
				<WorkspaceBottomPanel
					{issues}
					{parentIssues}
					archivedIssues={[]}
					showArchived={false}
					ghAvailable={false}
					prioritiesEnabled={true}
					{paletteColors}
					usedColors={[]}
					dependencies={MOCK_ISSUE_DEPENDENCIES}
					authStatus={{ status: 'not-connected' }}
					{getVisualization}
					{getChildren}
					{getNotificationDotColor}
					{...callbacks}
				/>
			</div>
		</WorkspaceBottomPanelStoryWrapper>
	{/snippet}
</Story>

<Story name="With Assigned Issues Panel">
	{#snippet template()}
		<WorkspaceBottomPanelStoryWrapper>
			<div class="h-[500px] w-[900px] border border-border">
				<WorkspaceBottomPanel
					{issues}
					{parentIssues}
					archivedIssues={[]}
					showArchived={false}
					ghAvailable={true}
					prioritiesEnabled={true}
					{paletteColors}
					usedColors={[]}
					dependencies={MOCK_ISSUE_DEPENDENCIES}
					assignedIssues={MOCK_ASSIGNED_ISSUES_RESULT.issues}
					assignedIssuesHasMore={false}
					assignedIssuesLoading={false}
					assignedIssuesLastSynced={new Date(Date.now() - 30_000)}
					{getVisualization}
					{getChildren}
					{getNotificationDotColor}
					{...callbacks}
				/>
			</div>
		</WorkspaceBottomPanelStoryWrapper>
	{/snippet}
</Story>
