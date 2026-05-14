<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import IssueCardList from './IssueCardList.svelte';

	const { Story } = defineMeta({
		title: 'Blocks/Issue/IssueCardList',
		component: IssueCardList,
		tags: ['autodocs'],
	});
</script>

<script lang="ts">
	import { fn } from 'storybook/test';
	import type { Issue } from '$lib/modules/issues';
	import { MOCK_ISSUES } from '$lib/tauri_mock_data.js';
	import IssueCardListStoryWrapper from './IssueCardListStoryWrapper.svelte';

	function parseMockIssue(raw: (typeof MOCK_ISSUES)[number]): Issue {
		return {
			...raw,
			labels: typeof raw.labels === 'string' ? JSON.parse(raw.labels) : (raw.labels ?? []),
		} as Issue;
	}

	const allIssues = MOCK_ISSUES.map(parseMockIssue);
	const singleIssue = [allIssues[0]];

	const archivedIssues: Issue[] = allIssues.slice(0, 2).map((issue) => ({
		...issue,
		id: `archived-${issue.id}`,
		status: 'archived' as const,
		name: `[Archived] ${issue.name}`,
	}));

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
		onBatchArchive: fn(),
		onBatchUnarchive: fn(),
		onBatchDelete: fn(),
		onBatchChangePriority: fn(),
		onBatchPrune: fn(),
	};

	function getChildrenStub(): Issue[] {
		return [];
	}

	function getNotificationDotColorStub(): string | null {
		return null;
	}

	function getVisualizationStub() {
		return undefined;
	}
</script>

<Story name="Full List">
	{#snippet template()}
		<IssueCardListStoryWrapper>
			<IssueCardList
				parentIssues={allIssues}
				archivedIssues={[]}
				showArchived={false}
				isPortfolio={false}
				getChildren={getChildrenStub}
				getNotificationDotColor={getNotificationDotColorStub}
				getVisualization={getVisualizationStub}
				{...callbacks}
			/>
		</IssueCardListStoryWrapper>
	{/snippet}
</Story>

<Story name="Empty List">
	{#snippet template()}
		<IssueCardListStoryWrapper>
			<IssueCardList
				parentIssues={[]}
				archivedIssues={[]}
				showArchived={false}
				isPortfolio={false}
				getChildren={getChildrenStub}
				getNotificationDotColor={getNotificationDotColorStub}
				getVisualization={getVisualizationStub}
				{...callbacks}
			/>
		</IssueCardListStoryWrapper>
	{/snippet}
</Story>

<Story name="Single Issue">
	{#snippet template()}
		<IssueCardListStoryWrapper>
			<IssueCardList
				parentIssues={singleIssue}
				archivedIssues={[]}
				showArchived={false}
				isPortfolio={false}
				getChildren={getChildrenStub}
				getNotificationDotColor={getNotificationDotColorStub}
				getVisualization={getVisualizationStub}
				{...callbacks}
			/>
		</IssueCardListStoryWrapper>
	{/snippet}
</Story>

<Story name="With Archived Issues">
	{#snippet template()}
		<IssueCardListStoryWrapper>
			<IssueCardList
				parentIssues={allIssues}
				{archivedIssues}
				showArchived={true}
				isPortfolio={false}
				getChildren={getChildrenStub}
				getNotificationDotColor={getNotificationDotColorStub}
				getVisualization={getVisualizationStub}
				{...callbacks}
			/>
		</IssueCardListStoryWrapper>
	{/snippet}
</Story>

<Story name="Portfolio Mode">
	{#snippet template()}
		<IssueCardListStoryWrapper>
			<IssueCardList
				parentIssues={allIssues}
				archivedIssues={[]}
				showArchived={false}
				isPortfolio={true}
				getChildren={getChildrenStub}
				getNotificationDotColor={getNotificationDotColorStub}
				getVisualization={getVisualizationStub}
				{...callbacks}
			/>
		</IssueCardListStoryWrapper>
	{/snippet}
</Story>
