<script lang="ts">
	import type { ColorPalette, CreateColorPaletteRequest } from '$lib/types/color_palette';
	import { get_color_palette_store } from '$lib/stores/color_palettes.svelte';
	import {
		create_color_palette,
		update_color_palette,
		delete_color_palette,
	} from '$lib/tauri/color_palette_commands';
	const palette_store = get_color_palette_store();

	let creating = $state(false);
	let new_palette_name = $state('');
	let new_palette_colors_input = $state('');
	let editing_palette_id = $state<string | null>(null);
	let edit_name = $state('');
	let edit_colors_input = $state('');
	let operation_error = $state<string | null>(null);

	const built_in_palettes = $derived(
		palette_store.palettes.filter((p) => p.is_built_in === true),
	);
	const custom_palettes = $derived(palette_store.palettes.filter((p) => p.is_built_in === false));

	function parse_colors(input: string): string[] {
		return input
			.split(/[,\s]+/)
			.map((c) => c.trim())
			.filter((c) => /^#[0-9a-fA-F]{6}$/.test(c));
	}

	async function handle_create() {
		const colors = parse_colors(new_palette_colors_input);
		if (!new_palette_name.trim() || colors.length === 0) {
			operation_error = 'Name and at least one valid hex color (#rrggbb) required';
			return;
		}

		try {
			const request: CreateColorPaletteRequest = {
				name: new_palette_name.trim(),
				colors,
			};
			await create_color_palette(request);
			await palette_store.refresh();
			new_palette_name = '';
			new_palette_colors_input = '';
			creating = false;
			operation_error = null;
		} catch (err) {
			operation_error = String(err);
		}
	}

	function start_editing(palette: ColorPalette) {
		editing_palette_id = palette.id;
		edit_name = palette.name;
		edit_colors_input = palette.colors.join(', ');
		operation_error = null;
	}

	async function handle_save_edit() {
		if (editing_palette_id === null) {
			return;
		}
		const colors = parse_colors(edit_colors_input);
		if (!edit_name.trim() || colors.length === 0) {
			operation_error = 'Name and at least one valid hex color required';
			return;
		}

		try {
			await update_color_palette({
				id: editing_palette_id,
				name: edit_name.trim(),
				colors,
			});
			await palette_store.refresh();
			editing_palette_id = null;
			operation_error = null;
		} catch (err) {
			operation_error = String(err);
		}
	}

	async function handle_delete(id: string) {
		try {
			await delete_color_palette(id);
			await palette_store.refresh();
			operation_error = null;
		} catch (err) {
			operation_error = String(err);
		}
	}
</script>

<div class="space-y-6">
	<h1 class="text-xl font-semibold">Settings</h1>

	<!-- Color Palettes Section -->
	<section class="space-y-4">
		<h2 class="text-lg font-medium">Color Palettes</h2>
		<p class="text-sm text-neutral-500">
			Manage color palettes for issue visual identity. Built-in palettes cannot be modified.
		</p>

		{#if operation_error}
			<p class="rounded bg-red-900/30 px-3 py-2 text-sm text-red-400">{operation_error}</p>
		{/if}

		<!-- Built-in palettes (read-only) -->
		{#each built_in_palettes as palette (palette.id)}
			<div class="rounded border border-neutral-700 bg-neutral-800/50 p-3">
				<div class="mb-2 flex items-center gap-2">
					<span class="text-sm font-medium">{palette.name}</span>
					<span class="rounded bg-neutral-700 px-1.5 py-0.5 text-xs text-neutral-400"
						>built-in</span
					>
				</div>
				<div class="flex flex-wrap gap-1">
					{#each palette.colors as color (color)}
						<div
							class="h-5 w-5 rounded-sm"
							style="background-color: {color}"
							title={color}
						></div>
					{/each}
				</div>
			</div>
		{/each}

		<!-- Custom palettes (editable) -->
		{#each custom_palettes as palette (palette.id)}
			<div class="rounded border border-neutral-700 bg-neutral-800/50 p-3">
				{#if editing_palette_id === palette.id}
					<!-- Edit mode -->
					<div class="space-y-2">
						<input
							bind:value={edit_name}
							class="w-full rounded border border-neutral-600 bg-neutral-800 px-2 py-1 text-sm text-neutral-100 outline-none focus:border-blue-500"
							placeholder="Palette name"
						/>
						<textarea
							bind:value={edit_colors_input}
							rows="2"
							class="w-full rounded border border-neutral-600 bg-neutral-800 px-2 py-1 text-xs text-neutral-300 outline-none focus:border-blue-500"
							placeholder="#ff0000, #00ff00, #0000ff"
						></textarea>
						<div class="flex gap-2">
							<button
								type="button"
								onclick={handle_save_edit}
								class="rounded bg-blue-600 px-3 py-1 text-xs text-white hover:bg-blue-500"
							>
								Save
							</button>
							<button
								type="button"
								onclick={() => {
									editing_palette_id = null;
									operation_error = null;
								}}
								class="rounded px-3 py-1 text-xs text-neutral-400 hover:text-neutral-200"
							>
								Cancel
							</button>
						</div>
					</div>
				{:else}
					<!-- View mode -->
					<div class="mb-2 flex items-center justify-between">
						<span class="text-sm font-medium">{palette.name}</span>
						<div class="flex gap-2">
							<button
								type="button"
								onclick={() => start_editing(palette)}
								class="text-xs text-neutral-400 hover:text-neutral-200"
							>
								Edit
							</button>
							<button
								type="button"
								onclick={() => handle_delete(palette.id)}
								class="text-xs text-red-400 hover:text-red-300"
							>
								Delete
							</button>
						</div>
					</div>
					<div class="flex flex-wrap gap-1">
						{#each palette.colors as color (color)}
							<div
								class="h-5 w-5 rounded-sm"
								style="background-color: {color}"
								title={color}
							></div>
						{/each}
					</div>
				{/if}
			</div>
		{/each}

		<!-- Create new palette -->
		{#if creating}
			<div class="rounded border border-dashed border-neutral-600 p-3">
				<div class="space-y-2">
					<input
						bind:value={new_palette_name}
						class="w-full rounded border border-neutral-600 bg-neutral-800 px-2 py-1 text-sm text-neutral-100 outline-none focus:border-blue-500"
						placeholder="Palette name"
					/>
					<textarea
						bind:value={new_palette_colors_input}
						rows="3"
						class="w-full rounded border border-neutral-600 bg-neutral-800 px-2 py-1 text-xs text-neutral-300 outline-none focus:border-blue-500"
						placeholder="Paste hex colors separated by commas or spaces: #ff0000, #00ff00, #0000ff"
					></textarea>
					<div class="flex gap-2">
						<button
							type="button"
							onclick={handle_create}
							class="rounded bg-blue-600 px-3 py-1 text-xs text-white hover:bg-blue-500"
						>
							Create Palette
						</button>
						<button
							type="button"
							onclick={() => {
								creating = false;
								operation_error = null;
							}}
							class="rounded px-3 py-1 text-xs text-neutral-400 hover:text-neutral-200"
						>
							Cancel
						</button>
					</div>
				</div>
			</div>
		{:else}
			<button
				type="button"
				onclick={() => {
					creating = true;
					operation_error = null;
				}}
				class="rounded border border-dashed border-neutral-600 px-4 py-2 text-sm text-neutral-400 transition-colors hover:border-neutral-500 hover:text-neutral-300"
			>
				+ Add Custom Palette
			</button>
		{/if}
	</section>
</div>
