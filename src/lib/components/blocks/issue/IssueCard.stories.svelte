<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import IssueCard from './IssueCard.svelte';

	const { Story } = defineMeta({
		title: 'Blocks/Issue/IssueCard',
		component: IssueCard,
		tags: ['autodocs'],
	});
</script>

<script lang="ts">
	import { fn } from 'storybook/test';
	import type { Issue } from '$lib/modules/issues';
	import type { GitStatusCache } from '$lib/types/generated';
	import { MOCK_ISSUES } from '$lib/tauri_mock_data.js';
	import IssueCardStoryWrapper from './IssueCardStoryWrapper.svelte';

	function parseMockIssue(raw: (typeof MOCK_ISSUES)[number]): Issue {
		return {
			...raw,
			labels: typeof raw.labels === 'string' ? JSON.parse(raw.labels) : (raw.labels ?? []),
		} as Issue;
	}

	const baseIssue = parseMockIssue(MOCK_ISSUES[0]);

	const noWorktreeIssue: Issue = {
		...parseMockIssue(MOCK_ISSUES[4]),
		worktree_state: 'none',
		worktree_folder: null,
		branch_name: null,
	};

	const archivedIssue: Issue = {
		...parseMockIssue(MOCK_ISSUES[5]),
		status: 'archived',
	};

	const withPrCache: GitStatusCache = {
		issue_id: baseIssue.id,
		branch_status: 'ahead 2',
		pr_state: 'open',
		pr_number: 101,
		pr_url: 'https://github.com/MartinoPolo/Grovekeeper/pull/101',
		github_issue_state: 'open',
		behind_base_count: 0,
		merge_conflict: false,
		has_local_changes: true,
		ahead_remote_count: 2,
		fetched_at: '2026-05-14T10:00:00Z',
	};

	const callbacks = {
		onCardClick: fn(),
		onTitleClick: fn(),
		onMouseEnter: fn(),
		onMouseLeave: fn(),
		onExecuteAction: fn(),
		onPriorityClick: fn(),
		onQuickActionAssignFolder: fn(),
	};
</script>

<Story name="Default">
	{#snippet template()}
		<IssueCardStoryWrapper>
			<div class="max-w-md">
				<IssueCard issue={baseIssue} ghAvailable={true} {...callbacks} />
			</div>
		</IssueCardStoryWrapper>
	{/snippet}
</Story>

<Story name="Active">
	{#snippet template()}
		<IssueCardStoryWrapper>
			<div class="max-w-md">
				<IssueCard issue={baseIssue} isActive={true} ghAvailable={true} {...callbacks} />
			</div>
		</IssueCardStoryWrapper>
	{/snippet}
</Story>

<Story name="Batch Selected">
	{#snippet template()}
		<IssueCardStoryWrapper>
			<div class="max-w-md">
				<IssueCard
					issue={baseIssue}
					isBatchSelected={true}
					ghAvailable={true}
					{...callbacks}
				/>
			</div>
		</IssueCardStoryWrapper>
	{/snippet}
</Story>

<Story name="With Worktree Active">
	{#snippet template()}
		<IssueCardStoryWrapper>
			<div class="max-w-md">
				<IssueCard
					issue={baseIssue}
					cache={withPrCache}
					ghAvailable={true}
					{...callbacks}
				/>
			</div>
		</IssueCardStoryWrapper>
	{/snippet}
</Story>

<Story name="With GitHub PR">
	{#snippet template()}
		<IssueCardStoryWrapper>
			<div class="max-w-md">
				<IssueCard
					issue={baseIssue}
					cache={withPrCache}
					ghAvailable={true}
					childCount={3}
					prdParent={{
						number: 95,
						url: 'https://github.com/MartinoPolo/Grovekeeper/issues/95',
					}}
					{...callbacks}
				/>
			</div>
		</IssueCardStoryWrapper>
	{/snippet}
</Story>

<Story name="Archived">
	{#snippet template()}
		<IssueCardStoryWrapper>
			<div class="max-w-md">
				<IssueCard issue={archivedIssue} ghAvailable={false} {...callbacks} />
			</div>
		</IssueCardStoryWrapper>
	{/snippet}
</Story>

<Story name="With Notification Dot">
	{#snippet template()}
		<IssueCardStoryWrapper>
			<div class="max-w-md">
				<IssueCard
					issue={baseIssue}
					notificationDotColor="bg-orange-500"
					ghAvailable={true}
					{...callbacks}
				/>
			</div>
		</IssueCardStoryWrapper>
	{/snippet}
</Story>

<Story name="With Session State">
	{#snippet template()}
		<IssueCardStoryWrapper>
			<div class="max-w-md">
				<IssueCard
					issue={baseIssue}
					sessionState="executing"
					ghAvailable={true}
					{...callbacks}
				/>
			</div>
		</IssueCardStoryWrapper>
	{/snippet}
</Story>

<Story name="No Worktree">
	{#snippet template()}
		<IssueCardStoryWrapper>
			<div class="max-w-md">
				<IssueCard issue={noWorktreeIssue} ghAvailable={true} {...callbacks} />
			</div>
		</IssueCardStoryWrapper>
	{/snippet}
</Story>

<Story name="Hovered with Modifier">
	{#snippet template()}
		<IssueCardStoryWrapper>
			<div class="max-w-md">
				<IssueCard
					issue={baseIssue}
					isHovered={true}
					isModifierHeld={true}
					ghAvailable={true}
					{...callbacks}
				/>
			</div>
		</IssueCardStoryWrapper>
	{/snippet}
</Story>
