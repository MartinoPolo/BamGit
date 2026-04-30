<script lang="ts">
	import * as m from '$lib/paraglide/messages.js';
	import NotificationSettingsPanel from '$lib/components/NotificationSettingsPanel.svelte';
	import ShortcutSettingsPanel from '$lib/components/ShortcutSettingsPanel.svelte';
	import { useBoard, ACCENT_COLORS, type CreateColorPaletteRequest } from '$lib/modules/board';
	import { Input } from '$lib/components/ui/input/index.js';
	import type { ColorPalette } from '$lib/types/generated';
	const boardStore = useBoard();

	let creating = $state(false);
	let newPaletteName = $state('');
	let newPaletteColorsInput = $state('');
	let editingPaletteId = $state<string | null>(null);
	let editName = $state('');
	let editColorsInput = $state('');
	let operationError = $state<string | null>(null);
	let editUsername = $state(boardStore.username);
	let editInitials = $state(boardStore.userInitials);

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
			operationError = m.palette_validation_error();
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
			operationError = m.palette_validation_error_edit();
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
	<h1 class="text-xl font-semibold">{m.settings_title()}</h1>
	<!-- User Profile Section -->
	<section class="space-y-4">
		<h2 class="text-lg font-medium">{m.settings_user_title()}</h2>
		<p class="text-sm text-muted-foreground">
			{m.settings_user_description()}
		</p>
		<div class="flex flex-col gap-3 sm:flex-row sm:items-end">
			<div class="flex-1 space-y-1">
				<label for="username-input" class="text-xs text-muted-foreground"
					>{m.settings_username_label()}</label
				>
				<Input
					id="username-input"
					bind:value={editUsername}
					onchange={() => {
						boardStore.username = editUsername;
					}}
				/>
			</div>
			<div class="w-24 space-y-1">
				<label for="initials-input" class="text-xs text-muted-foreground"
					>{m.settings_initials_label()}</label
				>
				<Input
					id="initials-input"
					bind:value={editInitials}
					onchange={() => {
						boardStore.userInitials = editInitials;
					}}
					maxlength={3}
				/>
			</div>
		</div>
	</section>

	<NotificationSettingsPanel />

	<!-- Accent Color Section -->
	<section class="space-y-4">
		<h2 class="text-lg font-medium">{m.settings_accent_title()}</h2>
		<p class="text-sm text-muted-foreground">
			{m.settings_accent_description()}
		</p>
		<div class="flex flex-wrap gap-3">
			{#each ACCENT_COLORS as color (color)}
				<button
					type="button"
					onclick={() => {
						boardStore.theme.accent = color;
					}}
					class="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm capitalize transition-all {boardStore
						.theme.accent === color
						? 'border-primary bg-surface-2 font-medium'
						: 'border-border hover:border-border-strong hover:bg-surface-2'}"
				>
					<div
						class="size-4 rounded-full"
						style:background-color="var(--{color}-500)"
					></div>
					{color}
				</button>
			{/each}
		</div>
	</section>

	<ShortcutSettingsPanel />

	<!-- Color Palettes Section -->
	<section class="space-y-4">
		<h2 class="text-lg font-medium">{m.palette_settings_title()}</h2>
		<p class="text-sm text-muted-foreground">
			{m.palette_settings_description()}
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
						>{m.palette_built_in()}</span
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
							placeholder={m.palette_placeholder_name()}
						/>
						<textarea
							bind:value={editColorsInput}
							rows="2"
							class="w-full rounded border border-input bg-muted px-2 py-1 text-xs text-foreground outline-none focus:border-ring"
							placeholder={m.palette_placeholder_colors()}
						></textarea>
						<div class="flex gap-2">
							<button
								type="button"
								onclick={handleSaveEdit}
								class="rounded bg-primary px-3 py-1 text-xs text-primary-foreground hover:bg-primary/90"
							>
								{m.btn_save()}
							</button>
							<button
								type="button"
								onclick={() => {
									editingPaletteId = null;
									operationError = null;
								}}
								class="rounded px-3 py-1 text-xs text-muted-foreground hover:text-foreground"
							>
								{m.btn_cancel()}
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
								{m.issue_card_edit()}
							</button>
							<button
								type="button"
								onclick={() => handleDelete(palette.id)}
								class="text-xs text-destructive hover:text-destructive/80"
							>
								{m.btn_delete()}
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
						placeholder={m.palette_placeholder_name()}
					/>
					<textarea
						bind:value={newPaletteColorsInput}
						rows="3"
						class="w-full rounded border border-input bg-muted px-2 py-1 text-xs text-foreground outline-none focus:border-ring"
						placeholder={m.palette_placeholder_colors_long()}
					></textarea>
					<div class="flex gap-2">
						<button
							type="button"
							onclick={handleCreate}
							class="rounded bg-primary px-3 py-1 text-xs text-primary-foreground hover:bg-primary/90"
						>
							{m.palette_create()}
						</button>
						<button
							type="button"
							onclick={() => {
								creating = false;
								operationError = null;
							}}
							class="rounded px-3 py-1 text-xs text-muted-foreground hover:text-foreground"
						>
							{m.btn_cancel()}
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
				{m.palette_add_custom()}
			</button>
		{/if}
	</section>
</div>
