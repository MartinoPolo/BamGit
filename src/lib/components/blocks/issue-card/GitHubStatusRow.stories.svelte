<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import GitHubStatusRow from './GitHubStatusRow.svelte';
	import IssueCardSubComponentStoryWrapper from './IssueCardSubComponentStoryWrapper.svelte';

	const { Story } = defineMeta({
		title: 'Blocks/Issue/SubComponents/GitHubStatusRow',
		component: GitHubStatusRow,
		tags: ['autodocs'],
	});
</script>

<Story name="Open Issue + Open PR">
	{#snippet template()}
		<div class="w-80">
			<IssueCardSubComponentStoryWrapper
				cache={{
					github_issue_state: 'open',
					pr_state: 'open',
					pr_url: 'https://github.com/example/repo/pull/5',
					pr_number: 5,
				}}
			>
				<GitHubStatusRow />
			</IssueCardSubComponentStoryWrapper>
		</div>
	{/snippet}
</Story>

<Story name="Issue Only">
	{#snippet template()}
		<div class="w-80">
			<IssueCardSubComponentStoryWrapper cache={{ github_issue_state: 'open' }}>
				<GitHubStatusRow />
			</IssueCardSubComponentStoryWrapper>
		</div>
	{/snippet}
</Story>

<Story name="Closed + Merged">
	{#snippet template()}
		<div class="w-80">
			<IssueCardSubComponentStoryWrapper
				cache={{
					github_issue_state: 'closed',
					pr_state: 'merged',
					pr_url: 'https://github.com/example/repo/pull/10',
					pr_number: 10,
				}}
			>
				<GitHubStatusRow />
			</IssueCardSubComponentStoryWrapper>
		</div>
	{/snippet}
</Story>

<Story name="No GitHub Data">
	{#snippet template()}
		<div class="w-80">
			<IssueCardSubComponentStoryWrapper cache={null}>
				<GitHubStatusRow />
			</IssueCardSubComponentStoryWrapper>
		</div>
	{/snippet}
</Story>
