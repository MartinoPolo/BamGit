<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import WorktreeRow from './WorktreeRow.svelte';
	import IssueCardSubComponentStoryWrapper from './IssueCardSubComponentStoryWrapper.svelte';

	const { Story } = defineMeta({
		title: 'Blocks/Issue/SubComponents/WorktreeRow',
		component: WorktreeRow,
		tags: ['autodocs'],
	});
</script>

<Story name="Active Worktree">
	{#snippet template()}
		<div class="w-80">
			<IssueCardSubComponentStoryWrapper>
				<WorktreeRow />
			</IssueCardSubComponentStoryWrapper>
		</div>
	{/snippet}
</Story>

<Story name="No Worktree">
	{#snippet template()}
		<div class="w-80">
			<IssueCardSubComponentStoryWrapper
				issue={{
					id: 'no-wt-1',
					dashboard_id: 'dash-1',
					name: 'No worktree',
					color: '#525252',
					priority: null,
					status: 'active',
					worktree_state: 'none',
					branch_name: null,
					base_branch: null,
					worktree_folder: null,
					github_issue_url: null,
					github_issue_number: null,
					parent_issue_id: null,
					labels: [],
					is_sound_muted: false,
					sort_order: 0,
					created_at: '2026-01-01T00:00:00Z',
				}}
			>
				<WorktreeRow />
			</IssueCardSubComponentStoryWrapper>
		</div>
	{/snippet}
</Story>

<Story name="Pending (Spinner)">
	{#snippet template()}
		<div class="w-80">
			<IssueCardSubComponentStoryWrapper
				issue={{
					id: 'pending-1',
					dashboard_id: 'dash-1',
					name: 'Pending worktree',
					color: '#f59e0b',
					priority: null,
					status: 'active',
					worktree_state: 'pending',
					branch_name: 'feat/pending-setup',
					base_branch: 'main',
					worktree_folder: '/projects/pending-setup',
					github_issue_url: null,
					github_issue_number: null,
					parent_issue_id: null,
					labels: [],
					is_sound_muted: false,
					sort_order: 0,
					created_at: '2026-01-01T00:00:00Z',
				}}
			>
				<WorktreeRow />
			</IssueCardSubComponentStoryWrapper>
		</div>
	{/snippet}
</Story>

<Story name="With Sync Badge">
	{#snippet template()}
		<div class="w-80">
			<IssueCardSubComponentStoryWrapper
				cache={{ behind_base_count: 5, merge_conflict: false }}
			>
				<WorktreeRow />
			</IssueCardSubComponentStoryWrapper>
		</div>
	{/snippet}
</Story>

<Story name="With Merge Conflict">
	{#snippet template()}
		<div class="w-80">
			<IssueCardSubComponentStoryWrapper
				cache={{ merge_conflict: true, behind_base_count: 2 }}
			>
				<WorktreeRow />
			</IssueCardSubComponentStoryWrapper>
		</div>
	{/snippet}
</Story>
