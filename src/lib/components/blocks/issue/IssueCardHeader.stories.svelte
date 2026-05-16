<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import IssueCardHeader from './IssueCardHeader.svelte';
	import IssueCardSubComponentStoryWrapper from './IssueCardSubComponentStoryWrapper.svelte';

	const { Story } = defineMeta({
		title: 'Blocks/Issue/SubComponents/IssueCardHeader',
		component: IssueCardHeader,
		tags: ['autodocs'],
	});
</script>

<Story name="Default">
	{#snippet template()}
		<div class="w-[450px]">
			<IssueCardSubComponentStoryWrapper>
				<IssueCardHeader />
			</IssueCardSubComponentStoryWrapper>
		</div>
	{/snippet}
</Story>

<Story name="With Session State">
	{#snippet template()}
		<div class="w-[450px]">
			<IssueCardSubComponentStoryWrapper overrides={{ sessionState: 'executing' }}>
				<IssueCardHeader />
			</IssueCardSubComponentStoryWrapper>
		</div>
	{/snippet}
</Story>

<Story name="Light Header Color">
	{#snippet template()}
		<div class="w-[450px]">
			<IssueCardSubComponentStoryWrapper
				issue={{
					id: 'light-1',
					dashboard_id: 'dash-1',
					name: 'Light header color issue',
					color: '#fbbf24',
					priority: 'top',
					status: 'active',
					worktree_state: 'active',
					branch_name: 'feat/light-header',
					base_branch: 'main',
					worktree_folder: '/projects/light-header',
					github_issue_url: 'https://github.com/example/repo/issues/10',
					github_issue_number: 10,
					parent_issue_id: null,
					labels: [],
					is_sound_muted: false,
					sort_order: 0,
					created_at: '2026-01-01T00:00:00Z',
				}}
			>
				<IssueCardHeader />
			</IssueCardSubComponentStoryWrapper>
		</div>
	{/snippet}
</Story>
