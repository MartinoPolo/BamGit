<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import { expect, fn, userEvent, within } from 'storybook/test';
	import WorkspaceCard from './WorkspaceCard.svelte';
	import { MOCK_OVERVIEW_DATA } from '$lib/tauri_mock_data.js';
	import type { OverviewWorkspaceData } from '$lib/types/generated';

	const { Story } = defineMeta({
		title: 'Blocks/WorkspaceCard/WorkspaceCard',
		component: WorkspaceCard,
		tags: ['autodocs'],
	});

	const base = MOCK_OVERVIEW_DATA[0];

	function makeWorkspace(overrides: Partial<OverviewWorkspaceData> = {}): OverviewWorkspaceData {
		return { ...base, ...overrides };
	}

	const onclick = fn();
	const onGithubClick = fn();
	const onFolderClick = fn();
	const onGithubRightClick = fn();
	const onFolderRightClick = fn();
	const onIssuesClick = fn();
	const onPrsClick = fn();
	const onAttnClick = fn();
	const onHitlClick = fn();
	const onPrdClick = fn();
	const onAfkClick = fn();

	// --- play() interaction tests ---

	const playRendersContent = async ({ canvasElement }: { canvasElement: HTMLElement }) => {
		const canvas = within(canvasElement);

		// Title visible
		await expect(canvas.getByText('Grovekeeper')).toBeInTheDocument();

		// Issue count visible (afk_ready_count = 3, shown as value)
		await expect(canvas.getByText('ISSUES')).toBeInTheDocument();
		await expect(canvas.getByText('3')).toBeInTheDocument();

		// Session count visible in AFK meta
		await expect(canvas.getByText(/3 sessions/)).toBeInTheDocument();

		// Branch info visible
		await expect(canvas.getByText(/dev · 5 worktrees/)).toBeInTheDocument();

		// PRD row visible
		await expect(canvas.getByText(/3 PRDs/)).toBeInTheDocument();
	};

	const playGithubButtonStopsPropagation = async ({
		canvasElement,
	}: {
		canvasElement: HTMLElement;
	}) => {
		onclick.mockClear();
		onGithubClick.mockClear();

		// GitHub and Folder buttons are <button data-slot="button"> with data-icon="inline-end" icons
		const iconButtons = Array.from(
			canvasElement.querySelectorAll<HTMLButtonElement>('button[data-slot="button"]'),
		).filter((btn) => btn.querySelector('[data-icon="inline-end"]'));
		// First is GitHub, second is Folder
		const githubButton = iconButtons[0]!;
		await userEvent.click(githubButton);

		await expect(onGithubClick).toHaveBeenCalledOnce();
		await expect(onclick).not.toHaveBeenCalled();
	};

	const playFolderButtonStopsPropagation = async ({
		canvasElement,
	}: {
		canvasElement: HTMLElement;
	}) => {
		onclick.mockClear();
		onFolderClick.mockClear();

		// GitHub and Folder buttons are <button data-slot="button"> with data-icon="inline-end" icons
		const iconButtons = Array.from(
			canvasElement.querySelectorAll<HTMLButtonElement>('button[data-slot="button"]'),
		).filter((btn) => btn.querySelector('[data-icon="inline-end"]'));
		// First is GitHub, second is Folder
		const folderButton = iconButtons[1]!;
		await userEvent.click(folderButton);

		await expect(onFolderClick).toHaveBeenCalledOnce();
		await expect(onclick).not.toHaveBeenCalled();
	};

	const playIssuesStatCellStopsPropagation = async ({
		canvasElement,
	}: {
		canvasElement: HTMLElement;
	}) => {
		const canvas = within(canvasElement);
		onclick.mockClear();
		onIssuesClick.mockClear();

		// StatCell with onclick renders role="button" — find the one labelled "ISSUES"
		const issuesCell = canvas.getByText('ISSUES').closest('[role="button"]')!;
		await userEvent.click(issuesCell);

		await expect(onIssuesClick).toHaveBeenCalledOnce();
		await expect(onclick).not.toHaveBeenCalled();
	};

	const playPrsStatCellStopsPropagation = async ({
		canvasElement,
	}: {
		canvasElement: HTMLElement;
	}) => {
		const canvas = within(canvasElement);
		onclick.mockClear();
		onPrsClick.mockClear();

		const prsCell = canvas.getByText('PRs').closest('[role="button"]')!;
		await userEvent.click(prsCell);

		await expect(onPrsClick).toHaveBeenCalledOnce();
		await expect(onclick).not.toHaveBeenCalled();
	};

	const playAttnStatCellStopsPropagation = async ({
		canvasElement,
	}: {
		canvasElement: HTMLElement;
	}) => {
		const canvas = within(canvasElement);
		onclick.mockClear();
		onAttnClick.mockClear();

		const attnCell = canvas.getByText('ATTN').closest('[role="button"]')!;
		await userEvent.click(attnCell);

		await expect(onAttnClick).toHaveBeenCalledOnce();
		await expect(onclick).not.toHaveBeenCalled();
	};

	const playHitlStatCellStopsPropagation = async ({
		canvasElement,
	}: {
		canvasElement: HTMLElement;
	}) => {
		const canvas = within(canvasElement);
		onclick.mockClear();
		onHitlClick.mockClear();

		const hitlCell = canvas.getByText('HITL').closest('[role="button"]')!;
		await userEvent.click(hitlCell);

		await expect(onHitlClick).toHaveBeenCalledOnce();
		await expect(onclick).not.toHaveBeenCalled();
	};

	const playPrdRowStopsPropagation = async ({
		canvasElement,
	}: {
		canvasElement: HTMLElement;
	}) => {
		const canvas = within(canvasElement);
		onclick.mockClear();
		onPrdClick.mockClear();

		// PRD row is a <button> containing "PRDs" text
		const prdButton = canvas.getByText(/3 PRDs/).closest('button')!;
		await userEvent.click(prdButton);

		await expect(onPrdClick).toHaveBeenCalledOnce();
		await expect(onclick).not.toHaveBeenCalled();
	};

	const playAfkRowStopsPropagation = async ({
		canvasElement,
	}: {
		canvasElement: HTMLElement;
	}) => {
		const canvas = within(canvasElement);
		onclick.mockClear();
		onAfkClick.mockClear();

		// StatusRow with onclick renders role="button"
		const afkRow = canvas.getByText('AFK loop running').closest('[role="button"]')!;
		await userEvent.click(afkRow);

		await expect(onAfkClick).toHaveBeenCalledOnce();
		await expect(onclick).not.toHaveBeenCalled();
	};

	const playCardClickFiresOnclick = async ({ canvasElement }: { canvasElement: HTMLElement }) => {
		const canvas = within(canvasElement);
		onclick.mockClear();

		// Click the card title area (not on any nested interactive element)
		const title = canvas.getByText('Grovekeeper');
		await userEvent.click(title);

		await expect(onclick).toHaveBeenCalledOnce();
	};
</script>

<Story name="Active Workspace (Default)">
	{#snippet template()}
		<div class="max-w-xs p-8">
			<WorkspaceCard
				workspace={makeWorkspace()}
				{onclick}
				{onGithubClick}
				{onFolderClick}
				{onGithubRightClick}
				{onFolderRightClick}
				{onIssuesClick}
				{onPrsClick}
				{onAttnClick}
				{onHitlClick}
				{onPrdClick}
				{onAfkClick}
			/>
		</div>
	{/snippet}
</Story>

<Story name="Dormant (No Active Sessions)">
	{#snippet template()}
		<div class="max-w-xs p-8">
			<WorkspaceCard
				workspace={makeWorkspace({
					active_session_count: 0,
					afk_loop_status: 'off',
					last_activity: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
				})}
				{onclick}
				{onGithubClick}
				{onFolderClick}
				{onIssuesClick}
				{onPrsClick}
				{onAttnClick}
				{onHitlClick}
				{onPrdClick}
				{onAfkClick}
			/>
		</div>
	{/snippet}
</Story>

<Story name="Busy (Multiple Sessions)">
	{#snippet template()}
		<div class="max-w-xs p-8">
			<WorkspaceCard
				workspace={makeWorkspace({
					active_session_count: 3,
					afk_loop_status: 'running',
				})}
				{onclick}
				{onGithubClick}
				{onFolderClick}
				{onIssuesClick}
				{onPrsClick}
				{onAttnClick}
				{onHitlClick}
				{onPrdClick}
				{onAfkClick}
			/>
		</div>
	{/snippet}
</Story>

<Story name="Empty Workspace (No Issues)">
	{#snippet template()}
		<div class="max-w-xs p-8">
			<WorkspaceCard
				workspace={makeWorkspace({
					open_issue_count: 0,
					afk_ready_count: 0,
					active_session_count: 0,
					hitl_count: 0,
					open_pr_count: 0,
					prs_needing_attention: 0,
					prd_count: 0,
					prd_completed_subs: 0,
					prd_total_subs: 0,
					afk_loop_status: 'off',
				})}
				{onclick}
				{onGithubClick}
				{onFolderClick}
				{onIssuesClick}
				{onPrsClick}
				{onAttnClick}
				{onHitlClick}
				{onPrdClick}
				{onAfkClick}
			/>
		</div>
	{/snippet}
</Story>

<Story name="With Attention Badge">
	{#snippet template()}
		<div class="max-w-xs p-8">
			<WorkspaceCard
				workspace={makeWorkspace({
					prs_needing_attention: 2,
				})}
				{onclick}
				{onGithubClick}
				{onFolderClick}
				{onIssuesClick}
				{onPrsClick}
				{onAttnClick}
				{onHitlClick}
				{onPrdClick}
				{onAfkClick}
			/>
		</div>
	{/snippet}
</Story>

<Story name="With Open PRs">
	{#snippet template()}
		<div class="max-w-xs p-8">
			<WorkspaceCard
				workspace={makeWorkspace({
					open_pr_count: 3,
				})}
				{onclick}
				{onGithubClick}
				{onFolderClick}
				{onIssuesClick}
				{onPrsClick}
				{onAttnClick}
				{onHitlClick}
				{onPrdClick}
				{onAfkClick}
			/>
		</div>
	{/snippet}
</Story>

<!-- Interaction tests -->

{#snippet interactionCard()}
	<div class="max-w-xs p-8">
		<WorkspaceCard
			workspace={makeWorkspace()}
			{onclick}
			{onGithubClick}
			{onFolderClick}
			{onGithubRightClick}
			{onFolderRightClick}
			{onIssuesClick}
			{onPrsClick}
			{onAttnClick}
			{onHitlClick}
			{onPrdClick}
			{onAfkClick}
		/>
	</div>
{/snippet}

<Story name="Renders Content [play: renders content]" play={playRendersContent}>
	{#snippet template()}
		{@render interactionCard()}
	{/snippet}
</Story>

<Story
	name="Card Click Fires Onclick [play: card click fires onclick]"
	play={playCardClickFiresOnclick}
>
	{#snippet template()}
		{@render interactionCard()}
	{/snippet}
</Story>

<Story
	name="GitHub Button Stops Propagation [play: github button stops propagation]"
	play={playGithubButtonStopsPropagation}
>
	{#snippet template()}
		{@render interactionCard()}
	{/snippet}
</Story>

<Story
	name="Folder Button Stops Propagation [play: folder button stops propagation]"
	play={playFolderButtonStopsPropagation}
>
	{#snippet template()}
		{@render interactionCard()}
	{/snippet}
</Story>

<Story
	name="Issues Cell Stops Propagation [play: issues cell stops propagation]"
	play={playIssuesStatCellStopsPropagation}
>
	{#snippet template()}
		{@render interactionCard()}
	{/snippet}
</Story>

<Story
	name="PRs Cell Stops Propagation [play: prs cell stops propagation]"
	play={playPrsStatCellStopsPropagation}
>
	{#snippet template()}
		{@render interactionCard()}
	{/snippet}
</Story>

<Story
	name="Attn Cell Stops Propagation [play: attn cell stops propagation]"
	play={playAttnStatCellStopsPropagation}
>
	{#snippet template()}
		{@render interactionCard()}
	{/snippet}
</Story>

<Story
	name="HITL Cell Stops Propagation [play: hitl cell stops propagation]"
	play={playHitlStatCellStopsPropagation}
>
	{#snippet template()}
		{@render interactionCard()}
	{/snippet}
</Story>

<Story
	name="PRD Row Stops Propagation [play: prd row stops propagation]"
	play={playPrdRowStopsPropagation}
>
	{#snippet template()}
		{@render interactionCard()}
	{/snippet}
</Story>

<Story
	name="AFK Row Stops Propagation [play: afk row stops propagation]"
	play={playAfkRowStopsPropagation}
>
	{#snippet template()}
		{@render interactionCard()}
	{/snippet}
</Story>
