<script lang="ts">
	import * as m from '$lib/paraglide/messages.js';
	import NotificationSettingsPanel from '$lib/components/NotificationSettingsPanel.svelte';
	import ShortcutSettingsPanel from '$lib/components/ShortcutSettingsPanel.svelte';
	import { useBoard, ACCENT_COLORS, type CreateColorPaletteRequest } from '$lib/modules/board';
	import { useVersionControl } from '$lib/modules/version-control';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Textarea } from '$lib/components/ui/textarea/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import GitHubStatusCard from '$lib/components/GitHubStatusCard.svelte';
	import GitHubAuthWizard from '$lib/components/GitHubAuthWizard.svelte';
	import type { ColorPalette } from '$lib/types/generated';
	import { invoke } from '$lib/tauri.js';

	const boardStore = useBoard();
	const versionControl = useVersionControl();

	let authWizardOpen = $state(false);

	let creating = $state(false);
	let newPaletteName = $state('');
	let newPaletteColorsInput = $state('');
	let editingPaletteId = $state<string | null>(null);
	let editName = $state('');
	let editColorsInput = $state('');
	let operationError = $state<string | null>(null);
	let editUsername = $state(boardStore.username);
	let editInitials = $state(boardStore.userInitials);
	let seedStatus = $state<'idle' | 'seeding' | 'deleting'>('idle');
	let seedMessage = $state<{ type: 'success' | 'error'; text: string } | null>(null);

	async function handleSeedDemo() {
		seedStatus = 'seeding';
		seedMessage = null;
		try {
			await invoke('seed_demo_workspace');
			seedMessage = { type: 'success', text: 'Demo workspace created successfully.' };
		} catch (err) {
			seedMessage = { type: 'error', text: String(err) };
		}
		seedStatus = 'idle';
	}

	async function handleDeleteDemo() {
		seedStatus = 'deleting';
		seedMessage = null;
		try {
			await invoke('delete_demo_workspace');
			seedMessage = { type: 'success', text: 'Demo workspace deleted.' };
		} catch (err) {
			seedMessage = { type: 'error', text: String(err) };
		}
		seedStatus = 'idle';
	}

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
				<Label for="username-input">{m.settings_username_label()}</Label>
				<Input
					id="username-input"
					bind:value={editUsername}
					onchange={() => {
						boardStore.username = editUsername;
					}}
				/>
			</div>
			<div class="w-24 space-y-1">
				<Label for="initials-input">{m.settings_initials_label()}</Label>
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

	<!-- GitHub Connection Section -->
	<section class="space-y-4">
		<h2 class="text-lg font-medium">GitHub</h2>
		<p class="text-sm text-muted-foreground">
			Connect your GitHub account to sync issues, pull requests, and branches.
		</p>

		<GitHubStatusCard
			authStatus={versionControl.authStatus}
			ghAvailability={versionControl.ghAvailability}
			onconnect={() => (authWizardOpen = true)}
			ondisconnect={async () => {
				await invoke('github_logout');
				await versionControl.checkAvailability();
			}}
		/>

		{#if !versionControl.authStatus.status.startsWith('oauth') && versionControl.ghAvailability === 'available'}
			<p class="text-xs text-muted-foreground">
				Using the gh CLI for GitHub access. Connect via OAuth for a richer experience
				without the CLI dependency.
			</p>
		{/if}
	</section>

	<GitHubAuthWizard
		bind:open={authWizardOpen}
		onconnected={() => void versionControl.checkAvailability()}
	/>

	<NotificationSettingsPanel />

	<!-- Accent Color Section -->
	<section class="space-y-4">
		<h2 class="text-lg font-medium">{m.settings_accent_title()}</h2>
		<p class="text-sm text-muted-foreground">
			{m.settings_accent_description()}
		</p>
		<div class="flex flex-wrap gap-3">
			{#each ACCENT_COLORS as color (color)}
				<Button
					variant="secondary"
					size="sm"
					onclick={() => {
						boardStore.theme.accent = color;
					}}
					class="capitalize {boardStore.theme.accent === color
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
								variant="ghost"
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
					<!-- View mode -->
					<div class="mb-2 flex items-center justify-between">
						<span class="text-sm font-medium">{palette.name}</span>
						<div class="flex gap-2">
							<Button variant="ghost" size="sm" onclick={() => startEditing(palette)}>
								{m.issue_card_edit()}
							</Button>
							<Button
								variant="danger"
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
							variant="ghost"
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
				variant="secondary"
				onclick={() => {
					creating = true;
					operationError = null;
				}}
			>
				{m.palette_add_custom()}
			</Button>
		{/if}
	</section>

	<!-- Developer Tools Section (dev builds only) -->
	{#if import.meta.env.DEV}
		<section class="space-y-4 border-t border-border pt-6">
			<h2 class="text-lg font-medium">Developer Tools</h2>
			<p class="text-sm text-muted-foreground">
				Seed a demo workspace with test data covering every tree stage, accessory, and
				blocking relationship. For development and visual testing only.
			</p>

			{#if seedMessage}
				<p
					class="rounded px-3 py-2 text-sm {seedMessage.type === 'success'
						? 'bg-[color-mix(in_oklch,var(--status-success)_14%,transparent)] text-status-success'
						: 'bg-destructive/20 text-destructive'}"
				>
					{seedMessage.text}
				</p>
			{/if}

			<div class="flex flex-wrap gap-3">
				<Button
					variant="secondary"
					disabled={seedStatus !== 'idle'}
					onclick={handleSeedDemo}
				>
					{seedStatus === 'seeding' ? 'Seeding...' : 'Seed Demo Workspace'}
				</Button>
				<Button
					variant="danger"
					disabled={seedStatus !== 'idle'}
					onclick={handleDeleteDemo}
				>
					{seedStatus === 'deleting' ? 'Deleting...' : 'Delete Demo Workspace'}
				</Button>
			</div>
		</section>
	{/if}
</div>
