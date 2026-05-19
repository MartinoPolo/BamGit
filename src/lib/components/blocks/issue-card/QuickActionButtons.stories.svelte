<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import QuickActionButtons from './QuickActionButtons.svelte';
	import IssueCardSubComponentStoryWrapper from './IssueCardSubComponentStoryWrapper.svelte';

	const { Story } = defineMeta({
		title: 'Blocks/IssueCard/QuickActionButtons',
		component: QuickActionButtons,
		tags: ['autodocs'],
	});
</script>

<Story name="With Worktree">
	{#snippet template()}
		<IssueCardSubComponentStoryWrapper>
			<QuickActionButtons />
		</IssueCardSubComponentStoryWrapper>
	{/snippet}
</Story>

<Story name="Without Worktree (Dimmed)">
	{#snippet template()}
		<IssueCardSubComponentStoryWrapper
			issue={{
				worktree_state: 'none',
				branch_name: null,
				worktree_folder: null,
			}}
		>
			<QuickActionButtons />
		</IssueCardSubComponentStoryWrapper>
	{/snippet}
</Story>

<Story name="Muted">
	{#snippet template()}
		<IssueCardSubComponentStoryWrapper
			issue={{
				is_sound_muted: true,
			}}
		>
			<QuickActionButtons />
		</IssueCardSubComponentStoryWrapper>
	{/snippet}
</Story>
