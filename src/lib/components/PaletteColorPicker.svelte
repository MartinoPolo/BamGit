<script lang="ts">
	interface Props {
		colors: string[];
		selected_color: string;
		on_select: (color: string) => void;
	}

	let { colors, selected_color, on_select }: Props = $props();

	let custom_color_input = $state('');
	let show_custom_input = $state(false);
</script>

<fieldset class="flex flex-col gap-1">
	<legend class="text-xs text-neutral-400">Color</legend>
	<div class="flex flex-wrap gap-1.5">
		{#each colors as swatch (swatch)}
			<button
				type="button"
				onclick={() => on_select(swatch)}
				class="h-6 w-6 rounded-sm transition-transform {selected_color === swatch
					? 'scale-125 ring-2 ring-white ring-offset-1 ring-offset-neutral-900'
					: 'hover:scale-110'}"
				style="background-color: {swatch}"
				title={swatch}
			></button>
		{/each}
		<!-- Custom color toggle -->
		<button
			type="button"
			onclick={() => {
				show_custom_input = !show_custom_input;
				if (show_custom_input) {
					custom_color_input = selected_color;
				}
			}}
			class="flex h-6 w-6 items-center justify-center rounded-sm border border-dashed border-neutral-600 text-xs text-neutral-500 transition-colors hover:border-neutral-400 hover:text-neutral-300"
			title="Custom color"
		>
			#
		</button>
	</div>
	{#if show_custom_input}
		<div class="mt-1 flex items-center gap-2">
			<input
				type="color"
				value={selected_color}
				oninput={(event) => {
					const target = event.currentTarget;
					custom_color_input = target.value;
					on_select(target.value);
				}}
				class="h-8 w-8 cursor-pointer rounded border border-neutral-700 bg-neutral-800"
			/>
			<input
				type="text"
				bind:value={custom_color_input}
				placeholder="#ff0000"
				class="w-24 rounded border border-neutral-700 bg-neutral-800 px-2 py-1 text-xs text-neutral-100 outline-none focus:border-blue-500"
				onkeydown={(event) => {
					if (event.key === 'Enter') {
						event.preventDefault();
						const trimmed = custom_color_input.trim();
						if (/^#[0-9a-fA-F]{6}$/.test(trimmed)) {
							on_select(trimmed);
						}
					}
				}}
			/>
		</div>
	{/if}
</fieldset>
