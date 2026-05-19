<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import IssueLabelsRow from './IssueLabelsRow.svelte';
	import IssueCardSubComponentStoryWrapper from './IssueCardSubComponentStoryWrapper.svelte';

	const { Story } = defineMeta({
		title: 'Blocks/IssueCard/IssueLabelsRow',
		component: IssueLabelsRow,
		tags: ['autodocs'],
	});

	const manyLabels = [
		{ name: 'area:ui', color: '#C5DEF5' },
		{ name: 'bug', color: '#d73a4a' },
		{ name: 'enhancement', color: '#a2eeef' },
		{ name: 'priority:high', color: '#ff6600' },
		{ name: 'wontfix', color: '#ffffff' },
	];
</script>

<Story name="Default (2 Labels)">
	{#snippet template()}
		<div class="w-80">
			<IssueCardSubComponentStoryWrapper>
				<IssueLabelsRow />
			</IssueCardSubComponentStoryWrapper>
		</div>
	{/snippet}
</Story>

<Story name="Overflow (+2)">
	{#snippet template()}
		<div class="w-80">
			<IssueCardSubComponentStoryWrapper
				issue={{
					id: 'labels-1',
					dashboard_id: 'dash-1',
					name: 'Many labels issue',
					color: '#6366f1',
					priority: null,
					status: 'active',
					worktree_state: 'active',
					branch_name: 'feat/labels',
					base_branch: 'main',
					worktree_folder: null,
					github_issue_url: null,
					github_issue_number: null,
					parent_issue_id: null,
					labels: manyLabels,
					is_sound_muted: false,
					sort_order: 0,
					created_at: '2026-01-01T00:00:00Z',
				}}
			>
				<IssueLabelsRow />
			</IssueCardSubComponentStoryWrapper>
		</div>
	{/snippet}
</Story>

<Story name="No Labels (Hidden)">
	{#snippet template()}
		<div class="w-80">
			<IssueCardSubComponentStoryWrapper
				issue={{
					id: 'no-labels-1',
					dashboard_id: 'dash-1',
					name: 'No labels',
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
				<IssueLabelsRow />
			</IssueCardSubComponentStoryWrapper>
		</div>
	{/snippet}
</Story>
