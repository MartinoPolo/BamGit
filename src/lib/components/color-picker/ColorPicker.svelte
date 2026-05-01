<script lang="ts">
	import { Input } from '$lib/components/ui/input/index.js';
	import type { ColorPickerProps } from './color_picker_types.js';
	import { isValidHexColor, sortColorsByLuminance, getContrastTextColor } from './color_utils.js';

	let {
		variant = 'palette-hex-native',
		colors = [],
		selectedColor,
		usedColors = [],
		isDarkMode = false,
		onSelect,
	}: ColorPickerProps = $props();

	let hexInput = $derived(selectedColor ?? '');

	const showPalette = $derived(variant !== 'hex');
	const showHexInput = $derived(variant !== 'palette');
	const showNativePicker = $derived(variant === 'palette-hex-native');

	const sortedColors = $derived(sortColorsByLuminance(colors, isDarkMode));

	const usedColorSet = $derived(new Set(usedColors.map((c) => c.toLowerCase())));

	const hexInputValid = $derived(hexInput.trim() === '' || isValidHexColor(hexInput.trim()));

	function isUsed(color: string): boolean {
		return usedColorSet.has(color.toLowerCase());
	}

	function isSelected(color: string): boolean {
		return (selectedColor ?? '').toLowerCase() === color.toLowerCase();
	}

	function handleSwatchClick(color: string) {
		if (isUsed(color) && !isSelected(color)) {
			return;
		}
		if (isSelected(color)) {
			onSelect('');
		} else {
			onSelect(color);
		}
	}

	function handleHexKeydown(event: KeyboardEvent) {
		if (event.key === 'Enter') {
			event.preventDefault();
			const trimmed = hexInput.trim();
			if (isValidHexColor(trimmed)) {
				onSelect(trimmed);
			}
		}
	}

	function handleNativePickerInput(event: Event) {
		const target = event.currentTarget as HTMLInputElement;
		hexInput = target.value;
		onSelect(target.value);
	}

	const previewColor = $derived(
		selectedColor && isValidHexColor(selectedColor) ? selectedColor : '#525252',
	);

	const previewTextColor = $derived(getContrastTextColor(previewColor));
</script>

<fieldset class="flex flex-col gap-2">
	<legend class="text-xs text-muted-foreground">Color</legend>

	{#if showPalette}
		<div class="flex flex-wrap gap-1.5">
			{#each sortedColors as swatch (swatch)}
				{@const used = isUsed(swatch)}
				{@const selected = isSelected(swatch)}
				{@const textColor = getContrastTextColor(swatch)}
				<button
					type="button"
					onclick={() => handleSwatchClick(swatch)}
					disabled={used && !selected}
					class="relative flex h-7 w-7 items-center justify-center rounded-sm text-xs font-bold transition-transform
						{selected
						? 'scale-125 ring-2 ring-foreground ring-offset-1 ring-offset-background'
						: used
							? 'cursor-not-allowed opacity-40 grayscale'
							: 'hover:scale-110'}"
					style="background-color: {swatch}"
					title={used && !selected ? `${swatch} (in use)` : swatch}
				>
					<span style="color: {textColor}">A</span>
				</button>
			{/each}
		</div>
	{/if}

	{#if showHexInput || showNativePicker}
		<div class="flex items-center gap-2">
			{#if showNativePicker}
				<input
					type="color"
					value={previewColor}
					oninput={handleNativePickerInput}
					class="h-8 w-8 cursor-pointer rounded border border-border bg-muted"
				/>
			{/if}

			{#if showHexInput}
				<div class="flex items-center gap-2">
					<Input
						bind:value={hexInput}
						placeholder="#ff0000"
						class="w-24 text-xs {hexInputValid ? '' : 'border-destructive'}"
						onkeydown={handleHexKeydown}
					/>
					<div
						class="flex h-8 w-8 items-center justify-center rounded border border-border text-sm font-bold"
						style="background-color: {previewColor}; color: {previewTextColor}"
					>
						A
					</div>
				</div>
			{/if}
		</div>
	{/if}
</fieldset>
