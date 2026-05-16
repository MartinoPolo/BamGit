<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import CommandResultsRow from './CommandResultsRow.svelte';

	const { Story } = defineMeta({
		title: 'Blocks/Issue/SubComponents/CommandResultsRow',
		component: CommandResultsRow,
		tags: ['autodocs'],
	});
</script>

<Story name="Mixed States + Server">
	{#snippet template()}
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
	{/snippet}
</Story>

<Story name="Overflow (+2)">
	{#snippet template()}
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
	{/snippet}
</Story>

<Story name="Empty (Hidden)">
	{#snippet template()}
		<div class="w-80">
			<CommandResultsRow />
		</div>
	{/snippet}
</Story>

<Story name="Stale Results">
	{#snippet template()}
		<div class="w-80">
			<CommandResultsRow
				commandResults={[
					{ commandName: 'check:all', state: 'passed', isStale: true },
					{ commandName: 'test', state: 'failed', isStale: true },
				]}
			/>
		</div>
	{/snippet}
</Story>
