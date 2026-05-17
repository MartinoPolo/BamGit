<script lang="ts">
	import type { WorkspaceCommand, CommandCategory } from '$lib/types/generated';
	import { useBoard } from '$lib/modules/board';
	import { invoke } from '$lib/tauri.js';
	import { Input } from '$lib/components/shadcn/input/index.js';
	import { Label } from '$lib/components/shadcn/label/index.js';
	import { Button } from '$lib/components/shadcn/button/index.js';
	import { Separator } from '$lib/components/shadcn/separator/index.js';
	import { Badge } from '$lib/components/shadcn/badge/index.js';
	import { ColorPickerContent } from '$lib/components/derived/color-picker/index.js';
	import { WORKSPACE_ACCENT_PALETTE } from '$lib/components/derived/color-picker/color_utils.js';
	import PathInput from '$lib/components/derived/path-input/PathInput.svelte';
	import RepoCombobox from '$lib/components/derived/repo-combobox/RepoCombobox.svelte';
	import WorkspaceCommandRow from '$lib/components/blocks/workspace/WorkspaceCommandRow.svelte';
	import PlusIcon from '@lucide/svelte/icons/plus';
	import ServerIcon from '@lucide/svelte/icons/server';
	import SquareCheckIcon from '@lucide/svelte/icons/square-check';
	import SaveIcon from '@lucide/svelte/icons/save';
	import ArchiveIcon from '@lucide/svelte/icons/archive';
	import Trash2Icon from '@lucide/svelte/icons/trash-2';

	const boardStore = useBoard();

	const dashboard = $derived(boardStore.activeDashboard);
	const isRepo = $derived(dashboard?.type === 'repo');

	// fallow-ignore-next-line code-duplication
	let name = $state('');
	let githubRepo = $state('');
	let localFolder = $state('');
	let defaultBaseBranch = $state('');
	let worktreeParentFolder = $state('');
	let accentColor = $state(WORKSPACE_ACCENT_PALETTE[0]);

	let commands = $state<WorkspaceCommand[]>([]);
	let commandsLoading = $state(true);
	let saveStatus = $state<'idle' | 'saving' | 'saved' | 'error'>('idle');
	let saveError = $state<string | null>(null);
	let dirty = $state(false);

	let confirmDeleteName = $state('');
	let showDeleteConfirm = $state(false);

	const serverCommands = $derived(commands.filter((c) => c.category === 'server'));
	const checkCommands = $derived(commands.filter((c) => c.category === 'check'));

	// fallow-ignore-next-line code-duplication
	$effect(() => {
		if (dashboard !== null) {
			name = dashboard.name;
			githubRepo = dashboard.github_repo ?? '';
			localFolder = dashboard.local_folder ?? '';
			defaultBaseBranch = dashboard.default_base_branch ?? '';
			worktreeParentFolder = dashboard.worktree_parent_folder ?? '';
			accentColor = dashboard.accent_color ?? WORKSPACE_ACCENT_PALETTE[0];
			dirty = false;
			void loadCommands(dashboard.id);
		}
	});

	async function loadCommands(dashboardId: string) {
		commandsLoading = true;
		try {
			commands = await invoke<WorkspaceCommand[]>('get_workspace_commands_for_dashboard', {
				dashboardId,
			});
		} catch {
			commands = [];
		}
		commandsLoading = false;
	}

	function markDirty() {
		dirty = true;
		if (saveStatus === 'saved') {
			saveStatus = 'idle';
		}
	}

	// fallow-ignore-next-line complexity
	async function handleSaveGeneral() {
		if (dashboard === null) {
			return;
		}
		saveStatus = 'saving';
		saveError = null;
		try {
			await boardStore.updateDashboard({
				id: dashboard.id,
				name: name.trim() || undefined,
				github_repo: githubRepo.trim() || null,
				local_folder: localFolder.trim() || null,
				default_base_branch: defaultBaseBranch.trim() || null,
				worktree_parent_folder: worktreeParentFolder.trim() || null,
				accent_color: accentColor,
			});
			await boardStore.refreshDashboards();
			saveStatus = 'saved';
			dirty = false;
			setTimeout(() => {
				if (saveStatus === 'saved') {
					saveStatus = 'idle';
				}
			}, 2000);
		} catch (err) {
			saveStatus = 'error';
			saveError = String(err);
		}
	}

	async function handleAddCommand(category: CommandCategory) {
		if (dashboard === null) {
			return;
		}
		try {
			const created = await invoke<WorkspaceCommand>('create_workspace_command', {
				request: {
					dashboard_id: dashboard.id,
					category,
					name: category === 'server' ? 'New Server' : 'New Check',
					command: '',
					port_pattern: null,
					expected_exit_code: 0,
					sort_order:
						category === 'server' ? serverCommands.length : checkCommands.length,
				},
			});
			commands = [...commands, created];
		} catch (err) {
			saveError = String(err);
		}
	}

	async function handleUpdateCommand(id: string, field: string, value: string | number | null) {
		const index = commands.findIndex((c) => c.id === id);
		if (index === -1) {
			return;
		}
		const updated = { ...commands[index], [field]: value };
		commands[index] = updated;

		try {
			await invoke('update_workspace_command', {
				request: { id, [field]: value },
			});
		} catch (err) {
			saveError = String(err);
		}
	}

	async function handleDeleteCommand(id: string) {
		commands = commands.filter((c) => c.id !== id);
		try {
			await invoke('delete_workspace_command', { id });
		} catch (err) {
			saveError = String(err);
		}
	}

	async function handleArchive() {
		if (dashboard === null) {
			return;
		}
		await boardStore.archiveDashboard(dashboard.id);
	}

	async function handleDelete() {
		if (dashboard === null || confirmDeleteName.trim() !== dashboard.name) {
			return;
		}
		await boardStore.deleteDashboard(dashboard.id, confirmDeleteName.trim());
		showDeleteConfirm = false;
		confirmDeleteName = '';
	}
</script>

{#if dashboard === null}
	<div class="space-y-4">
		<h2 class="text-lg font-medium">Workspace</h2>
		<p class="text-sm text-muted-foreground">
			No workspace selected. Workspace settings are available when a workspace is active.
		</p>
	</div>
{:else}
	<div class="space-y-8">
		<div class="flex items-center justify-between">
			<div>
				<h2 class="text-lg font-medium">{dashboard.name}</h2>
				<p class="text-sm text-muted-foreground">
					Workspace configuration, commands, and actions.
				</p>
			</div>
			{#if dirty}
				<Button onclick={handleSaveGeneral} disabled={saveStatus === 'saving'}>
					<SaveIcon data-icon="inline-start" />
					{saveStatus === 'saving' ? 'Saving...' : 'Save Changes'}
				</Button>
			{:else if saveStatus === 'saved'}
				<Badge tone="success">Saved</Badge>
			{/if}
		</div>

		{#if saveError}
			<p class="rounded bg-destructive/20 px-3 py-2 text-sm text-destructive">
				{saveError}
			</p>
		{/if}

		<!-- General Section -->
		<section class="space-y-4">
			<h3 class="text-base font-medium">General</h3>
			<Separator />

			<div class="space-y-4">
				<div class="space-y-1.5">
					<Label for="ws-name">Name</Label>
					<Input id="ws-name" bind:value={name} oninput={markDirty} required />
				</div>

				<div class="space-y-1.5">
					<Label>Accent Color</Label>
					<ColorPickerContent
						colors={WORKSPACE_ACCENT_PALETTE}
						selectedColor={accentColor}
						onSelect={(color) => {
							accentColor = color;
							markDirty();
						}}
					/>
				</div>

				{#if isRepo}
					<div class="space-y-1.5">
						<Label for="ws-repo">GitHub Repository</Label>
						<RepoCombobox
							id="ws-repo"
							bind:value={githubRepo}
							placeholder="owner/repo"
							onchange={markDirty}
						/>
					</div>

					<div class="space-y-1.5">
						<Label for="ws-folder">Local Folder</Label>
						<PathInput id="ws-folder" bind:value={localFolder} onchange={markDirty} />
					</div>

					<div class="space-y-1.5">
						<Label for="ws-branch">Default Base Branch</Label>
						<Input
							id="ws-branch"
							bind:value={defaultBaseBranch}
							oninput={markDirty}
							placeholder="main"
						/>
					</div>
				{/if}
			</div>
		</section>

		<!-- Worktrees Section (repo only) -->
		{#if isRepo}
			<section class="space-y-4">
				<h3 class="text-base font-medium">Worktrees</h3>
				<Separator />

				<div class="space-y-1.5">
					<Label for="ws-worktree-parent">Worktree Parent Folder</Label>
					<PathInput
						id="ws-worktree-parent"
						bind:value={worktreeParentFolder}
						placeholder="Folder where worktrees are created"
						onchange={markDirty}
					/>
					<p class="text-xs text-muted-foreground">
						New worktrees will be created as subdirectories of this folder.
					</p>
				</div>
			</section>
		{/if}

		<!-- Commands Section -->
		<section class="space-y-4">
			<h3 class="text-base font-medium">Commands</h3>
			<Separator />

			<!-- Server Commands -->
			<div class="space-y-3">
				<div class="flex items-center justify-between">
					<div class="flex items-center gap-2">
						<ServerIcon size={16} class="text-muted-foreground" />
						<span class="text-sm font-medium">Server Commands</span>
						<Badge format="mono">{serverCommands.length}</Badge>
					</div>
					<Button intent="ghost" size="sm" onclick={() => handleAddCommand('server')}>
						<PlusIcon data-icon="inline-start" />
						Add Server
					</Button>
				</div>
				<p class="text-xs text-muted-foreground">
					Long-running processes with optional port detection.
				</p>

				{#if commandsLoading}
					<div class="py-4 text-center text-sm text-muted-foreground">Loading...</div>
				{:else}
					<div class="space-y-2">
						{#each serverCommands as command (command.id)}
							<WorkspaceCommandRow
								{command}
								onUpdate={handleUpdateCommand}
								onDelete={handleDeleteCommand}
							/>
						{/each}
						{#if serverCommands.length === 0}
							<div
								class="rounded-md border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground"
							>
								No server commands configured
							</div>
						{/if}
					</div>
				{/if}
			</div>

			<Separator />

			<!-- Check Commands -->
			<div class="space-y-3">
				<div class="flex items-center justify-between">
					<div class="flex items-center gap-2">
						<SquareCheckIcon size={16} class="text-muted-foreground" />
						<span class="text-sm font-medium">Check Commands</span>
						<Badge format="mono">{checkCommands.length}</Badge>
					</div>
					<Button intent="ghost" size="sm" onclick={() => handleAddCommand('check')}>
						<PlusIcon data-icon="inline-start" />
						Add Check
					</Button>
				</div>
				<p class="text-xs text-muted-foreground">
					Short-lived commands that report pass/fail.
				</p>

				{#if commandsLoading}
					<div class="py-4 text-center text-sm text-muted-foreground">Loading...</div>
				{:else}
					<div class="space-y-2">
						{#each checkCommands as command (command.id)}
							<WorkspaceCommandRow
								{command}
								onUpdate={handleUpdateCommand}
								onDelete={handleDeleteCommand}
							/>
						{/each}
						{#if checkCommands.length === 0}
							<div
								class="rounded-md border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground"
							>
								No check commands configured
							</div>
						{/if}
					</div>
				{/if}
			</div>
		</section>

		<!-- Danger Zone -->
		<section class="space-y-4">
			<h3 class="text-base font-medium text-destructive">Danger Zone</h3>
			<Separator />

			<div class="space-y-3 rounded-md border border-destructive/30 p-4">
				<div class="flex items-center justify-between">
					<div>
						<p class="text-sm font-medium">Archive workspace</p>
						<p class="text-xs text-muted-foreground">
							Hide this workspace from the sidebar. Can be unarchived later.
						</p>
					</div>
					<Button intent="secondary" size="sm" onclick={handleArchive}>
						<ArchiveIcon data-icon="inline-start" />
						Archive
					</Button>
				</div>

				<Separator />

				<div class="flex items-center justify-between">
					<div>
						<p class="text-sm font-medium">Delete workspace</p>
						<p class="text-xs text-muted-foreground">
							Permanently remove this workspace and all its data.
						</p>
					</div>
					<Button
						intent="danger"
						size="sm"
						onclick={() => (showDeleteConfirm = !showDeleteConfirm)}
					>
						<Trash2Icon data-icon="inline-start" />
						Delete
					</Button>
				</div>

				{#if showDeleteConfirm}
					<div
						class="space-y-2 rounded border border-destructive/20 bg-destructive/5 p-3"
					>
						<p class="text-xs text-muted-foreground">
							Type <strong>{dashboard.name}</strong> to confirm deletion:
						</p>
						<div class="flex gap-2">
							<Input
								bind:value={confirmDeleteName}
								placeholder={dashboard.name}
								class="flex-1"
							/>
							<Button
								intent="danger"
								size="sm"
								disabled={confirmDeleteName.trim() !== dashboard.name}
								onclick={handleDelete}
							>
								Confirm Delete
							</Button>
						</div>
					</div>
				{/if}
			</div>
		</section>
	</div>
{/if}
