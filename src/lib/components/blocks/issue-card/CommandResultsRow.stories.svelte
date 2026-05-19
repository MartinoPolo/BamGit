<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import CommandResultsRow from './CommandResultsRow.svelte';
	import IssueCardSubComponentStoryWrapper from './IssueCardSubComponentStoryWrapper.svelte';

	const { Story } = defineMeta({
		title: 'Blocks/Issue/SubComponents/CommandResultsRow',
		component: CommandResultsRow,
		tags: ['autodocs'],
	});
</script>

<Story name="Live Data (from process context)">
	{#snippet template()}
		<IssueCardSubComponentStoryWrapper issue={{ id: 'mock-issue-auth' }}>
			<div class="w-80">
				<CommandResultsRow />
			</div>
		</IssueCardSubComponentStoryWrapper>
	{/snippet}
</Story>

<Story name="With Local Changes (stale badges)">
	{#snippet template()}
		<IssueCardSubComponentStoryWrapper
			issue={{ id: 'mock-issue-auth' }}
			cache={{ has_local_changes: true }}
		>
			<div class="w-80">
				<CommandResultsRow />
			</div>
		</IssueCardSubComponentStoryWrapper>
	{/snippet}
</Story>

<Story name="Failed Check">
	{#snippet template()}
		<IssueCardSubComponentStoryWrapper issue={{ id: 'mock-issue-dark-mode' }}>
			<div class="w-80">
				<CommandResultsRow />
			</div>
		</IssueCardSubComponentStoryWrapper>
	{/snippet}
</Story>

<Story name="Timeout State">
	{#snippet template()}
		<IssueCardSubComponentStoryWrapper issue={{ id: 'mock-issue-perf' }}>
			<div class="w-80">
				<CommandResultsRow />
			</div>
		</IssueCardSubComponentStoryWrapper>
	{/snippet}
</Story>

<Story name="Empty (No Processes)">
	{#snippet template()}
		<IssueCardSubComponentStoryWrapper issue={{ id: 'mock-issue-onboarding' }}>
			<div class="w-80">
				<CommandResultsRow />
			</div>
		</IssueCardSubComponentStoryWrapper>
	{/snippet}
</Story>
