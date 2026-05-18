<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import CommandResultsRow from './CommandResultsRow.svelte';
	import IssueCardSubComponentStoryWrapper from './IssueCardSubComponentStoryWrapper.svelte';

	const { Story } = defineMeta({
		title: 'Blocks/IssueCard/CommandResultsRow',
		component: CommandResultsRow,
		tags: ['autodocs'],
	});
</script>

<Story name="Mixed States + Server">
	{#snippet template()}
		<IssueCardSubComponentStoryWrapper>
			<div class="w-80">
				<CommandResultsRow
					commandResults={[
						{ commandName: 'check:all', state: 'passed' },
						{ commandName: 'test', state: 'running' },
						{ commandName: 'build', state: 'failed' },
					]}
					serverPort={5173}
				/>
			</div>
		</IssueCardSubComponentStoryWrapper>
	{/snippet}
</Story>

<Story name="Overflow (+2)">
	{#snippet template()}
		<IssueCardSubComponentStoryWrapper>
			<div class="w-80">
				<CommandResultsRow
					commandResults={[
						{ commandName: 'check:all', state: 'passed' },
						{ commandName: 'test:unit', state: 'passed' },
						{ commandName: 'test:e2e', state: 'running' },
						{ commandName: 'lint', state: 'passed' },
						{ commandName: 'build', state: 'failed' },
					]}
				/>
			</div>
		</IssueCardSubComponentStoryWrapper>
	{/snippet}
</Story>

<Story name="Empty (Hidden)">
	{#snippet template()}
		<IssueCardSubComponentStoryWrapper>
			<div class="w-80">
				<CommandResultsRow />
			</div>
		</IssueCardSubComponentStoryWrapper>
	{/snippet}
</Story>

<Story name="Stale Results">
	{#snippet template()}
		<IssueCardSubComponentStoryWrapper>
			<div class="w-80">
				<CommandResultsRow
					commandResults={[
						{ commandName: 'check:all', state: 'passed', isStale: true },
						{ commandName: 'test', state: 'failed', isStale: true },
					]}
				/>
			</div>
		</IssueCardSubComponentStoryWrapper>
	{/snippet}
</Story>
