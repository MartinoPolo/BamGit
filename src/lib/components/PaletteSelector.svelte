<script lang="ts">
	import type { ColorPalette } from '$lib/types/color_palette';

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

<label class="flex flex-col gap-1">
	<span class="text-xs text-muted-foreground">Color Palette</span>
	<select
		value={selectedPaletteId ?? ''}
		onchange={(event) => {
			const value = event.currentTarget.value;
			onSelect(value || null);
		}}
		class="rounded border border-input bg-muted px-3 py-2 text-sm text-foreground outline-none focus:border-ring"
	>
		<option value="">Default ({defaultPaletteLabel})</option>
		{#each palettes as palette (palette.id)}
			<option value={palette.id}>
				{palette.name}{palette.is_built_in === true ? '' : ' (custom)'}
			</option>
		{/each}
	</select>
</label>
