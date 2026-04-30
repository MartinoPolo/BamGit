<script lang="ts">
	import NotificationSettingsPanel from '$lib/components/NotificationSettingsPanel.svelte';
	import ShortcutSettingsPanel from '$lib/components/ShortcutSettingsPanel.svelte';
	import { useBoard, type CreateColorPaletteRequest } from '$lib/modules/board';
	import type { ColorPalette } from '$lib/types/generated';
	const boardStore = useBoard();

	let creating = $state(false);
	let newPaletteName = $state('');
	let newPaletteColorsInput = $state('');
	let editingPaletteId = $state<string | null>(null);
	let editName = $state('');
	let editColorsInput = $state('');
	let operationError = $state<string | null>(null);

	const builtInPalettes = $derived(boardStore.palettes.filter((p) => p.is_built_in === true));
	const customPalettes = $derived(boardStore.palettes.filter((p) => p.is_built_in === false));

	function parseColors(input: string): string[] {
		return input
			.split(/[,\s]+/)
			.map((c) => c.trim())
			.filter((c) => /^#[0-9a-fA-F]{6}$/.test(c));
	}

	async function handleCreate() {
		const colors = parseColors(newPaletteColorsInput);
		if (!newPaletteName.trim() || colors.length === 0) {
			operationError = 'Name and at least one valid hex color (#rrggbb) required';
			return;
		}

		try {
			const request: CreateColorPaletteRequest = {
				name: newPaletteName.trim(),
				colors,
			};
			await boardStore.createPalette(request);
			await boardStore.refreshPalettes();
			newPaletteName = '';
			newPaletteColorsInput = '';
			creating = false;
			operationError = null;
		} catch (err) {
			operationError = String(err);
		}
	}

	function startEditing(palette: ColorPalette) {
		editingPaletteId = palette.id;
		editName = palette.name;
		editColorsInput = palette.colors.join(', ');
		operationError = null;
	}

	async function handleSaveEdit() {
		if (editingPaletteId === null) {
			return;
		}
		const colors = parseColors(editColorsInput);
		const trimmedName = editName.trim();
		if (!trimmedName || colors.length === 0) {
			operationError = 'Name and at least one valid hex color required';
			return;
		}
		try {
			await boardStore.updatePalette({
				id: editingPaletteId,
				name: trimmedName,
				colors,
			});
			await boardStore.refreshPalettes();
			editingPaletteId = null;
			operationError = null;
		} catch (err) {
			operationError = String(err);
		}
	}

	async function handleDelete(id: string) {
		try {
			await boardStore.deletePalette(id);
			await boardStore.refreshPalettes();
			operationError = null;
		} catch (err) {
			operationError = String(err);
		}
	}
</script>

<div class="space-y-6 p-4">
	<h1 class="text-xl font-semibold">Settings</h1>
	<NotificationSettingsPanel />
	<ShortcutSettingsPanel />

	<!-- Color Palettes Section -->
	<section class="space-y-4">
		<h2 class="text-lg font-medium">Color Palettes</h2>
		<p class="text-sm text-muted-foreground">
			Manage color palettes for issue visual identity. Built-in palettes cannot be modified.
		</p>

		{#if operationError}
			<p class="rounded bg-destructive/20 px-3 py-2 text-sm text-destructive">
				{operationError}
			</p>
		{/if}

		<!-- Built-in palettes (read-only) -->
		{#each builtInPalettes as palette (palette.id)}
			<div class="rounded border border-border bg-muted/50 p-3">
				<div class="mb-2 flex items-center gap-2">
					<span class="text-sm font-medium">{palette.name}</span>
					<span class="rounded bg-secondary px-1.5 py-0.5 text-xs text-muted-foreground"
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
		{#each customPalettes as palette (palette.id)}
			<div class="rounded border border-border bg-muted/50 p-3">
				{#if editingPaletteId === palette.id}
					<!-- Edit mode -->
					<div class="space-y-2">
						<input
							bind:value={editName}
							class="w-full rounded border border-input bg-muted px-2 py-1 text-sm text-foreground outline-none focus:border-ring"
							placeholder="Palette name"
						/>
						<textarea
							bind:value={editColorsInput}
							rows="2"
							class="w-full rounded border border-input bg-muted px-2 py-1 text-xs text-foreground outline-none focus:border-ring"
							placeholder="#ff0000, #00ff00, #0000ff"
						></textarea>
						<div class="flex gap-2">
							<button
								type="button"
								onclick={handleSaveEdit}
								class="rounded bg-primary px-3 py-1 text-xs text-primary-foreground hover:bg-primary/90"
							>
								Save
							</button>
							<button
								type="button"
								onclick={() => {
									editingPaletteId = null;
									operationError = null;
								}}
								class="rounded px-3 py-1 text-xs text-muted-foreground hover:text-foreground"
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
								onclick={() => startEditing(palette)}
								class="text-xs text-muted-foreground hover:text-foreground"
							>
								Edit
							</button>
							<button
								type="button"
								onclick={() => handleDelete(palette.id)}
								class="text-xs text-destructive hover:text-destructive/80"
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
			<div class="rounded border border-dashed border-input p-3">
				<div class="space-y-2">
					<input
						bind:value={newPaletteName}
						class="w-full rounded border border-input bg-muted px-2 py-1 text-sm text-foreground outline-none focus:border-ring"
						placeholder="Palette name"
					/>
					<textarea
						bind:value={newPaletteColorsInput}
						rows="3"
						class="w-full rounded border border-input bg-muted px-2 py-1 text-xs text-foreground outline-none focus:border-ring"
						placeholder="Paste hex colors separated by commas or spaces: #ff0000, #00ff00, #0000ff"
					></textarea>
					<div class="flex gap-2">
						<button
							type="button"
							onclick={handleCreate}
							class="rounded bg-primary px-3 py-1 text-xs text-primary-foreground hover:bg-primary/90"
						>
							Create Palette
						</button>
						<button
							type="button"
							onclick={() => {
								creating = false;
								operationError = null;
							}}
							class="rounded px-3 py-1 text-xs text-muted-foreground hover:text-foreground"
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
					operationError = null;
				}}
				class="rounded border border-dashed border-input px-4 py-2 text-sm text-muted-foreground transition-colors hover:border-border hover:text-foreground"
			>
				+ Add Custom Palette
			</button>
		{/if}
	</section>
</div>
