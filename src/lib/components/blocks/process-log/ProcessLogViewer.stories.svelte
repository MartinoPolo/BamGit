<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import ProcessLogViewer from './ProcessLogViewer.svelte';

	const { Story } = defineMeta({
		title: 'Blocks/ProcessLog/ProcessLogViewer',
		component: ProcessLogViewer,
		tags: ['autodocs'],
	});
</script>

<script lang="ts">
	import ProcessLogViewerStoryWrapper from './ProcessLogViewerStoryWrapper.svelte';
</script>

<Story name="Streaming">
	{#snippet template()}
		<ProcessLogViewerStoryWrapper variant="streaming" />
	{/snippet}
</Story>

<Story name="WithStderr">
	{#snippet template()}
		<ProcessLogViewerStoryWrapper variant="with-stderr" />
	{/snippet}
</Story>

<Story name="Empty">
	{#snippet template()}
		<ProcessLogViewerStoryWrapper variant="empty" />
	{/snippet}
</Story>

<Story name="ProcessCompleted">
	{#snippet template()}
		<ProcessLogViewerStoryWrapper variant="completed" />
	{/snippet}
</Story>

<Story name="ProcessFailed">
	{#snippet template()}
		<ProcessLogViewerStoryWrapper variant="failed" />
	{/snippet}
</Story>
