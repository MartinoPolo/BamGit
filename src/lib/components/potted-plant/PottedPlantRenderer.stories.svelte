<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import { PottedPlantRenderer } from './index';
	import ThemeDecorator from '$lib/storybook/ThemeDecorator.svelte';

	const { Story } = defineMeta({
		title: 'Viz/PottedPlantRenderer',
		component: PottedPlantRenderer,
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
	import type {
		TreeVisualizationPottedPlant,
		PottedPlantStage,
	} from '$lib/types/tree_visualization';

	interface StoryArgs {
		visualization?: TreeVisualizationPottedPlant;
		accent_color: string;
		is_dark?: boolean;
	}

	const ALL_STAGES: PottedPlantStage[] = [
		'pot-with-soil',
		'sprout',
		'small-plant',
		'flowering',
		'dried',
	];

	function make_plant(
		stage: PottedPlantStage,
		extras: Partial<TreeVisualizationPottedPlant> = {},
	): TreeVisualizationPottedPlant {
		return {
			kind: 'potted-plant',
			stage,
			overlays: [],
			...extras,
		};
	}
</script>

<Story
	name="Pot with Soil"
	args={{ visualization: make_plant('pot-with-soil'), accent_color: '#22c55e', is_dark: false }}
>
	{#snippet template(args: StoryArgs)}
		<div class="w-24">
			<PottedPlantRenderer
				visualization={args.visualization}
				accent_color={args.accent_color}
				is_dark={args.is_dark}
			/>
		</div>
	{/snippet}
</Story>

<Story
	name="Sprout"
	args={{ visualization: make_plant('sprout'), accent_color: '#22c55e', is_dark: false }}
>
	{#snippet template(args: StoryArgs)}
		<div class="w-24">
			<PottedPlantRenderer
				visualization={args.visualization}
				accent_color={args.accent_color}
				is_dark={args.is_dark}
			/>
		</div>
	{/snippet}
</Story>

<Story
	name="Small Plant"
	args={{ visualization: make_plant('small-plant'), accent_color: '#3b82f6', is_dark: false }}
>
	{#snippet template(args: StoryArgs)}
		<div class="w-24">
			<PottedPlantRenderer
				visualization={args.visualization}
				accent_color={args.accent_color}
				is_dark={args.is_dark}
			/>
		</div>
	{/snippet}
</Story>

<Story
	name="Flowering"
	args={{ visualization: make_plant('flowering'), accent_color: '#ec4899', is_dark: false }}
>
	{#snippet template(args: StoryArgs)}
		<div class="w-24">
			<PottedPlantRenderer
				visualization={args.visualization}
				accent_color={args.accent_color}
				is_dark={args.is_dark}
			/>
		</div>
	{/snippet}
</Story>

<Story
	name="Dried"
	args={{ visualization: make_plant('dried'), accent_color: '#6b7280', is_dark: false }}
>
	{#snippet template(args: StoryArgs)}
		<div class="w-24">
			<PottedPlantRenderer
				visualization={args.visualization}
				accent_color={args.accent_color}
				is_dark={args.is_dark}
			/>
		</div>
	{/snippet}
</Story>

<Story
	name="All Stages Gallery"
	args={{ visualization: make_plant('pot-with-soil'), accent_color: '#22c55e', is_dark: false }}
>
	{#snippet template(args: StoryArgs)}
		<div class="grid grid-cols-5 gap-4">
			{#each ALL_STAGES as stage (stage)}
				<div class="flex flex-col items-center gap-1">
					<div class="w-20">
						<PottedPlantRenderer
							visualization={make_plant(stage)}
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

<Story
	name="Dark Mode Gallery"
	args={{ visualization: make_plant('pot-with-soil'), accent_color: '#22c55e', is_dark: true }}
>
	{#snippet template(args: StoryArgs)}
		<div class="grid grid-cols-5 gap-4 rounded-lg bg-background p-4">
			{#each ALL_STAGES as stage (stage)}
				<div class="flex flex-col items-center gap-1">
					<div class="w-20">
						<PottedPlantRenderer
							visualization={make_plant(stage)}
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
