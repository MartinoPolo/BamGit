<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import { TreeRenderer } from './index';
	import ThemeDecorator from '$lib/storybook/ThemeDecorator.svelte';

	const { Story } = defineMeta({
		title: 'Viz/TreeRenderer',
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
	import type { TreeVisualizationTree, TreeStage } from '$lib/types/tree_visualization';

	interface StoryArgs {
		visualization?: TreeVisualizationTree;
		accent_color: string;
		is_dark?: boolean;
	}

	const ALL_STAGES: TreeStage[] = [
		'seed',
		'sprouting',
		'sapling',
		'growing',
		'leafy',
		'fruiting',
		'autumn',
		'ready',
		'bare',
		'dead',
		'stump',
	];

	function make_tree(
		stage: TreeVisualizationTree['stage'],
		extras: Partial<TreeVisualizationTree> = {},
	): TreeVisualizationTree {
		return {
			kind: 'tree',
			stage,
			overlays: [],
			companionSaplings: [],
			activeTools: [],
			fruitTypes: [],
			...extras,
		};
	}
</script>

<Story
	name="Seed"
	args={{ visualization: make_tree('seed'), accent_color: '#22c55e', is_dark: false }}
>
	{#snippet template(args: StoryArgs)}
		<div class="w-32">
			<TreeRenderer
				visualization={args.visualization}
				accent_color={args.accent_color}
				is_dark={args.is_dark}
			/>
		</div>
	{/snippet}
</Story>

<Story
	name="Sprouting"
	args={{ visualization: make_tree('sprouting'), accent_color: '#22c55e', is_dark: false }}
>
	{#snippet template(args: StoryArgs)}
		<div class="w-32">
			<TreeRenderer
				visualization={args.visualization}
				accent_color={args.accent_color}
				is_dark={args.is_dark}
			/>
		</div>
	{/snippet}
</Story>

<Story
	name="Sapling"
	args={{ visualization: make_tree('sapling'), accent_color: '#3b82f6', is_dark: false }}
>
	{#snippet template(args: StoryArgs)}
		<div class="w-32">
			<TreeRenderer
				visualization={args.visualization}
				accent_color={args.accent_color}
				is_dark={args.is_dark}
			/>
		</div>
	{/snippet}
</Story>

<Story
	name="Growing"
	args={{ visualization: make_tree('growing'), accent_color: '#3b82f6', is_dark: false }}
>
	{#snippet template(args: StoryArgs)}
		<div class="w-32">
			<TreeRenderer
				visualization={args.visualization}
				accent_color={args.accent_color}
				is_dark={args.is_dark}
			/>
		</div>
	{/snippet}
</Story>

<Story
	name="Leafy"
	args={{ visualization: make_tree('leafy'), accent_color: '#10b981', is_dark: false }}
>
	{#snippet template(args: StoryArgs)}
		<div class="w-32">
			<TreeRenderer
				visualization={args.visualization}
				accent_color={args.accent_color}
				is_dark={args.is_dark}
			/>
		</div>
	{/snippet}
</Story>

<Story
	name="Fruiting"
	args={{
		visualization: make_tree('fruiting', { fruitTypes: ['apple', 'pear', 'cherry', 'orange'] }),
		accent_color: '#10b981',
		is_dark: false,
	}}
>
	{#snippet template(args: StoryArgs)}
		<div class="w-32">
			<TreeRenderer
				visualization={args.visualization}
				accent_color={args.accent_color}
				is_dark={args.is_dark}
			/>
		</div>
	{/snippet}
</Story>

<Story
	name="Autumn"
	args={{ visualization: make_tree('autumn'), accent_color: '#f59e0b', is_dark: false }}
>
	{#snippet template(args: StoryArgs)}
		<div class="w-32">
			<TreeRenderer
				visualization={args.visualization}
				accent_color={args.accent_color}
				is_dark={args.is_dark}
			/>
		</div>
	{/snippet}
</Story>

<Story
	name="Ready"
	args={{ visualization: make_tree('ready'), accent_color: '#8b5cf6', is_dark: false }}
>
	{#snippet template(args: StoryArgs)}
		<div class="w-32">
			<TreeRenderer
				visualization={args.visualization}
				accent_color={args.accent_color}
				is_dark={args.is_dark}
			/>
		</div>
	{/snippet}
</Story>

<Story
	name="Bare"
	args={{ visualization: make_tree('bare'), accent_color: '#6b7280', is_dark: false }}
>
	{#snippet template(args: StoryArgs)}
		<div class="w-32">
			<TreeRenderer
				visualization={args.visualization}
				accent_color={args.accent_color}
				is_dark={args.is_dark}
			/>
		</div>
	{/snippet}
</Story>

<Story
	name="Dead"
	args={{ visualization: make_tree('dead'), accent_color: '#6b7280', is_dark: false }}
>
	{#snippet template(args: StoryArgs)}
		<div class="w-32">
			<TreeRenderer
				visualization={args.visualization}
				accent_color={args.accent_color}
				is_dark={args.is_dark}
			/>
		</div>
	{/snippet}
</Story>

<Story
	name="Stump"
	args={{ visualization: make_tree('stump'), accent_color: '#6b7280', is_dark: false }}
>
	{#snippet template(args: StoryArgs)}
		<div class="w-32">
			<TreeRenderer
				visualization={args.visualization}
				accent_color={args.accent_color}
				is_dark={args.is_dark}
			/>
		</div>
	{/snippet}
</Story>

<Story
	name="All Stages Gallery"
	args={{ visualization: make_tree('seed'), accent_color: '#3b82f6', is_dark: false }}
>
	{#snippet template(args: StoryArgs)}
		<div class="grid grid-cols-4 gap-4">
			{#each ALL_STAGES as stage (stage)}
				<div class="flex flex-col items-center gap-1">
					<div class="w-24">
						<TreeRenderer
							visualization={make_tree(
								stage,
								stage === 'fruiting'
									? { fruitTypes: ['apple', 'pear', 'cherry'] }
									: {},
							)}
							accent_color={args.accent_color}
							is_dark={args.is_dark}
						/>
					</div>
					<span class="text-xs text-muted-foreground">{stage}</span>
				</div>
			{/each}
		</div>
	{/snippet}
</Story>
