<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import ColorThemePicker from './ColorThemePicker.svelte';
	import ThemeDecorator from '$lib/storybook/ThemeDecorator.svelte';
	import { CHART_COLOR_THEMES, type ChartColorTheme } from '$lib/modules/usage/usage_types.js';

	const { Story } = defineMeta({
		title: 'Blocks/Usage/ColorThemePicker',
		component: ColorThemePicker,
		// @ts-expect-error — Storybook decorator typing doesn't match Svelte 5 Component type
		decorators: [() => ThemeDecorator],
		tags: ['autodocs'],
	});
</script>

<script lang="ts">
	let selectedTheme = $state<ChartColorTheme>(CHART_COLOR_THEMES.monochrome);
</script>

<Story name="Default">
	{#snippet template()}
		<div class="flex items-start gap-4 p-8 pb-48">
			<ColorThemePicker
				value={selectedTheme}
				onchange={(theme) => {
					selectedTheme = theme;
				}}
			/>
			<span class="text-sm text-muted-foreground">Selected: {selectedTheme}</span>
		</div>
	{/snippet}
</Story>

<Story name="Traffic Light Selected">
	{#snippet template()}
		<div class="flex items-start gap-4 p-8 pb-48">
			<ColorThemePicker
				value={CHART_COLOR_THEMES.trafficLight}
				onchange={(theme) => console.log('changed to', theme)}
			/>
		</div>
	{/snippet}
</Story>

<Story name="Gradient Selected">
	{#snippet template()}
		<div class="flex items-start gap-4 p-8 pb-48">
			<ColorThemePicker
				value={CHART_COLOR_THEMES.gradient}
				onchange={(theme) => console.log('changed to', theme)}
			/>
		</div>
	{/snippet}
</Story>
