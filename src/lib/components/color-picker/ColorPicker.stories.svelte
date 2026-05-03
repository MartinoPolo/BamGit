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
			isDarkMode: { control: 'boolean' },
			displayText: { control: 'text' },
			side: { control: 'select', options: ['top', 'bottom', 'left', 'right'] },
			align: { control: 'select', options: ['start', 'center', 'end'] },
		},
	});
</script>

<script lang="ts">
	import type { ColorPickerProps } from './color_picker_types.js';

	const USED_COLORS = ['#e53e3e', '#3182ce', '#38a169', '#805ad5'];

	let selectedColor = $state('#dd6b20');

	function handleSelect(color: string) {
		selectedColor = color;
	}
</script>

<Story name="Default" args={{ isDarkMode: false }}>
	{#snippet template(args: ColorPickerProps)}
		<div class="flex items-center gap-4">
			<ColorPicker {...args} {selectedColor} onSelect={handleSelect} />
			<span class="font-mono text-xs text-muted-foreground">{selectedColor}</span>
		</div>
	{/snippet}
</Story>

<Story name="With Display Text" args={{ isDarkMode: false, displayText: 'A' }}>
	{#snippet template(args: ColorPickerProps)}
		<div class="flex items-center gap-4">
			<ColorPicker {...args} {selectedColor} onSelect={handleSelect} />
			<span class="font-mono text-xs text-muted-foreground">{selectedColor}</span>
		</div>
	{/snippet}
</Story>

<Story name="With Used Colors" args={{ isDarkMode: false, displayText: 'A' }}>
	{#snippet template(args: ColorPickerProps)}
		<div class="flex flex-col gap-3">
			<p class="text-xs text-muted-foreground">
				Grayed-out swatches are assigned to other issues
			</p>
			<div class="flex items-center gap-4">
				<ColorPicker
					{...args}
					usedColors={USED_COLORS}
					{selectedColor}
					onSelect={handleSelect}
				/>
				<span class="font-mono text-xs text-muted-foreground">{selectedColor}</span>
			</div>
		</div>
	{/snippet}
</Story>

<Story name="Dark Mode" args={{ isDarkMode: true }}>
	{#snippet template(args: ColorPickerProps)}
		<div class="flex items-center gap-4">
			<ColorPicker {...args} {selectedColor} onSelect={handleSelect} />
			<span class="font-mono text-xs text-muted-foreground">{selectedColor}</span>
		</div>
	{/snippet}
</Story>

<Story name="Color Palettes">
	{#snippet template(args: ColorPickerProps)}
		<div class="flex gap-72 pb-72">
			<div>
				<p class="mb-2 text-sm font-medium text-muted-foreground">Light</p>
				<div data-theme="light" class="rounded-lg bg-background p-4">
					<ColorPicker
						{...args}
						{selectedColor}
						onSelect={handleSelect}
						open={true}
						portalDisabled={true}
					/>
				</div>
			</div>
			<div>
				<p class="mb-2 text-sm font-medium text-muted-foreground">Dark</p>
				<div data-theme="dark" class="rounded-lg bg-background p-4">
					<ColorPicker
						{...args}
						{selectedColor}
						onSelect={handleSelect}
						open={true}
						portalDisabled={true}
					/>
				</div>
			</div>
		</div>
	{/snippet}
</Story>
