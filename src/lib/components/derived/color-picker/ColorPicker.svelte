<script lang="ts">
	import { tick, untrack } from 'svelte';
	import * as Popover from '$lib/components/shadcn/popover/index.js';
	import type { ColorPickerProps } from './color_picker_types.js';
	import { DEFAULT_COLOR_PALETTE, getContrastTextColor } from './color_utils.js';
	import ColorPickerContent from './ColorPickerContent.svelte';

	let {
		selectedColor,
		onSelect,
		colors = DEFAULT_COLOR_PALETTE,
		usedColors = [],
		displayText,
		side = 'bottom',
		align = 'start',
		open = $bindable(false),
		portalDisabled = false,
	}: ColorPickerProps = $props();

	let contentRef: ReturnType<typeof ColorPickerContent> | undefined = $state();

	let effectiveColor = $derived(selectedColor || colors[0] || '#000000');

	$effect(() => {
		if (open) {
			untrack(() => {
				tick().then(() => {
					contentRef?.focusSelected();
				});
			});
		}
	});
</script>

<Popover.Root bind:open>
	<Popover.Trigger>
		{#snippet child({ props })}
			<button
				type="button"
				{...props}
				class="h-7 w-7 rounded-md border border-border hover:scale-110"
				style="background-color: {effectiveColor}"
				aria-label="Color: {effectiveColor}"
			>
				{#if displayText}
					<span
						style="color: {getContrastTextColor(effectiveColor)}"
						class="text-xs font-medium"
					>
						{displayText}
					</span>
				{/if}
			</button>
		{/snippet}
	</Popover.Trigger>

	<Popover.Content
		{side}
		{align}
		class="w-58 p-3"
		portalProps={portalDisabled ? { disabled: true } : undefined}
	>
		<ColorPickerContent
			bind:this={contentRef}
			{selectedColor}
			{onSelect}
			{colors}
			{usedColors}
			{displayText}
			closeOnPresetClick
			onClose={() => (open = false)}
		/>
	</Popover.Content>
</Popover.Root>
