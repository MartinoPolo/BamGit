<script lang="ts">
	import type { Dashboard, UpdateDashboardRequest } from '$lib/types/dashboard';
	import type { ColorPalette } from '$lib/types/color_palette';
	import PaletteSelector from './PaletteSelector.svelte';

	interface Props {
		dashboard: Dashboard | null;
		colorPalettes: ColorPalette[];
		onClose: () => void;
		onUpdate: (request: UpdateDashboardRequest) => void;
		onDelete: (id: string) => void;
	}

	let { dashboard, colorPalettes, onClose, onUpdate, onDelete }: Props = $props();

	let name = $state('');
	let githubRepo = $state('');
	let localFolder = $state('');
	let defaultBaseBranch = $state('');
	let worktreeParentFolder = $state('');
	let colorPaletteId = $state<string | null>(null);
	let confirmDelete = $state(false);
	let dialogElement: HTMLDialogElement | undefined = $state();

	$effect(() => {
		if (dashboard !== null && dialogElement !== undefined && !dialogElement.open) {
			name = dashboard.name;
			githubRepo = dashboard.github_repo ?? '';
			localFolder = dashboard.local_folder ?? '';
			defaultBaseBranch = dashboard.default_base_branch ?? '';
			worktreeParentFolder = dashboard.worktree_parent_folder ?? '';
			colorPaletteId = dashboard.color_palette_id ?? null;
			confirmDelete = false;
			dialogElement.showModal();
		} else if (dashboard === null && dialogElement?.open === true) {
			dialogElement.close();
		}
	});

	function handleSubmit(event: SubmitEvent) {
		event.preventDefault();
		if (dashboard === null || !name.trim()) {
			return;
		}

		const request: UpdateDashboardRequest = {
			id: dashboard.id,
			name: name.trim(),
			color_palette_id: colorPaletteId,
		};

		if (dashboard.type === 'repo') {
			request.github_repo = githubRepo.trim() || null;
			request.local_folder = localFolder.trim() || null;
			request.default_base_branch = defaultBaseBranch.trim() || null;
			request.worktree_parent_folder = worktreeParentFolder.trim() || null;
		}

		onUpdate(request);
		onClose();
	}

	function handleDelete() {
		if (dashboard === null) {
			return;
		}
		if (!confirmDelete) {
			confirmDelete = true;
			return;
		}
		onDelete(dashboard.id);
		onClose();
	}
</script>

<dialog
	bind:this={dialogElement}
	onclose={onClose}
	class="w-full max-w-md rounded-lg border border-border bg-popover p-0 text-popover-foreground shadow-xl backdrop:bg-black/50"
>
	{#if dashboard}
		<form onsubmit={handleSubmit} class="flex flex-col gap-4 p-6">
			<h2 class="text-lg font-semibold">Edit Dashboard</h2>

			<label class="flex flex-col gap-1">
				<span class="text-xs text-muted-foreground">Name *</span>
				<input
					bind:value={name}
					required
					class="rounded border border-input bg-muted px-3 py-2 text-sm text-foreground outline-none focus:border-ring"
				/>
			</label>

			<!-- Color palette -->
			<PaletteSelector
				palettes={colorPalettes}
				selectedPaletteId={colorPaletteId}
				onSelect={(id) => (colorPaletteId = id)}
			/>

			{#if dashboard.type === 'repo'}
				<label class="flex flex-col gap-1">
					<span class="text-xs text-muted-foreground">GitHub Repo</span>
					<input
						bind:value={githubRepo}
						class="rounded border border-input bg-muted px-3 py-2 text-sm text-foreground outline-none focus:border-ring"
						placeholder="owner/repo"
					/>
				</label>
				<label class="flex flex-col gap-1">
					<span class="text-xs text-muted-foreground">Local Folder</span>
					<input
						bind:value={localFolder}
						class="rounded border border-input bg-muted px-3 py-2 text-sm text-foreground outline-none focus:border-ring"
					/>
				</label>
				<label class="flex flex-col gap-1">
					<span class="text-xs text-muted-foreground">Default Base Branch</span>
					<input
						bind:value={defaultBaseBranch}
						class="rounded border border-input bg-muted px-3 py-2 text-sm text-foreground outline-none focus:border-ring"
					/>
				</label>
				<label class="flex flex-col gap-1">
					<span class="text-xs text-muted-foreground">Worktree Parent Folder</span>
					<input
						bind:value={worktreeParentFolder}
						class="rounded border border-input bg-muted px-3 py-2 text-sm text-foreground outline-none focus:border-ring"
					/>
				</label>
			{/if}

			<div class="flex items-center justify-between pt-2">
				<button
					type="button"
					onclick={handleDelete}
					class="rounded px-3 py-2 text-sm transition-colors {confirmDelete
						? 'bg-destructive text-destructive-foreground'
						: 'text-destructive hover:text-destructive/80'}"
				>
					{confirmDelete ? 'Confirm Delete' : 'Delete'}
				</button>
				<div class="flex gap-2">
					<button
						type="button"
						onclick={onClose}
						class="rounded px-4 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
					>
						Cancel
					</button>
					<button
						type="submit"
						class="rounded bg-primary px-4 py-2 text-sm text-primary-foreground transition-colors hover:bg-primary/90"
					>
						Save
					</button>
				</div>
			</div>
		</form>
	{/if}
</dialog>
