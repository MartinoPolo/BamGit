<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import { IssueColorButton } from './index.js';
	import { BUTTON_TEXT_SIZES } from '$lib/components/shadcn/button/index.js';

	const SAMPLE_COLORS = [
		{ label: 'green', value: '#4CAF50' },
		{ label: 'blue', value: '#2196F3' },
		{ label: 'red', value: '#FF5722' },
		{ label: 'none', value: null },
	] as const;

	const { Story } = defineMeta({
		title: 'Derived/IssueColorButton',
		component: IssueColorButton,
		tags: ['autodocs'],
	});
</script>

<script lang="ts">
</script>

<Story name="All Variants">
	{#snippet template()}
		<div class="flex flex-col gap-6">
			{#each BUTTON_TEXT_SIZES as size (size)}
				<div class="flex flex-col gap-2">
					<span class="text-xs text-foreground-muted">{size}</span>
					<div class="flex flex-wrap items-center gap-3">
						{#each SAMPLE_COLORS as { label, value } (label)}
							<IssueColorButton color={value} {size}>{label}</IssueColorButton>
						{/each}
					</div>
				</div>
			{/each}
		</div>
	{/snippet}
</Story>

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
			{#each BUTTON_TEXT_SIZES as size (size)}
				<IssueColorButton color="#4CAF50" {size}>{size}</IssueColorButton>
			{/each}
		</div>
	{/snippet}
</Story>
