<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import ThemeDecorator from '$lib/storybook/ThemeDecorator.svelte';

	const { Story } = defineMeta({
		title: 'Viz/Tree Gallery',
		// @ts-expect-error — Storybook decorator typing doesn't match Svelte 5 Component type
		decorators: [() => ThemeDecorator],
		tags: ['autodocs'],
	});
</script>

<script lang="ts">
	import type { Component } from 'svelte';
	import { VIEWBOX_WIDTH, VIEWBOX_HEIGHT } from '../types';
	import type { AccentColors } from '../types';
	import {
		compute_accent_colors,
		compute_trunk_color,
		compute_ground_color,
	} from '../color_utils';
	import StackedFir from './StackedFir.svelte';
	import RoundedOak from './RoundedOak.svelte';
	import MosaicPoplar from './MosaicPoplar.svelte';
	import GnarledAncient from './GnarledAncient.svelte';
	import ClusterBirch from './ClusterBirch.svelte';
	import GhibliHill from './GhibliHill.svelte';
	import WillowDrape from './WillowDrape.svelte';
	import BonsaiTwist from './BonsaiTwist.svelte';
	import LayeredBeech from './LayeredBeech.svelte';
	import PrismPine from './PrismPine.svelte';

	type VariantComponent = Component<{
		accent: AccentColors;
		trunk_color: string;
		ground_color: string;
	}>;

	interface VariantEntry {
		readonly name: string;
		readonly component: VariantComponent;
		readonly poly_count: number;
	}

	const VARIANTS: readonly VariantEntry[] = [
		{ name: 'Stacked Fir', component: StackedFir as VariantComponent, poly_count: 47 },
		{ name: 'Rounded Oak', component: RoundedOak as VariantComponent, poly_count: 50 },
		{ name: 'Mosaic Poplar', component: MosaicPoplar as VariantComponent, poly_count: 62 },
		{ name: 'Gnarled Ancient', component: GnarledAncient as VariantComponent, poly_count: 63 },
		{ name: 'Cluster Birch', component: ClusterBirch as VariantComponent, poly_count: 53 },
		{ name: 'Ghibli Hill', component: GhibliHill as VariantComponent, poly_count: 64 },
		{ name: 'Willow Drape', component: WillowDrape as VariantComponent, poly_count: 41 },
		{ name: 'Bonsai Twist', component: BonsaiTwist as VariantComponent, poly_count: 45 },
		{ name: 'Layered Beech', component: LayeredBeech as VariantComponent, poly_count: 62 },
		{ name: 'Prism Pine', component: PrismPine as VariantComponent, poly_count: 118 },
	];

	// Fixed accent for fair cross-variant comparison (approximates OKLCH 0.62 0.15 140)
	const GALLERY_ACCENT_HEX = '#22c55e';

	const accent = compute_accent_colors(GALLERY_ACCENT_HEX);
	const trunk_color_light = compute_trunk_color(false);
	const ground_color_light = compute_ground_color(false);
	const trunk_color_dark = compute_trunk_color(true);
	const ground_color_dark = compute_ground_color(true);
</script>

<Story name="All Variants">
	{#snippet template()}
		<div class="grid grid-cols-5 gap-4 p-4">
			{#each VARIANTS as variant (variant.name)}
				{@const Variant = variant.component}
				<div class="flex flex-col items-center gap-2">
					<svg
						viewBox="0 0 {VIEWBOX_WIDTH} {VIEWBOX_HEIGHT}"
						xmlns="http://www.w3.org/2000/svg"
						class="h-[240px] w-[200px]"
						role="img"
						aria-label={variant.name}
					>
						<Variant
							{accent}
							trunk_color={trunk_color_light}
							ground_color={ground_color_light}
						/>
					</svg>
					<div class="text-center">
						<div class="text-sm font-medium">{variant.name}</div>
						<div class="text-muted-foreground text-xs">{variant.poly_count} polys</div>
					</div>
				</div>
			{/each}
		</div>
	{/snippet}
</Story>

<Story name="All Variants (Dark Mode)">
	{#snippet template()}
		<div class="grid grid-cols-5 gap-4 bg-neutral-900 p-4">
			{#each VARIANTS as variant (variant.name)}
				{@const Variant = variant.component}
				<div class="flex flex-col items-center gap-2">
					<svg
						viewBox="0 0 {VIEWBOX_WIDTH} {VIEWBOX_HEIGHT}"
						xmlns="http://www.w3.org/2000/svg"
						class="h-[240px] w-[200px]"
						role="img"
						aria-label={variant.name}
					>
						<Variant
							{accent}
							trunk_color={trunk_color_dark}
							ground_color={ground_color_dark}
						/>
					</svg>
					<div class="text-center">
						<div class="text-sm font-medium text-neutral-100">{variant.name}</div>
						<div class="text-xs text-neutral-400">{variant.poly_count} polys</div>
					</div>
				</div>
			{/each}
		</div>
	{/snippet}
</Story>

<Story name="Forest Scale Preview">
	{#snippet template()}
		<div class="flex flex-col gap-6 p-4">
			<p class="text-muted-foreground text-sm">
				How each variant reads at actual forest-grid scale (100px wide, ~20 trees on screen)
			</p>
			<div class="grid grid-cols-10 gap-2">
				{#each VARIANTS as variant (variant.name)}
					{@const Variant = variant.component}
					<div class="flex flex-col items-center gap-1">
						<svg
							viewBox="0 0 {VIEWBOX_WIDTH} {VIEWBOX_HEIGHT}"
							xmlns="http://www.w3.org/2000/svg"
							class="h-[120px] w-[100px]"
							role="img"
							aria-label={variant.name}
						>
							<Variant
								{accent}
								trunk_color={trunk_color_light}
								ground_color={ground_color_light}
							/>
						</svg>
						<div class="text-center text-[10px]">{variant.name}</div>
					</div>
				{/each}
			</div>
		</div>
	{/snippet}
</Story>
