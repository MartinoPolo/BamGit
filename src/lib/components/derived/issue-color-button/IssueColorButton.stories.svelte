<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import { IssueColorButton } from './index.js';

	const { Story } = defineMeta({
		title: 'Derived/IssueColorButton',
		component: IssueColorButton,
		tags: ['autodocs'],
	});
</script>

<script lang="ts">
</script>

<Story name="With Colors">
	{#snippet template()}
		<div class="flex flex-wrap gap-3">
			<IssueColorButton color="#4CAF50">Open Issue</IssueColorButton>
			<IssueColorButton color="#2196F3">In Progress</IssueColorButton>
			<IssueColorButton color="#FF5722">Blocked</IssueColorButton>
			<IssueColorButton color="#9C27B0">Review</IssueColorButton>
			<IssueColorButton color="#FFC107">Pending</IssueColorButton>
			<IssueColorButton color="#00BCD4">Testing</IssueColorButton>
		</div>
	{/snippet}
</Story>

<Story name="No Color (Fallback)">
	{#snippet template()}
		<div class="flex flex-wrap gap-3">
			<IssueColorButton>Done Card</IssueColorButton>
			<IssueColorButton color={null}>Ghost Card</IssueColorButton>
		</div>
	{/snippet}
</Story>

<Story name="Sizes">
	{#snippet template()}
		<div class="flex flex-wrap items-center gap-3">
			<IssueColorButton color="#4CAF50" size="sm">Small</IssueColorButton>
			<IssueColorButton color="#4CAF50" size="md">Medium</IssueColorButton>
			<IssueColorButton color="#4CAF50" size="lg">Large</IssueColorButton>
		</div>
	{/snippet}
</Story>
