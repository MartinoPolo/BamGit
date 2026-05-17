<script lang="ts">
	import * as m from '$lib/paraglide/messages.js';
	import { useBoard, ACCENT_COLORS, type CreateColorPaletteRequest } from '$lib/modules/board';
	import { useSettings } from '$lib/modules/settings';
	import { Button } from '$lib/components/shadcn/button/index.js';
	import { Input } from '$lib/components/shadcn/input/index.js';
	import { Textarea } from '$lib/components/shadcn/textarea/index.js';
	import { Tabs, Tab } from '$lib/components/shadcn/tabs/index.js';
	import SettingOverrideIndicator from '$lib/components/derived/setting-override-indicator/SettingOverrideIndicator.svelte';
	import type { ColorPalette } from '$lib/types/generated';
	import Sun from '@lucide/svelte/icons/sun';
	import Moon from '@lucide/svelte/icons/moon';
	import Monitor from '@lucide/svelte/icons/monitor';

	const boardStore = useBoard();
	const settingsCtx = useSettings();
	const themeMode = $derived(settingsCtx.getThemeMode());
	const accentColor = $derived(settingsCtx.getAccentColor());
	const themeOverridden = $derived(settingsCtx.isOverridden('themeMode'));
	const accentOverridden = $derived(settingsCtx.isOverridden('accentColor'));

	let creating = $state(false);
	let newPaletteName = $state('');
	let newPaletteColorsInput = $state('');
	let editingPaletteId = $state<string | null>(null);
	let editName = $state('');
	let editColorsInput = $state('');
	let operationError = $state<string | null>(null);

	const themeModes = [
		{ value: 'light' as const, Icon: Sun, label: () => m.theme_light() },
		{ value: 'dark' as const, Icon: Moon, label: () => m.theme_dark() },
		{ value: 'system' as const, Icon: Monitor, label: () => m.theme_system() },
	];

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

<div class="space-y-8">
	<!-- Theme Mode -->
	<section class="space-y-4">
		<div class="flex items-center gap-2">
			<div>
				<h2 class="text-lg font-medium">Theme</h2>
				<p class="mt-1 text-sm text-muted-foreground">Choose how the app looks.</p>
			</div>
			<SettingOverrideIndicator
				overridden={themeOverridden}
				onreset={() => void settingsCtx.resetOverride('themeMode')}
			/>
		</div>
		<Tabs class="w-fit *:justify-center">
			{#each themeModes as { value, Icon, label } (value)}
				<Tab
					active={themeMode === value}
					onclick={() => void settingsCtx.set('themeMode', value)}
				>
					<Icon class="size-4" />
					<span>{label()}</span>
				</Tab>
			{/each}
		</Tabs>
	</section>

	<!-- Accent Color -->
	<section class="space-y-4">
		<div class="flex items-center gap-2">
			<div>
				<h2 class="text-lg font-medium">{m.settings_accent_title()}</h2>
				<p class="mt-1 text-sm text-muted-foreground">
					{m.settings_accent_description()}
				</p>
			</div>
			<SettingOverrideIndicator
				overridden={accentOverridden}
				onreset={() => void settingsCtx.resetOverride('accentColor')}
			/>
		</div>
		<div class="flex flex-wrap gap-3">
			{#each ACCENT_COLORS as color (color)}
				<Button
					intent="secondary"
					size="sm"
					onclick={() => void settingsCtx.set('accentColor', color)}
					class="capitalize {accentColor === color
						? 'border-primary bg-surface-2 font-medium'
						: ''}"
				>
					<div
						class="size-4 rounded-full"
						style:background-color="var(--{color}-500)"
					></div>
					{color}
				</Button>
			{/each}
		</div>
	</section>

	<!-- Color Palettes -->
	<section class="space-y-4">
		<div>
			<h2 class="text-lg font-medium">{m.palette_settings_title()}</h2>
			<p class="mt-1 text-sm text-muted-foreground">
				{m.palette_settings_description()}
			</p>
		</div>

		{#if operationError}
			<p class="rounded bg-destructive/20 px-3 py-2 text-sm text-destructive">
				{operationError}
			</p>
		{/if}

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
							class="size-5 rounded-sm"
							style="background-color: {color}"
							title={color}
						></div>
					{/each}
				</div>
			</div>
		{/each}

		{#each customPalettes as palette (palette.id)}
			<div class="rounded border border-border bg-muted/50 p-3">
				{#if editingPaletteId === palette.id}
					<div class="space-y-2">
						<Input bind:value={editName} placeholder={m.palette_placeholder_name()} />
						<Textarea
							bind:value={editColorsInput}
							rows={2}
							class="text-xs"
							placeholder={m.palette_placeholder_colors()}
						/>
						<div class="flex gap-2">
							<Button size="sm" onclick={handleSaveEdit}>
								{m.btn_save()}
							</Button>
							<Button
								intent="ghost"
								size="sm"
								onclick={() => {
									editingPaletteId = null;
									operationError = null;
								}}
							>
								{m.btn_cancel()}
							</Button>
						</div>
					</div>
				{:else}
					<div class="mb-2 flex items-center justify-between">
						<span class="text-sm font-medium">{palette.name}</span>
						<div class="flex gap-2">
							<Button intent="ghost" size="sm" onclick={() => startEditing(palette)}>
								{m.issue_card_edit()}
							</Button>
							<Button
								intent="danger"
								size="sm"
								onclick={() => handleDelete(palette.id)}
							>
								{m.btn_delete()}
							</Button>
						</div>
					</div>
					<div class="flex flex-wrap gap-1">
						{#each palette.colors as color (color)}
							<div
								class="size-5 rounded-sm"
								style="background-color: {color}"
								title={color}
							></div>
						{/each}
					</div>
				{/if}
			</div>
		{/each}

		{#if creating}
			<div class="rounded border border-dashed border-input p-3">
				<div class="space-y-2">
					<Input bind:value={newPaletteName} placeholder={m.palette_placeholder_name()} />
					<Textarea
						bind:value={newPaletteColorsInput}
						rows={3}
						class="text-xs"
						placeholder={m.palette_placeholder_colors_long()}
					/>
					<div class="flex gap-2">
						<Button size="sm" onclick={handleCreate}>
							{m.palette_create()}
						</Button>
						<Button
							intent="ghost"
							size="sm"
							onclick={() => {
								creating = false;
								operationError = null;
							}}
						>
							{m.btn_cancel()}
						</Button>
					</div>
				</div>
			</div>
		{:else}
			<Button
				intent="secondary"
				onclick={() => {
					creating = true;
					operationError = null;
				}}
			>
				{m.palette_add_custom()}
			</Button>
		{/if}
	</section>
</div>
