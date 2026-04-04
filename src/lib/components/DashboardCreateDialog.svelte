<script lang="ts">
	import type { CreateDashboardRequest, Dashboard } from '$lib/types/dashboard';
	import type { ColorPalette } from '$lib/types/color_palette';
	import PaletteSelector from './PaletteSelector.svelte';

	interface Props {
		open: boolean;
		repo_dashboards: Dashboard[];
		color_palettes: ColorPalette[];
		on_close: () => void;
		on_create: (request: CreateDashboardRequest, selected_repo_ids: string[]) => void;
	}

	let { open, repo_dashboards, color_palettes, on_close, on_create }: Props = $props();

	let dashboard_type = $state<'repo' | 'portfolio'>('repo');
	let name = $state('');
	let github_repo = $state('');
	let local_folder = $state('');
	let default_base_branch = $state('');
	let worktree_parent_folder = $state('');
	let color_palette_id = $state<string | null>(null);
	let selected_repo_ids = $state<Set<string>>(new Set());
	let dialog_element: HTMLDialogElement | undefined = $state();

	$effect(() => {
		if (open && dialog_element !== undefined && !dialog_element.open) {
			dialog_element.showModal();
		} else if (!open && dialog_element?.open === true) {
			dialog_element.close();
		}
	});

	function reset_form() {
		dashboard_type = 'repo';
		name = '';
		github_repo = '';
		local_folder = '';
		default_base_branch = '';
		worktree_parent_folder = '';
		color_palette_id = null;
		selected_repo_ids = new Set();
	}

	function handle_submit(event: SubmitEvent) {
		event.preventDefault();
		if (!name.trim()) {
			return;
		}

		const request: CreateDashboardRequest = {
			name: name.trim(),
			type: dashboard_type,
		};

		if (color_palette_id !== null) {
			request.color_palette_id = color_palette_id;
		}

		if (dashboard_type === 'repo') {
			if (github_repo.trim()) {
				request.github_repo = github_repo.trim();
			}
			if (local_folder.trim()) {
				request.local_folder = local_folder.trim();
			}
			if (default_base_branch.trim()) {
				request.default_base_branch = default_base_branch.trim();
			}
			if (worktree_parent_folder.trim()) {
				request.worktree_parent_folder = worktree_parent_folder.trim();
			}
		}

		on_create(request, [...selected_repo_ids]);
		reset_form();
		on_close();
	}

	function handle_cancel() {
		reset_form();
		on_close();
	}
</script>

<dialog
	bind:this={dialog_element}
	onclose={handle_cancel}
	class="w-full max-w-md rounded-lg border border-border bg-popover p-0 text-popover-foreground shadow-xl backdrop:bg-black/50"
>
	<form onsubmit={handle_submit} class="flex flex-col gap-4 p-6">
		<h2 class="text-lg font-semibold">Create Dashboard</h2>

		<!-- Type selector -->
		<div class="flex gap-2">
			<button
				type="button"
				onclick={() => (dashboard_type = 'repo')}
				class="flex-1 rounded px-3 py-2 text-sm transition-colors {dashboard_type === 'repo'
					? 'bg-primary text-primary-foreground'
					: 'bg-muted text-muted-foreground hover:text-foreground'}"
			>
				◆ Repo
			</button>
			<button
				type="button"
				onclick={() => (dashboard_type = 'portfolio')}
				class="flex-1 rounded px-3 py-2 text-sm transition-colors {dashboard_type ===
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
			palettes={color_palettes}
			selected_palette_id={color_palette_id}
			on_select={(id) => (color_palette_id = id)}
		/>

		<!-- Repo-specific fields -->
		{#if dashboard_type === 'portfolio'}
			<!-- Portfolio repo picker -->
			<fieldset class="flex flex-col gap-1">
				<legend class="text-xs text-muted-foreground">Repo Dashboards</legend>
				{#if repo_dashboards.length === 0}
					<p class="text-xs text-muted-foreground">
						No repo dashboards yet. Create one first.
					</p>
				{:else}
					<div class="flex flex-col gap-1 rounded border border-input bg-muted p-2">
						{#each repo_dashboards as repo (repo.id)}
							<label
								class="flex items-center gap-2 rounded px-2 py-1 text-sm hover:bg-accent"
							>
								<input
									type="checkbox"
									checked={selected_repo_ids.has(repo.id)}
									onchange={() => {
										const next = new Set(selected_repo_ids);
										if (next.has(repo.id)) {
											next.delete(repo.id);
										} else {
											next.add(repo.id);
										}
										selected_repo_ids = next;
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
		{:else if dashboard_type === 'repo'}
			<label class="flex flex-col gap-1">
				<span class="text-xs text-muted-foreground">GitHub Repo</span>
				<input
					bind:value={github_repo}
					class="rounded border border-input bg-muted px-3 py-2 text-sm text-foreground outline-none focus:border-ring"
					placeholder="owner/repo"
				/>
			</label>
			<label class="flex flex-col gap-1">
				<span class="text-xs text-muted-foreground">Local Folder</span>
				<input
					bind:value={local_folder}
					class="rounded border border-input bg-muted px-3 py-2 text-sm text-foreground outline-none focus:border-ring"
					placeholder="C:/projects/my-project"
				/>
			</label>
			<label class="flex flex-col gap-1">
				<span class="text-xs text-muted-foreground">Default Base Branch</span>
				<input
					bind:value={default_base_branch}
					class="rounded border border-input bg-muted px-3 py-2 text-sm text-foreground outline-none focus:border-ring"
					placeholder="main"
				/>
			</label>
			<label class="flex flex-col gap-1">
				<span class="text-xs text-muted-foreground">Worktree Parent Folder</span>
				<input
					bind:value={worktree_parent_folder}
					class="rounded border border-input bg-muted px-3 py-2 text-sm text-foreground outline-none focus:border-ring"
					placeholder="C:/worktrees/my-project"
				/>
			</label>
		{/if}

		<!-- Actions -->
		<div class="flex justify-end gap-2 pt-2">
			<button
				type="button"
				onclick={handle_cancel}
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
