<script lang="ts">
	import * as Popover from '$lib/components/ui/popover/index.js';
	import type { ColorPickerProps } from './color_picker_types.js';
	import { DEFAULT_COLOR_PALETTE, getContrastTextColor, isValidHexColor } from './color_utils.js';

	let {
		selectedColor,
		onSelect,
		colors = DEFAULT_COLOR_PALETTE,
		usedColors = [],
		displayText,
		side = 'bottom',
		align = 'start',
	}: ColorPickerProps = $props();

	let open = $state(false);

	let effectiveColor = $derived(selectedColor || colors[0] || '#000000');

	function handlePresetClick(color: string) {
		onSelect(color);
		open = false;
	}

	function handleHexInput(event: Event) {
		const target = event.currentTarget as HTMLInputElement;
		const hex = target.value;
		if (isValidHexColor(hex)) {
			onSelect(hex);
		}
	}

	function handleNativeInput(event: Event) {
		const target = event.currentTarget as HTMLInputElement;
		onSelect(target.value);
	}
</script>

<Popover.Root bind:open>
	<Popover.Trigger>
		{#snippet child({ props })}
			<button
				type="button"
				{...props}
				class="h-8 w-8 rounded-md border border-border hover:border-border-strong"
				style="background-color: {effectiveColor}"
				aria-label="Color: {effectiveColor}"
			>
			</button>
		{/snippet}
	</Popover.Trigger>

	<Popover.Content {side} {align} class="w-[232px] p-3">
		<div class="grid grid-cols-6 gap-1.5">
			{#each colors as color (color)}
				{@const isUsed = usedColors.includes(color) && color !== effectiveColor}
				<button
					type="button"
					class="flex h-7 w-7 items-center justify-center rounded-sm border border-border transition-transform
						focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background
						{color === effectiveColor ? 'scale-110 ring-2 ring-ring ring-inset' : ''}
						{isUsed ? 'opacity-30 cursor-not-allowed' : 'hover:scale-105'}"
					style="background-color: {color}"
					disabled={isUsed}
					onclick={() => handlePresetClick(color)}
					aria-label={color}
				>
					{#if displayText}
						<span
							style="color: {getContrastTextColor(color)}"
							class="text-xs font-medium"
						>
							{displayText}
						</span>
					{/if}
				</button>
			{/each}
		</div>

		<div class="my-2 border-t border-border"></div>

		<div class="flex items-center gap-2">
			{#if displayText}
				<div
					class="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-border"
					style="background-color: {effectiveColor}"
				>
					<span
						style="color: {getContrastTextColor(effectiveColor)}"
						class="text-xs font-medium"
					>
						{displayText}
					</span>
				</div>
			{/if}
			<input
				type="text"
				value={effectiveColor}
				onchange={handleHexInput}
				class="h-8 flex-1 rounded-md border border-border bg-background px-2 text-sm"
				placeholder="#000000"
			/>
			<input
				type="color"
				value={effectiveColor}
				oninput={handleNativeInput}
				class="h-8 w-8 cursor-pointer rounded border border-border"
			/>
		</div>
	</Popover.Content>
</Popover.Root>
