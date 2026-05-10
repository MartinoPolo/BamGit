<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import CostLink from './CostLink.svelte';
	import ThemeDecorator from '$lib/storybook/ThemeDecorator.svelte';

	const { Story } = defineMeta({
		title: 'Usage/CostLink',
		component: CostLink,
		// @ts-expect-error — Storybook decorator typing doesn't match Svelte 5 Component type
		decorators: [() => ThemeDecorator],
		tags: ['autodocs'],
	});
</script>

<Story name="Low Cost (< $1)">
	{#snippet template()}
		<div class="flex items-center gap-4 p-8">
			<CostLink costUsd={0.12} period="today" scope="workspace" size="sm" />
			<CostLink costUsd={0.12} period="today" scope="workspace" size="md" />
		</div>
	{/snippet}
</Story>

<Story name="Medium Cost ($1-$20)">
	{#snippet template()}
		<div class="flex items-center gap-4 p-8">
			<CostLink costUsd={4.38} period="today" scope="workspace" size="sm" />
			<CostLink costUsd={4.38} period="today" scope="workspace" size="md" />
		</div>
	{/snippet}
</Story>

<Story name="High Cost (> $20)">
	{#snippet template()}
		<div class="flex items-center gap-4 p-8">
			<CostLink costUsd={28.75} period="thirty-days" scope="global" size="sm" />
			<CostLink costUsd={28.75} period="thirty-days" scope="global" size="md" />
		</div>
	{/snippet}
</Story>

<Story name="Disabled">
	{#snippet template()}
		<div class="flex items-center gap-4 p-8">
			<CostLink costUsd={0.12} disabled size="md" />
			<CostLink costUsd={4.38} disabled size="md" />
			<CostLink costUsd={28.75} disabled size="md" />
		</div>
	{/snippet}
</Story>

<Story name="All Magnitudes Grid">
	{#snippet template()}
		<div class="grid grid-cols-3 gap-6 p-8">
			<div class="flex flex-col items-center gap-2">
				<span class="text-xs text-muted-foreground">Low (sm)</span>
				<CostLink costUsd={0.05} size="sm" />
			</div>
			<div class="flex flex-col items-center gap-2">
				<span class="text-xs text-muted-foreground">Medium (sm)</span>
				<CostLink costUsd={8.5} size="sm" />
			</div>
			<div class="flex flex-col items-center gap-2">
				<span class="text-xs text-muted-foreground">High (sm)</span>
				<CostLink costUsd={45.0} size="sm" />
			</div>
			<div class="flex flex-col items-center gap-2">
				<span class="text-xs text-muted-foreground">Low (md)</span>
				<CostLink costUsd={0.05} size="md" />
			</div>
			<div class="flex flex-col items-center gap-2">
				<span class="text-xs text-muted-foreground">Medium (md)</span>
				<CostLink costUsd={8.5} size="md" />
			</div>
			<div class="flex flex-col items-center gap-2">
				<span class="text-xs text-muted-foreground">High (md)</span>
				<CostLink costUsd={45.0} size="md" />
			</div>
		</div>
	{/snippet}
</Story>

<Story name="Inline Text Flow">
	{#snippet template()}
		<div class="max-w-md p-8 text-sm text-muted-foreground leading-relaxed">
			<p>
				Session "fix auth token refresh" used
				<CostLink costUsd={0.12} size="sm" />
				over 14 tool calls. The workspace total for today is
				<CostLink costUsd={4.38} size="sm" />
				across 3 active sessions. Month-to-date spend sits at
				<CostLink costUsd={28.75} period="month" scope="global" size="sm" />
				which is 62% of the monthly budget.
			</p>
		</div>
	{/snippet}
</Story>

<Story name="Workspace Card Context">
	{#snippet template()}
		<div
			class="flex items-center justify-between rounded-lg border border-border bg-surface p-3"
			style="width: 280px;"
		>
			<span class="flex items-center gap-1 font-mono text-[10.5px] text-foreground-subtle">
				today <CostLink costUsd={4.38} period="today" scope="workspace" size="sm" />
			</span>
			<span class="font-mono text-[10.5px] text-foreground-subtle"> 2m ago </span>
		</div>
	{/snippet}
</Story>
