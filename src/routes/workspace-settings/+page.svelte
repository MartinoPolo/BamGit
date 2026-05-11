<script lang="ts">
	import type { WorkspaceCommand, CommandCategory } from '$lib/types/generated';
	import { useBoard } from '$lib/modules/board';
	import { invoke } from '$lib/tauri.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Separator } from '$lib/components/ui/separator/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { ColorPickerContent } from '$lib/components/derived/color-picker/index.js';
	import { WORKSPACE_ACCENT_PALETTE } from '$lib/components/derived/color-picker/color_utils.js';
	import PathInput from '$lib/components/derived/path-input/PathInput.svelte';
	import RepoCombobox from '$lib/components/derived/repo-combobox/RepoCombobox.svelte';
	import WorkspaceCommandRow from '$lib/components/blocks/workspace/WorkspaceCommandRow.svelte';
	import PlusIcon from '@lucide/svelte/icons/plus';
	import ServerIcon from '@lucide/svelte/icons/server';
	import SquareCheckIcon from '@lucide/svelte/icons/square-check';
	import SaveIcon from '@lucide/svelte/icons/save';

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
</script>

<div class="mx-auto max-w-2xl space-y-8 p-6">
	{#if dashboard === null}
		<div class="flex h-64 items-center justify-center text-muted-foreground">
			No workspace selected
		</div>
	{:else}
		<div class="flex items-center justify-between">
			<div>
				<h1 class="text-xl font-semibold">Workspace Settings</h1>
				<p class="text-sm text-muted-foreground">
					Configure {dashboard.name}
				</p>
			</div>
			{#if dirty}
				<Button onclick={handleSaveGeneral} disabled={saveStatus === 'saving'}>
					<SaveIcon size={14} />
					{saveStatus === 'saving' ? 'Saving...' : 'Save Changes'}
				</Button>
			{:else if saveStatus === 'saved'}
				<Badge variant="success">Saved</Badge>
			{/if}
		</div>

		{#if saveError}
			<p class="rounded bg-destructive/20 px-3 py-2 text-sm text-destructive">
				{saveError}
			</p>
		{/if}

		<!-- General Section -->
		<section class="space-y-4">
			<h2 class="text-lg font-medium">General</h2>
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
				<h2 class="text-lg font-medium">Worktrees</h2>
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
			<h2 class="text-lg font-medium">Commands</h2>
			<Separator />

			<!-- Server Commands -->
			<div class="space-y-3">
				<div class="flex items-center justify-between">
					<div class="flex items-center gap-2">
						<ServerIcon size={16} class="text-muted-foreground" />
						<h3 class="text-sm font-medium">Server Commands</h3>
						<Badge variant="mono">{serverCommands.length}</Badge>
					</div>
					<Button variant="ghost" size="sm" onclick={() => handleAddCommand('server')}>
						<PlusIcon size={14} />
						Add Server
					</Button>
				</div>
				<p class="text-xs text-muted-foreground">
					Long-running processes with optional port detection. Can be launched from issue
					cards.
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
						<h3 class="text-sm font-medium">Check Commands</h3>
						<Badge variant="mono">{checkCommands.length}</Badge>
					</div>
					<Button variant="ghost" size="sm" onclick={() => handleAddCommand('check')}>
						<PlusIcon size={14} />
						Add Check
					</Button>
				</div>
				<p class="text-xs text-muted-foreground">
					Short-lived commands that report pass/fail. Results shown as badges on issue
					cards.
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
	{/if}
</div>
