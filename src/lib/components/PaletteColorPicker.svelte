<script lang="ts">
	interface Props {
		colors: string[];
		selectedColor: string;
		onSelect: (color: string) => void;
	}

	let { colors, selectedColor, onSelect }: Props = $props();

	let customColorInput = $state('');
	let showCustomInput = $state(false);
</script>

<fieldset class="flex flex-col gap-1">
	<legend class="text-xs text-muted-foreground">Color</legend>
	<div class="flex flex-wrap gap-1.5">
		{#each colors as swatch (swatch)}
			<button
				type="button"
				onclick={() => onSelect(swatch)}
				class="h-6 w-6 rounded-sm transition-transform {selectedColor === swatch
					? 'scale-125 ring-2 ring-foreground ring-offset-1 ring-offset-background'
					: 'hover:scale-110'}"
				style="background-color: {swatch}"
				title={swatch}
			></button>
		{/each}
		<!-- Custom color toggle -->
		<button
			type="button"
			onclick={() => {
				showCustomInput = !showCustomInput;
				if (showCustomInput) {
					customColorInput = selectedColor;
				}
			}}
			class="flex h-6 w-6 items-center justify-center rounded-sm border border-dashed border-input text-xs text-muted-foreground transition-colors hover:border-border hover:text-foreground"
			title="Custom color"
		>
			#
		</button>
	</div>
	{#if showCustomInput}
		<div class="mt-1 flex items-center gap-2">
			<input
				type="color"
				value={selectedColor}
				oninput={(event) => {
					const target = event.currentTarget;
					customColorInput = target.value;
					onSelect(target.value);
				}}
				class="h-8 w-8 cursor-pointer rounded border border-border bg-muted"
			/>
			<input
				type="text"
				bind:value={customColorInput}
				placeholder="#ff0000"
				class="w-24 rounded border border-input bg-muted px-2 py-1 text-xs text-foreground outline-none focus:border-ring"
				onkeydown={(event) => {
					if (event.key === 'Enter') {
						event.preventDefault();
						const trimmed = customColorInput.trim();
						if (/^#[0-9a-fA-F]{6}$/.test(trimmed)) {
							onSelect(trimmed);
						}
					}
				}}
			/>
		</div>
	{/if}
</fieldset>
