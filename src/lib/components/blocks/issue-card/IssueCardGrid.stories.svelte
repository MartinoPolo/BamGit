<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import { expect, waitFor } from 'storybook/test';
	import IssueCardGrid from './IssueCardGrid.svelte';

	const { Story } = defineMeta({
		title: 'Blocks/IssueCard/IssueCardGrid',
		component: IssueCardGrid,
		tags: ['autodocs'],
	});

	/** Verify multiple issue cards render — list-level rendering smoke test. */
	const playRendersMultipleCards = async ({ canvasElement }: { canvasElement: HTMLElement }) => {
		// Wait for the responsive grid to appear and contain multiple card wrappers
		await waitFor(() => {
			const grid = canvasElement.querySelector(
				'div[style*="grid-template-columns"]',
			) as HTMLElement | null;
			expect(grid).toBeInTheDocument();
			expect((grid as HTMLElement).children.length).toBeGreaterThan(1);
		});

		// The outermost list container must still be visible
		await expect(canvasElement.querySelector('div.outline-none')).toBeInTheDocument();
	};

	/** Verify clicking a card does not throw and the list remains stable. */
	const playCardClickStable = async ({ canvasElement }: { canvasElement: HTMLElement }) => {
		await waitFor(() => {
			const grid = canvasElement.querySelector('div[style*="grid-template-columns"]');
			expect(grid).toBeInTheDocument();
			expect((grid as HTMLElement).children.length).toBeGreaterThan(0);
		});

		const grid = canvasElement.querySelector(
			'div[style*="grid-template-columns"]',
		) as HTMLElement;
		const firstCardWrapper = grid.children[0] as HTMLElement;

		// Click first card — should not throw; selection state is internal
		firstCardWrapper.click();

		// List must still be in the DOM after the click
		await waitFor(() => {
			expect(grid).toBeInTheDocument();
		});
	};

	/** Clicking the grid background (not a card) should not propagate errors. */
	const playGridBackgroundClick = async ({ canvasElement }: { canvasElement: HTMLElement }) => {
		await waitFor(() => {
			const grid = canvasElement.querySelector('div[style*="grid-template-columns"]');
			expect(grid).toBeInTheDocument();
		});

		const grid = canvasElement.querySelector(
			'div[style*="grid-template-columns"]',
		) as HTMLElement;

		// Dispatch a click directly on the grid background element
		grid.dispatchEvent(
			new MouseEvent('click', { bubbles: true, target: grid } as MouseEventInit),
		);

		// The list must still be present — no unmounting due to the click
		await waitFor(() => {
			expect(grid).toBeInTheDocument();
		});
	};
</script>

<script lang="ts">
	import { fn } from 'storybook/test';
	import type { Issue } from '$lib/modules/issues';
	import { MOCK_ISSUES } from '$lib/tauri_mock_data.js';
	import IssueCardGridStoryWrapper from './IssueCardGridStoryWrapper.svelte';

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
		<IssueCardGridStoryWrapper>
			<IssueCardGrid
				parentIssues={allIssues}
				archivedIssues={[]}
				showArchived={false}
				isPortfolio={false}
				getChildren={getChildrenStub}
				getNotificationDotColor={getNotificationDotColorStub}
				getVisualization={getVisualizationStub}
				{...callbacks}
			/>
		</IssueCardGridStoryWrapper>
	{/snippet}
</Story>

<Story name="Empty List">
	{#snippet template()}
		<IssueCardGridStoryWrapper>
			<IssueCardGrid
				parentIssues={[]}
				archivedIssues={[]}
				showArchived={false}
				isPortfolio={false}
				getChildren={getChildrenStub}
				getNotificationDotColor={getNotificationDotColorStub}
				getVisualization={getVisualizationStub}
				{...callbacks}
			/>
		</IssueCardGridStoryWrapper>
	{/snippet}
</Story>

<Story name="Single Issue">
	{#snippet template()}
		<IssueCardGridStoryWrapper>
			<IssueCardGrid
				parentIssues={singleIssue}
				archivedIssues={[]}
				showArchived={false}
				isPortfolio={false}
				getChildren={getChildrenStub}
				getNotificationDotColor={getNotificationDotColorStub}
				getVisualization={getVisualizationStub}
				{...callbacks}
			/>
		</IssueCardGridStoryWrapper>
	{/snippet}
</Story>

<Story name="With Archived Issues">
	{#snippet template()}
		<IssueCardGridStoryWrapper>
			<IssueCardGrid
				parentIssues={allIssues}
				{archivedIssues}
				showArchived={true}
				isPortfolio={false}
				getChildren={getChildrenStub}
				getNotificationDotColor={getNotificationDotColorStub}
				getVisualization={getVisualizationStub}
				{...callbacks}
			/>
		</IssueCardGridStoryWrapper>
	{/snippet}
</Story>

<Story name="Portfolio Mode">
	{#snippet template()}
		<IssueCardGridStoryWrapper>
			<IssueCardGrid
				parentIssues={allIssues}
				archivedIssues={[]}
				showArchived={false}
				isPortfolio={true}
				getChildren={getChildrenStub}
				getNotificationDotColor={getNotificationDotColorStub}
				getVisualization={getVisualizationStub}
				{...callbacks}
			/>
		</IssueCardGridStoryWrapper>
	{/snippet}
</Story>

<Story
	name="List Renders Multiple Cards [play: list renders cards]"
	play={playRendersMultipleCards}
>
	{#snippet template()}
		<IssueCardGridStoryWrapper>
			<IssueCardGrid
				parentIssues={allIssues}
				archivedIssues={[]}
				showArchived={false}
				isPortfolio={false}
				getChildren={getChildrenStub}
				getNotificationDotColor={getNotificationDotColorStub}
				getVisualization={getVisualizationStub}
				{...callbacks}
			/>
		</IssueCardGridStoryWrapper>
	{/snippet}
</Story>

<Story
	name="Card Click Keeps List Stable [play: card click keeps list stable]"
	play={playCardClickStable}
>
	{#snippet template()}
		<IssueCardGridStoryWrapper>
			<IssueCardGrid
				parentIssues={allIssues}
				archivedIssues={[]}
				showArchived={false}
				isPortfolio={false}
				getChildren={getChildrenStub}
				getNotificationDotColor={getNotificationDotColorStub}
				getVisualization={getVisualizationStub}
				{...callbacks}
			/>
		</IssueCardGridStoryWrapper>
	{/snippet}
</Story>

<Story
	name="Grid Background Click No Propagation [play: grid bg click no propagation]"
	play={playGridBackgroundClick}
>
	{#snippet template()}
		<IssueCardGridStoryWrapper>
			<IssueCardGrid
				parentIssues={allIssues}
				archivedIssues={[]}
				showArchived={false}
				isPortfolio={false}
				getChildren={getChildrenStub}
				getNotificationDotColor={getNotificationDotColorStub}
				getVisualization={getVisualizationStub}
				{...callbacks}
			/>
		</IssueCardGridStoryWrapper>
	{/snippet}
</Story>
