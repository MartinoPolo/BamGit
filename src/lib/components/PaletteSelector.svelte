<script lang="ts">
	import type { ColorPalette } from '$lib/types/color_palette';

	interface Props {
		palettes: ColorPalette[];
		selected_palette_id: string | null;
		on_select: (palette_id: string | null) => void;
	}

	let { palettes, selected_palette_id, on_select }: Props = $props();

	const default_palette_label = $derived(
		palettes.find((p) => p.is_built_in === true)?.name ?? 'Default',
	);
</script>

<label class="flex flex-col gap-1">
	<span class="text-xs text-muted-foreground">Color Palette</span>
	<select
		value={selected_palette_id ?? ''}
		onchange={(event) => {
			const value = event.currentTarget.value;
			on_select(value || null);
		}}
		class="rounded border border-input bg-muted px-3 py-2 text-sm text-foreground outline-none focus:border-ring"
	>
		<option value="">Default ({default_palette_label})</option>
		{#each palettes as palette (palette.id)}
			<option value={palette.id}>
				{palette.name}{palette.is_built_in === true ? '' : ' (custom)'}
			</option>
		{/each}
	</select>
</label>
