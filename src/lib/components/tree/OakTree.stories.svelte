<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import { TreeRenderer } from './index';
	import ThemeDecorator from '$lib/storybook/ThemeDecorator.svelte';

	const { Story } = defineMeta({
		title: 'Viz/OakTree',
		component: TreeRenderer,
		// @ts-expect-error — Storybook decorator typing doesn't match Svelte 5 Component type
		decorators: [() => ThemeDecorator],
		tags: ['autodocs'],
		argTypes: {
			accent_color: { control: 'color' },
			is_dark: { control: 'boolean' },
		},
	});
</script>

<script lang="ts">
	import type { TreeVisualization, TreeVisualizationOak } from '$lib/types/tree_visualization';

	interface StoryArgs {
		visualization?: TreeVisualization;
		accent_color: string;
		is_dark?: boolean;
	}

	function make_oak(overrides: Partial<TreeVisualizationOak> = {}): TreeVisualizationOak {
		return {
			kind: 'oak',
			title: 'Forest Dashboard',
			completionRatio: 0,
			overlays: [],
			...overrides,
		};
	}
</script>

<Story
	name="Empty (0%)"
	args={{
		visualization: make_oak({ completionRatio: 0 }),
		accent_color: '#22c55e',
		is_dark: false,
	}}
>
	{#snippet template(args: StoryArgs)}
		<div class="w-40">
			<TreeRenderer
				visualization={args.visualization}
				accent_color={args.accent_color}
				is_dark={args.is_dark}
			/>
		</div>
	{/snippet}
</Story>

<Story
	name="Quarter (25%)"
	args={{
		visualization: make_oak({ completionRatio: 0.25 }),
		accent_color: '#22c55e',
		is_dark: false,
	}}
>
	{#snippet template(args: StoryArgs)}
		<div class="w-40">
			<TreeRenderer
				visualization={args.visualization}
				accent_color={args.accent_color}
				is_dark={args.is_dark}
			/>
		</div>
	{/snippet}
</Story>

<Story
	name="Half (50%)"
	args={{
		visualization: make_oak({ completionRatio: 0.5 }),
		accent_color: '#22c55e',
		is_dark: false,
	}}
>
	{#snippet template(args: StoryArgs)}
		<div class="w-40">
			<TreeRenderer
				visualization={args.visualization}
				accent_color={args.accent_color}
				is_dark={args.is_dark}
			/>
		</div>
	{/snippet}
</Story>

<Story
	name="Full (100%)"
	args={{
		visualization: make_oak({ completionRatio: 1 }),
		accent_color: '#22c55e',
		is_dark: false,
	}}
>
	{#snippet template(args: StoryArgs)}
		<div class="w-40">
			<TreeRenderer
				visualization={args.visualization}
				accent_color={args.accent_color}
				is_dark={args.is_dark}
			/>
		</div>
	{/snippet}
</Story>

<Story
	name="Dark Mode"
	args={{
		visualization: make_oak({ completionRatio: 0.75 }),
		accent_color: '#22c55e',
		is_dark: true,
	}}
>
	{#snippet template(args: StoryArgs)}
		<div class="w-40">
			<TreeRenderer
				visualization={args.visualization}
				accent_color={args.accent_color}
				is_dark={args.is_dark}
			/>
		</div>
	{/snippet}
</Story>

<Story
	name="Long Title"
	args={{
		visualization: make_oak({
			completionRatio: 0.6,
			title: 'Very Long Epic Name That Should Truncate',
		}),
		accent_color: '#3b82f6',
		is_dark: false,
	}}
>
	{#snippet template(args: StoryArgs)}
		<div class="w-40">
			<TreeRenderer
				visualization={args.visualization}
				accent_color={args.accent_color}
				is_dark={args.is_dark}
			/>
		</div>
	{/snippet}
</Story>

<Story name="Growth Gallery" args={{ accent_color: '#22c55e', is_dark: false }}>
	{#snippet template(args: StoryArgs)}
		<div class="grid grid-cols-5 gap-4">
			{#each [0, 0.25, 0.5, 0.75, 1] as ratio (ratio)}
				<div class="flex flex-col items-center gap-1">
					<div class="w-32">
						<TreeRenderer
							visualization={make_oak({ completionRatio: ratio, title: 'Epic PRD' })}
							accent_color={args.accent_color}
							is_dark={args.is_dark}
						/>
					</div>
					<span class="text-xs text-muted-foreground">{Math.round(ratio * 100)}%</span>
				</div>
			{/each}
		</div>
	{/snippet}
</Story>
