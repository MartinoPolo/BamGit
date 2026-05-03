<script lang="ts">
	import { tick, untrack } from 'svelte';
	import * as Popover from '$lib/components/ui/popover/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import type { ColorPickerProps } from './color_picker_types.js';
	import { DEFAULT_COLOR_PALETTE, getContrastTextColor, isValidHexColor } from './color_utils.js';

	const GRID_COLUMNS = 6;

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
	let focusedIndex = $state(0);
	let swatchElements: HTMLButtonElement[] = [];

	let effectiveColor = $derived(selectedColor || colors[0] || '#000000');

	$effect(() => {
		if (open) {
			untrack(() => {
				const selectedIndex = colors.indexOf(effectiveColor);
				focusedIndex = selectedIndex >= 0 ? selectedIndex : 0;
				tick().then(() => {
					swatchElements[focusedIndex]?.focus();
				});
			});
		}
	});

	function isSwatchDisabled(color: string): boolean {
		return usedColors.includes(color) && color !== effectiveColor;
	}

	function findNextIndex(from: number, step: number): number {
		const total = colors.length;
		let index = from;
		for (let i = 0; i < total; i++) {
			index = (((index + step) % total) + total) % total;
			if (!isSwatchDisabled(colors[index])) {
				return index;
			}
		}
		return from;
	}

	function handleGridKeydown(event: KeyboardEvent) {
		let newIndex: number;

		switch (event.key) {
			case 'ArrowRight':
				newIndex = findNextIndex(focusedIndex, 1);
				break;
			case 'ArrowLeft':
				newIndex = findNextIndex(focusedIndex, -1);
				break;
			case 'ArrowDown':
				newIndex = findNextIndex(focusedIndex, GRID_COLUMNS);
				break;
			case 'ArrowUp':
				newIndex = findNextIndex(focusedIndex, -GRID_COLUMNS);
				break;
			default:
				return;
		}

		event.preventDefault();
		focusedIndex = newIndex;
		swatchElements[newIndex]?.focus();
	}

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
				class="h-7 w-7 rounded-md border border-border hover:scale-110"
				style="background-color: {effectiveColor}"
				aria-label="Color: {effectiveColor}"
			>
			</button>
		{/snippet}
	</Popover.Trigger>

	<Popover.Content
		{side}
		{align}
		class="w-58 p-3"
		portalProps={portalDisabled ? { disabled: true } : undefined}
	>
		<div class="grid grid-cols-6 gap-1.5">
			{#each colors as color, index (color)}
				{@const isUsed = isSwatchDisabled(color)}
				<button
					bind:this={swatchElements[index]}
					type="button"
					tabindex={index === focusedIndex ? 0 : -1}
					class="flex h-7 w-7 items-center justify-center rounded-sm border border-border outline-none transition-transform
						focus-visible:outline-solid focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-2
						{color === effectiveColor ? 'scale-110 ring-2 ring-ring ring-inset' : ''}
						{isUsed ? 'opacity-30 cursor-not-allowed' : 'hover:scale-110'}"
					style="background-color: {color}"
					disabled={isUsed}
					onkeydown={handleGridKeydown}
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
			<label
				class="relative flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-md border border-border shadow-sm transition-transform hover:scale-105"
				style="background-color: {effectiveColor}"
			>
				{#if displayText}
					<span
						style="color: {getContrastTextColor(effectiveColor)}"
						class="pointer-events-none text-xs font-medium"
					>
						{displayText}
					</span>
				{/if}
				<input
					type="color"
					value={effectiveColor}
					oninput={handleNativeInput}
					class="absolute inset-0 cursor-pointer opacity-0"
				/>
			</label>
			<Input
				type="text"
				value={effectiveColor}
				onchange={handleHexInput}
				class="min-w-0 flex-1"
				placeholder="#000000"
			/>
		</div>
	</Popover.Content>
</Popover.Root>
