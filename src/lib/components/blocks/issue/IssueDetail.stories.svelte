<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import IssueDetail from './IssueDetail.svelte';

	const { Story } = defineMeta({
		title: 'Blocks/Issue/IssueDetail',
		component: IssueDetail,
		tags: ['autodocs'],
	});
</script>

<script lang="ts">
	import { fn } from 'storybook/test';
	import type { Issue } from '$lib/modules/issues';
	import type { GitStatusCache } from '$lib/types/generated';
	import { MOCK_ISSUES } from '$lib/tauri_mock_data.js';

	// MOCK_ISSUES labels are JSON strings at runtime; parse them for properly typed Issue objects.
	function parseMockIssue(raw: (typeof MOCK_ISSUES)[number]): Issue {
		return {
			...raw,
			labels: typeof raw.labels === 'string' ? JSON.parse(raw.labels) : (raw.labels ?? []),
		} as Issue;
	}

	const baseIssue = parseMockIssue(MOCK_ISSUES[0]);

	const minimalIssue: Issue = {
		...baseIssue,
		priority: null,
		color: null,
		github_issue_url: null,
		github_issue_number: null,
		branch_name: null,
		worktree_folder: null,
		worktree_state: 'none',
		parent_issue_id: null,
		labels: [],
		name: 'Standalone local issue',
	};

	const withPrIssue = parseMockIssue(MOCK_ISSUES[0]);

	const withPrCache: GitStatusCache = {
		issue_id: withPrIssue.id,
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
		pr_ci_status: null,
	};

	const worktreeActiveIssue: Issue = {
		...parseMockIssue(MOCK_ISSUES[1]),
		worktree_state: 'active',
		worktree_folder: 'C:/_MP_projects/worktrees/55-dark-mode-toggle',
	};

	const worktreeActiveCache: GitStatusCache = {
		issue_id: worktreeActiveIssue.id,
		branch_status: 'up to date',
		pr_state: null,
		pr_number: null,
		pr_url: null,
		github_issue_state: 'open',
		behind_base_count: 0,
		merge_conflict: false,
		has_local_changes: false,
		ahead_remote_count: 0,
		fetched_at: '2026-05-14T10:00:00Z',
		pr_ci_status: null,
	};

	const archivedIssue: Issue = {
		...parseMockIssue(MOCK_ISSUES[2]),
		status: 'archived',
	};

	const failedWorktreeIssue: Issue = {
		...parseMockIssue(MOCK_ISSUES[3]),
		worktree_state: 'failed',
	};

	const failedWorktreeCache: GitStatusCache = {
		issue_id: failedWorktreeIssue.id,
		branch_status: null,
		pr_state: null,
		pr_number: null,
		pr_url: null,
		github_issue_state: 'open',
		behind_base_count: null,
		merge_conflict: null,
		has_local_changes: null,
		ahead_remote_count: null,
		fetched_at: null,
		pr_ci_status: null,
	};

	const paletteColors = [
		'#ef4444',
		'#f97316',
		'#f59e0b',
		'#10b981',
		'#06b6d4',
		'#3b82f6',
		'#8b5cf6',
		'#ec4899',
	];

	const usedColors = ['#ef4444', '#8b5cf6'];

	const callbacks = {
		onArchive: fn(),
		onUnarchive: fn(),
		onEdit: fn(),
		onDelete: fn(),
		onChangePriority: fn(),
		onRename: fn(),
		onSetupWorktree: fn(),
		onRemoveWorktree: fn(),
		onChangeColor: fn(),
	};
</script>

<Story name="Full Detail">
	{#snippet template()}
		<div class="mx-auto max-w-sm border border-border rounded-lg bg-card">
			<IssueDetail
				issue={withPrIssue}
				cache={withPrCache}
				ghAvailable={true}
				{paletteColors}
				{usedColors}
				{...callbacks}
			/>
		</div>
	{/snippet}
</Story>

<Story name="Minimal Info">
	{#snippet template()}
		<div class="mx-auto max-w-sm border border-border rounded-lg bg-card">
			<IssueDetail issue={minimalIssue} {paletteColors} {usedColors} {...callbacks} />
		</div>
	{/snippet}
</Story>

<Story name="With GitHub PR Linked">
	{#snippet template()}
		<div class="mx-auto max-w-sm border border-border rounded-lg bg-card">
			<IssueDetail
				issue={withPrIssue}
				cache={withPrCache}
				ghAvailable={true}
				{paletteColors}
				{usedColors}
				{...callbacks}
			/>
		</div>
	{/snippet}
</Story>

<Story name="Worktree Active">
	{#snippet template()}
		<div class="mx-auto max-w-sm border border-border rounded-lg bg-card">
			<IssueDetail
				issue={worktreeActiveIssue}
				cache={worktreeActiveCache}
				ghAvailable={true}
				{paletteColors}
				{usedColors}
				{...callbacks}
			/>
		</div>
	{/snippet}
</Story>

<Story name="Archived">
	{#snippet template()}
		<div class="mx-auto max-w-sm border border-border rounded-lg bg-card">
			<IssueDetail issue={archivedIssue} {paletteColors} {usedColors} {...callbacks} />
		</div>
	{/snippet}
</Story>

<Story name="Worktree Failed (Retry)">
	{#snippet template()}
		<div class="mx-auto max-w-sm border border-border rounded-lg bg-card">
			<IssueDetail
				issue={failedWorktreeIssue}
				cache={failedWorktreeCache}
				ghAvailable={true}
				{paletteColors}
				{usedColors}
				{...callbacks}
			/>
		</div>
	{/snippet}
</Story>
