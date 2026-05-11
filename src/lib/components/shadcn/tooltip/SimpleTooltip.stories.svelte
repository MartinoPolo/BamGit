<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import { SimpleTooltip } from './index.js';
	import ThemeDecorator from '$lib/storybook/ThemeDecorator.svelte';

	const { Story } = defineMeta({
		title: 'Base/SimpleTooltip',
		component: SimpleTooltip,
		// @ts-expect-error — Storybook decorator typing doesn't match Svelte 5 Component type
		decorators: [() => ThemeDecorator],
		tags: ['autodocs'],
	});
</script>

<Story name="Top">
	{#snippet template()}
		<div class="flex items-center justify-center p-16">
			<SimpleTooltip text="Sync now" side="top">
				<button
					class="inline-flex h-8 items-center rounded-md border border-border bg-surface-2 px-3 text-sm text-foreground"
				>
					Hover me
				</button>
			</SimpleTooltip>
		</div>
	{/snippet}
</Story>

<Story name="Bottom">
	{#snippet template()}
		<div class="flex items-center justify-center p-16">
			<SimpleTooltip text="Create issue" side="bottom">
				<button
					class="inline-flex h-8 items-center rounded-md border border-border bg-surface-2 px-3 text-sm text-foreground"
				>
					Hover me
				</button>
			</SimpleTooltip>
		</div>
	{/snippet}
</Story>

<Story name="Left">
	{#snippet template()}
		<div class="flex items-center justify-center p-16">
			<SimpleTooltip text="Filter issues" side="left">
				<button
					class="inline-flex h-8 items-center rounded-md border border-border bg-surface-2 px-3 text-sm text-foreground"
				>
					Hover me
				</button>
			</SimpleTooltip>
		</div>
	{/snippet}
</Story>

<Story name="Right">
	{#snippet template()}
		<div class="flex items-center justify-center p-16">
			<SimpleTooltip text="Forest view" side="right">
				<button
					class="inline-flex h-8 items-center rounded-md border border-border bg-surface-2 px-3 text-sm text-foreground"
				>
					Hover me
				</button>
			</SimpleTooltip>
		</div>
	{/snippet}
</Story>

<Story name="Long Text">
	{#snippet template()}
		<div class="flex items-center justify-center p-16">
			<SimpleTooltip
				text="Updated 5 minutes ago — click to refresh with the latest data"
				side="top"
			>
				<button
					class="inline-flex h-8 items-center rounded-md border border-border bg-surface-2 px-3 text-sm text-foreground"
				>
					Hover me (long text)
				</button>
			</SimpleTooltip>
		</div>
	{/snippet}
</Story>

<Story name="All Placements">
	{#snippet template()}
		<div class="grid grid-cols-2 gap-16 p-20">
			<div class="flex items-center justify-center">
				<SimpleTooltip text="Top · Sync now" side="top">
					<button
						class="inline-flex h-8 items-center rounded-md border border-border bg-surface-2 px-3 text-sm text-foreground"
					>
						Top
					</button>
				</SimpleTooltip>
			</div>
			<div class="flex items-center justify-center">
				<SimpleTooltip text="Bottom · Create issue" side="bottom">
					<button
						class="inline-flex h-8 items-center rounded-md border border-border bg-surface-2 px-3 text-sm text-foreground"
					>
						Bottom
					</button>
				</SimpleTooltip>
			</div>
			<div class="flex items-center justify-center">
				<SimpleTooltip text="Left · Filter issues" side="left">
					<button
						class="inline-flex h-8 items-center rounded-md border border-border bg-surface-2 px-3 text-sm text-foreground"
					>
						Left
					</button>
				</SimpleTooltip>
			</div>
			<div class="flex items-center justify-center">
				<SimpleTooltip text="Right · Forest view" side="right">
					<button
						class="inline-flex h-8 items-center rounded-md border border-border bg-surface-2 px-3 text-sm text-foreground"
					>
						Right
					</button>
				</SimpleTooltip>
			</div>
		</div>
	{/snippet}
</Story>
