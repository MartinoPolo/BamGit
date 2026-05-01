<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import { ColorPicker } from './index.js';
	import ThemeDecorator from '$lib/storybook/ThemeDecorator.svelte';

	const { Story } = defineMeta({
		title: 'Components/ColorPicker',
		component: ColorPicker,
		// @ts-expect-error — Storybook decorator typing doesn't match Svelte 5 Component type
		decorators: [() => ThemeDecorator],
		tags: ['autodocs'],
		argTypes: {
			variant: {
				control: 'select',
				options: ['palette', 'palette-hex', 'palette-hex-native', 'hex'],
			},
			isDarkMode: { control: 'boolean' },
		},
	});
</script>

<script lang="ts">
	import type { ColorPickerProps } from './color_picker_types.js';

	const SAMPLE_COLORS = [
		'#ef4444',
		'#f97316',
		'#f59e0b',
		'#eab308',
		'#84cc16',
		'#22c55e',
		'#10b981',
		'#14b8a6',
		'#06b6d4',
		'#0ea5e9',
		'#3b82f6',
		'#6366f1',
		'#8b5cf6',
		'#a855f7',
		'#d946ef',
		'#ec4899',
		'#f43f5e',
		'#fb923c',
		'#34d399',
		'#818cf8',
	];

	const USED_COLORS = ['#ef4444', '#3b82f6', '#22c55e', '#a855f7'];

	let selectedColor = $state('#f97316');

	function handleSelect(color: string) {
		if (color === '') {
			selectedColor = '#525252';
		} else {
			selectedColor = color;
		}
	}
</script>

<Story name="Palette Only" args={{ variant: 'palette', isDarkMode: false }}>
	{#snippet template(args: ColorPickerProps)}
		<ColorPicker {...args} colors={SAMPLE_COLORS} {selectedColor} onSelect={handleSelect} />
	{/snippet}
</Story>

<Story name="Palette + Hex" args={{ variant: 'palette-hex', isDarkMode: false }}>
	{#snippet template(args: ColorPickerProps)}
		<ColorPicker {...args} colors={SAMPLE_COLORS} {selectedColor} onSelect={handleSelect} />
	{/snippet}
</Story>

<Story name="Palette + Hex + Native" args={{ variant: 'palette-hex-native', isDarkMode: false }}>
	{#snippet template(args: ColorPickerProps)}
		<ColorPicker {...args} colors={SAMPLE_COLORS} {selectedColor} onSelect={handleSelect} />
	{/snippet}
</Story>

<Story name="Hex Only" args={{ variant: 'hex', isDarkMode: false }}>
	{#snippet template(args: ColorPickerProps)}
		<ColorPicker {...args} {selectedColor} onSelect={handleSelect} />
	{/snippet}
</Story>

<Story name="With Used Colors" args={{ variant: 'palette-hex-native', isDarkMode: false }}>
	{#snippet template(args: ColorPickerProps)}
		<div class="flex flex-col gap-3">
			<p class="text-xs text-muted-foreground">
				Gray swatches are already assigned to other issues
			</p>
			<ColorPicker
				{...args}
				colors={SAMPLE_COLORS}
				usedColors={USED_COLORS}
				{selectedColor}
				onSelect={handleSelect}
			/>
		</div>
	{/snippet}
</Story>

<Story name="Dark Mode Shade Order" args={{ variant: 'palette', isDarkMode: true }}>
	{#snippet template(args: ColorPickerProps)}
		<div class="flex flex-col gap-3">
			<p class="text-xs text-muted-foreground">Darker shades sorted to top in dark mode</p>
			<ColorPicker {...args} colors={SAMPLE_COLORS} {selectedColor} onSelect={handleSelect} />
		</div>
	{/snippet}
</Story>

<Story name="Light Mode Shade Order" args={{ variant: 'palette', isDarkMode: false }}>
	{#snippet template(args: ColorPickerProps)}
		<div class="flex flex-col gap-3">
			<p class="text-xs text-muted-foreground">Lighter shades sorted to top in light mode</p>
			<ColorPicker {...args} colors={SAMPLE_COLORS} {selectedColor} onSelect={handleSelect} />
		</div>
	{/snippet}
</Story>

<Story name="All Variants" args={{ isDarkMode: false }}>
	{#snippet template(args: ColorPickerProps)}
		<div class="flex flex-col gap-6">
			{#each ['palette', 'palette-hex', 'palette-hex-native', 'hex'] as const as variant (variant)}
				<div>
					<p class="mb-2 text-sm text-muted-foreground">{variant}</p>
					<ColorPicker
						{...args}
						{variant}
						colors={SAMPLE_COLORS}
						{selectedColor}
						onSelect={handleSelect}
					/>
				</div>
			{/each}
		</div>
	{/snippet}
</Story>
