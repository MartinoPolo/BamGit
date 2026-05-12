<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import { WithTooltip } from './index.js';
	import ThemeDecorator from '$lib/storybook/ThemeDecorator.svelte';

	const { Story } = defineMeta({
		title: 'Base/WithTooltip',
		component: WithTooltip,
		// @ts-expect-error — Storybook decorator typing doesn't match Svelte 5 Component type
		decorators: [() => ThemeDecorator],
		tags: ['autodocs'],
	});
</script>

<Story name="Children Span-Wrap">
	{#snippet template()}
		<div class="flex items-center justify-center p-16">
			<WithTooltip text="Sync now" side="top">
				Some text content wrapped in a span
			</WithTooltip>
		</div>
	{/snippet}
</Story>

<Story name="AsChild Button (Top)">
	{#snippet template()}
		<div class="flex items-center justify-center p-16">
			<WithTooltip text="Sync now" side="top">
				{#snippet asChild(props)}
					<button
						{...props}
						class="inline-flex h-8 items-center rounded-md border border-border bg-surface-2 px-3 text-sm text-foreground"
					>
						Hover me
					</button>
				{/snippet}
			</WithTooltip>
		</div>
	{/snippet}
</Story>

<Story name="Bottom">
	{#snippet template()}
		<div class="flex items-center justify-center p-16">
			<WithTooltip text="Create issue" side="bottom">
				{#snippet asChild(props)}
					<button
						{...props}
						class="inline-flex h-8 items-center rounded-md border border-border bg-surface-2 px-3 text-sm text-foreground"
					>
						Hover me
					</button>
				{/snippet}
			</WithTooltip>
		</div>
	{/snippet}
</Story>

<Story name="Left">
	{#snippet template()}
		<div class="flex items-center justify-center p-16">
			<WithTooltip text="Filter issues" side="left">
				{#snippet asChild(props)}
					<button
						{...props}
						class="inline-flex h-8 items-center rounded-md border border-border bg-surface-2 px-3 text-sm text-foreground"
					>
						Hover me
					</button>
				{/snippet}
			</WithTooltip>
		</div>
	{/snippet}
</Story>

<Story name="Right">
	{#snippet template()}
		<div class="flex items-center justify-center p-16">
			<WithTooltip text="Forest view" side="right">
				{#snippet asChild(props)}
					<button
						{...props}
						class="inline-flex h-8 items-center rounded-md border border-border bg-surface-2 px-3 text-sm text-foreground"
					>
						Hover me
					</button>
				{/snippet}
			</WithTooltip>
		</div>
	{/snippet}
</Story>

<Story name="Long Text">
	{#snippet template()}
		<div class="flex items-center justify-center p-16">
			<WithTooltip
				text="Updated 5 minutes ago — click to refresh with the latest data"
				side="top"
			>
				{#snippet asChild(props)}
					<button
						{...props}
						class="inline-flex h-8 items-center rounded-md border border-border bg-surface-2 px-3 text-sm text-foreground"
					>
						Hover me (long text)
					</button>
				{/snippet}
			</WithTooltip>
		</div>
	{/snippet}
</Story>

<Story name="All Placements">
	{#snippet template()}
		<div class="grid grid-cols-2 gap-16 p-20">
			<div class="flex items-center justify-center">
				<WithTooltip text="Top · Sync now" side="top">
					{#snippet asChild(props)}
						<button
							{...props}
							class="inline-flex h-8 items-center rounded-md border border-border bg-surface-2 px-3 text-sm text-foreground"
						>
							Top
						</button>
					{/snippet}
				</WithTooltip>
			</div>
			<div class="flex items-center justify-center">
				<WithTooltip text="Bottom · Click to create" side="bottom">
					{#snippet asChild(props)}
						<button
							{...props}
							class="inline-flex h-8 items-center rounded-md border border-border bg-surface-2 px-3 text-sm text-foreground"
						>
							Bottom
						</button>
					{/snippet}
				</WithTooltip>
			</div>
			<div class="flex items-center justify-center">
				<WithTooltip text="Left · Show options" side="left">
					{#snippet asChild(props)}
						<button
							{...props}
							class="inline-flex h-8 items-center rounded-md border border-border bg-surface-2 px-3 text-sm text-foreground"
						>
							Left
						</button>
					{/snippet}
				</WithTooltip>
			</div>
			<div class="flex items-center justify-center">
				<WithTooltip text="Right · View forest" side="right">
					{#snippet asChild(props)}
						<button
							{...props}
							class="inline-flex h-8 items-center rounded-md border border-border bg-surface-2 px-3 text-sm text-foreground"
						>
							Right
						</button>
					{/snippet}
				</WithTooltip>
			</div>
		</div>
	{/snippet}
</Story>
