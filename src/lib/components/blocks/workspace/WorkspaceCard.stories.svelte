<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import { fn } from 'storybook/test';
	import WorkspaceCard from './WorkspaceCard.svelte';
	import { MOCK_OVERVIEW_DATA } from '$lib/tauri_mock_data.js';
	import type { OverviewWorkspaceData } from '$lib/types/generated';

	const { Story } = defineMeta({
		title: 'Blocks/Workspace/WorkspaceCard',
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
