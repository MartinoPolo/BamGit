<script lang="ts">
	import * as m from '$lib/paraglide/messages.js';
	import type { ColorPalette } from '$lib/types/generated';
	import { Label } from '$lib/components/ui/label/index.js';
	import { Select } from '$lib/components/ui/select/index.js';

	interface Props {
		palettes: ColorPalette[];
		selectedPaletteId: string | null;
		onSelect: (paletteId: string | null) => void;
	}

	let { palettes, selectedPaletteId, onSelect }: Props = $props();

	const defaultPaletteLabel = $derived(
		palettes.find((p) => p.is_built_in === true)?.name ?? 'Default',
	);
</script>

<div class="flex flex-col gap-1.5">
	<Label for="palette-select">{m.palette_color_palette()}</Label>
	<Select
		id="palette-select"
		value={selectedPaletteId ?? ''}
		onchange={(event) => {
			const value = event.currentTarget.value;
			onSelect(value !== '' ? value : null);
		}}
	>
		<option value="">{m.palette_default({ name: defaultPaletteLabel })}</option>
		{#each palettes as palette (palette.id)}
			<option value={palette.id}>
				{palette.name}{palette.is_built_in === true ? '' : ` ${m.palette_custom()}`}
			</option>
		{/each}
	</Select>
</div>
