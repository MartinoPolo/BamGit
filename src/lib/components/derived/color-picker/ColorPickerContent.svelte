<script lang="ts">
	import { tick, untrack } from 'svelte';
	import { Input } from '$lib/components/shadcn/input/index.js';
	import type { ColorPickerContentProps } from './color_picker_types.js';
	import { DEFAULT_COLOR_PALETTE, getContrastTextColor, isValidHexColor } from './color_utils.js';

	const GRID_COLUMNS = 6;

	let {
		selectedColor,
		onSelect,
		onPresetClick,
		colors = DEFAULT_COLOR_PALETTE,
		usedColors = [],
		displayText,
		autofocus = false,
		closeOnPresetClick = false,
		onClose,
	}: ColorPickerContentProps = $props();

	let focusedIndex = $state(0);
	let swatchElements: HTMLButtonElement[] = $state([]);

	let effectiveColor = $derived(selectedColor || colors[0] || '#000000');

	$effect(() => {
		if (autofocus) {
			untrack(() => {
				const selectedIndex = colors.indexOf(effectiveColor);
				focusedIndex = selectedIndex >= 0 ? selectedIndex : 0;
				tick().then(() => {
					swatchElements[focusedIndex]?.focus();
				});
			});
		}
	});

	export function focusSelected() {
		const selectedIndex = colors.indexOf(effectiveColor);
		focusedIndex = selectedIndex >= 0 ? selectedIndex : 0;
		tick().then(() => {
			swatchElements[focusedIndex]?.focus();
		});
	}

	export function handleArrowKey(key: string) {
		let step: number;
		switch (key) {
			case 'ArrowRight':
				step = 1;
				break;
			case 'ArrowLeft':
				step = -1;
				break;
			case 'ArrowDown':
				step = GRID_COLUMNS;
				break;
			case 'ArrowUp':
				step = -GRID_COLUMNS;
				break;
			default:
				return;
		}

		const newIndex = findNextIndex(focusedIndex, step);
		focusedIndex = newIndex;
		swatchElements[newIndex]?.focus();
		onSelect(colors[newIndex]);
	}

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
		event.stopPropagation();
		focusedIndex = newIndex;
		swatchElements[newIndex]?.focus();
		onSelect(colors[newIndex]);
	}

	function handlePresetClickInternal(color: string) {
		if (onPresetClick) {
			onPresetClick(color);
		} else {
			onSelect(color);
		}
		if (closeOnPresetClick) {
			onClose?.();
		}
	}

	function handleHexInput(event: Event) {
		const target = event.currentTarget as HTMLInputElement;
		const hex = target.value;
		if (isValidHexColor(hex)) {
			onSelect(hex);
		}
	}

	function handleHexKeydown(event: KeyboardEvent) {
		if (event.key === 'Enter') {
			event.preventDefault();
			const target = event.currentTarget as HTMLInputElement;
			const hex = target.value;
			if (isValidHexColor(hex)) {
				onSelect(hex);
			}
		}
	}

	function handleNativeInput(event: Event) {
		const target = event.currentTarget as HTMLInputElement;
		onSelect(target.value);
	}
</script>

<div class="mx-auto grid w-fit grid-cols-6 gap-1.5">
	{#each colors as color, index (color)}
		{@const isUsed = isSwatchDisabled(color)}
		<button
			bind:this={swatchElements[index]}
			type="button"
			tabindex={index === focusedIndex ? 0 : -1}
			class="flex h-7 w-7 items-center justify-center rounded-sm border border-border outline-none transition-transform duration-2
				{color === effectiveColor ? 'scale-110 ring-2 ring-ring ring-inset' : ''}
				{isUsed ? 'opacity-30 cursor-not-allowed' : 'hover:scale-110'}"
			style="background-color: {color}"
			disabled={isUsed}
			onkeydown={handleGridKeydown}
			onclick={() => handlePresetClickInternal(color)}
			aria-label={color}
		>
			{#if displayText}
				<span
					style="color: {getContrastTextColor(color)}"
					class="pointer-events-none select-none text-xs font-medium"
				>
					{displayText}
				</span>
			{/if}
		</button>
	{/each}
</div>

<div class="mt-2 flex flex-1 items-center justify-center gap-2">
	<label
		class="relative flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-md border border-border shadow-sm transition-transform duration-2 hover:scale-105"
		style="background-color: {effectiveColor}"
	>
		{#if displayText}
			<span
				style="color: {getContrastTextColor(effectiveColor)}"
				class="pointer-events-none select-none text-xs font-medium"
			>
				{displayText}
			</span>
		{/if}
		<input
			type="color"
			value={effectiveColor}
			oninput={handleNativeInput}
			class="absolute inset-0 cursor-pointer opacity-0"
			aria-label="Custom color"
		/>
	</label>
	<Input
		type="text"
		value={effectiveColor}
		onchange={handleHexInput}
		onkeydown={handleHexKeydown}
		class="min-w-0 flex-1"
		placeholder="#000000"
		aria-label="Hex color value"
	/>
</div>
