<script lang="ts">
	import type { CreateDashboardRequest, Dashboard } from '$lib/types/dashboard';
	import type { ColorPalette } from '$lib/types/color_palette';
	import PaletteSelector from './PaletteSelector.svelte';

	interface Props {
		open: boolean;
		repoDashboards: Dashboard[];
		colorPalettes: ColorPalette[];
		onClose: () => void;
		onCreate: (request: CreateDashboardRequest, selectedRepoIds: string[]) => void;
	}

	let { open, repoDashboards, colorPalettes, onClose, onCreate }: Props = $props();

	let dashboardType = $state<'repo' | 'portfolio'>('repo');
	let name = $state('');
	let githubRepo = $state('');
	let localFolder = $state('');
	let defaultBaseBranch = $state('');
	let worktreeParentFolder = $state('');
	let colorPaletteId = $state<string | null>(null);
	let selectedRepoIds = $state<Set<string>>(new Set());
	let dialogElement: HTMLDialogElement | undefined = $state();

	$effect(() => {
		if (open && dialogElement !== undefined && !dialogElement.open) {
			dialogElement.showModal();
		} else if (!open && dialogElement?.open === true) {
			dialogElement.close();
		}
	});

	function resetForm() {
		dashboardType = 'repo';
		name = '';
		githubRepo = '';
		localFolder = '';
		defaultBaseBranch = '';
		worktreeParentFolder = '';
		colorPaletteId = null;
		selectedRepoIds = new Set();
	}

	function handleSubmit(event: SubmitEvent) {
		event.preventDefault();
		if (!name.trim()) {
			return;
		}

		const request: CreateDashboardRequest = {
			name: name.trim(),
			type: dashboardType,
		};

		if (colorPaletteId !== null) {
			request.color_palette_id = colorPaletteId;
		}

		if (dashboardType === 'repo') {
			if (githubRepo.trim()) {
				request.github_repo = githubRepo.trim();
			}
			if (localFolder.trim()) {
				request.local_folder = localFolder.trim();
			}
			if (defaultBaseBranch.trim()) {
				request.default_base_branch = defaultBaseBranch.trim();
			}
			if (worktreeParentFolder.trim()) {
				request.worktree_parent_folder = worktreeParentFolder.trim();
			}
		}

		onCreate(request, [...selectedRepoIds]);
		resetForm();
		onClose();
	}

	function handleCancel() {
		resetForm();
		onClose();
	}
</script>

<dialog
	bind:this={dialogElement}
	onclose={handleCancel}
	class="w-full max-w-md rounded-lg border border-border bg-popover p-0 text-popover-foreground shadow-xl backdrop:bg-black/50"
>
	<form onsubmit={handleSubmit} class="flex flex-col gap-4 p-6">
		<h2 class="text-lg font-semibold">Create Dashboard</h2>

		<!-- Type selector -->
		<div class="flex gap-2">
			<button
				type="button"
				onclick={() => (dashboardType = 'repo')}
				class="flex-1 rounded px-3 py-2 text-sm transition-colors {dashboardType === 'repo'
					? 'bg-primary text-primary-foreground'
					: 'bg-muted text-muted-foreground hover:text-foreground'}"
			>
				◆ Repo
			</button>
			<button
				type="button"
				onclick={() => (dashboardType = 'portfolio')}
				class="flex-1 rounded px-3 py-2 text-sm transition-colors {dashboardType ===
				'portfolio'
					? 'bg-primary text-primary-foreground'
					: 'bg-muted text-muted-foreground hover:text-foreground'}"
			>
				◇ Portfolio
			</button>
		</div>

		<!-- Name (always shown) -->
		<label class="flex flex-col gap-1">
			<span class="text-xs text-muted-foreground">Name *</span>
			<input
				bind:value={name}
				required
				class="rounded border border-input bg-muted px-3 py-2 text-sm text-foreground outline-none focus:border-ring"
				placeholder="My Project"
			/>
		</label>

		<!-- Color palette -->
		<PaletteSelector
			palettes={colorPalettes}
			selectedPaletteId={colorPaletteId}
			onSelect={(id) => (colorPaletteId = id)}
		/>

		<!-- Repo-specific fields -->
		{#if dashboardType === 'portfolio'}
			<!-- Portfolio repo picker -->
			<fieldset class="flex flex-col gap-1">
				<legend class="text-xs text-muted-foreground">Repo Dashboards</legend>
				{#if repoDashboards.length === 0}
					<p class="text-xs text-muted-foreground">
						No repo dashboards yet. Create one first.
					</p>
				{:else}
					<div class="flex flex-col gap-1 rounded border border-input bg-muted p-2">
						{#each repoDashboards as repo (repo.id)}
							<label
								class="flex items-center gap-2 rounded px-2 py-1 text-sm hover:bg-accent"
							>
								<input
									type="checkbox"
									checked={selectedRepoIds.has(repo.id)}
									onchange={() => {
										const next = new Set(selectedRepoIds);
										if (next.has(repo.id)) {
											next.delete(repo.id);
										} else {
											next.add(repo.id);
										}
										selectedRepoIds = next;
									}}
									class="accent-primary"
								/>
								<span class="text-foreground">{repo.name}</span>
								{#if repo.github_repo}
									<span class="text-xs text-muted-foreground"
										>{repo.github_repo}</span
									>
								{/if}
							</label>
						{/each}
					</div>
				{/if}
			</fieldset>
		{:else if dashboardType === 'repo'}
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
					placeholder="C:/projects/my-project"
				/>
			</label>
			<label class="flex flex-col gap-1">
				<span class="text-xs text-muted-foreground">Default Base Branch</span>
				<input
					bind:value={defaultBaseBranch}
					class="rounded border border-input bg-muted px-3 py-2 text-sm text-foreground outline-none focus:border-ring"
					placeholder="main"
				/>
			</label>
			<label class="flex flex-col gap-1">
				<span class="text-xs text-muted-foreground">Worktree Parent Folder</span>
				<input
					bind:value={worktreeParentFolder}
					class="rounded border border-input bg-muted px-3 py-2 text-sm text-foreground outline-none focus:border-ring"
					placeholder="C:/worktrees/my-project"
				/>
			</label>
		{/if}

		<!-- Actions -->
		<div class="flex justify-end gap-2 pt-2">
			<button
				type="button"
				onclick={handleCancel}
				class="rounded px-4 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
			>
				Cancel
			</button>
			<button
				type="submit"
				class="rounded bg-primary px-4 py-2 text-sm text-primary-foreground transition-colors hover:bg-primary/90"
			>
				Create
			</button>
		</div>
	</form>
</dialog>
