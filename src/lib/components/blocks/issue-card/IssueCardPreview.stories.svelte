<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import IssueCardPreview from './IssueCardPreview.svelte';
	import IssueCardSubComponentStoryWrapper from './IssueCardSubComponentStoryWrapper.svelte';

	const { Story } = defineMeta({
		title: 'Blocks/Issue/SubComponents/IssueCardPreview',
		component: IssueCardPreview,
		tags: ['autodocs'],
	});
</script>

<Story name="Placeholder (No Visualization)">
	{#snippet template()}
		<IssueCardSubComponentStoryWrapper>
			<IssueCardPreview />
		</IssueCardSubComponentStoryWrapper>
	{/snippet}
</Story>

<Story name="With Notification Dot">
	{#snippet template()}
		<IssueCardSubComponentStoryWrapper
			overrides={{ notificationDotColor: 'bg-amber-500', sessionState: null }}
		>
			<IssueCardPreview />
		</IssueCardSubComponentStoryWrapper>
	{/snippet}
</Story>
