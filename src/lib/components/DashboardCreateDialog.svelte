<script lang="ts">
	import * as m from '$lib/paraglide/messages.js';
	import type { CreateDashboardRequest } from '$lib/modules/board';
	import type { Dashboard, ColorPalette } from '$lib/types/generated';
	import PaletteSelector from './PaletteSelector.svelte';
	import { syncDialogVisibility, buildCreateDashboardRequest } from './dialog_helpers.js';

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
		syncDialogVisibility(open, dialogElement);
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
		const request = buildCreateDashboardRequest(
			name,
			dashboardType,
			colorPaletteId,
			githubRepo,
			localFolder,
			defaultBaseBranch,
			worktreeParentFolder,
		);
		if (request === null) {
			return;
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
		<h2 class="text-lg font-semibold">{m.dashboard_create_title()}</h2>

		<!-- Type selector -->
		<div class="flex gap-2">
			<button
				type="button"
				onclick={() => (dashboardType = 'repo')}
				class="flex-1 rounded px-3 py-2 text-sm transition-colors {dashboardType === 'repo'
					? 'bg-primary text-primary-foreground'
					: 'bg-muted text-muted-foreground hover:text-foreground'}"
			>
				◆ {m.dashboard_type_repo()}
			</button>
			<button
				type="button"
				onclick={() => (dashboardType = 'portfolio')}
				class="flex-1 rounded px-3 py-2 text-sm transition-colors {dashboardType ===
				'portfolio'
					? 'bg-primary text-primary-foreground'
					: 'bg-muted text-muted-foreground hover:text-foreground'}"
			>
				◇ {m.dashboard_type_portfolio()}
			</button>
		</div>

		<!-- Name (always shown) -->
		<label class="flex flex-col gap-1">
			<span class="text-xs text-muted-foreground">{m.dashboard_field_name()}</span>
			<input
				bind:value={name}
				required
				class="rounded border border-input bg-muted px-3 py-2 text-sm text-foreground outline-none focus:border-ring"
				placeholder={m.dashboard_placeholder_name()}
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
				<legend class="text-xs text-muted-foreground"
					>{m.dashboard_field_repo_dashboards()}</legend
				>
				{#if repoDashboards.length === 0}
					<p class="text-xs text-muted-foreground">
						{m.dashboard_no_repo_dashboards()}
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
				<span class="text-xs text-muted-foreground">{m.dashboard_field_github_repo()}</span>
				<input
					bind:value={githubRepo}
					class="rounded border border-input bg-muted px-3 py-2 text-sm text-foreground outline-none focus:border-ring"
					placeholder={m.dashboard_placeholder_github_repo()}
				/>
			</label>
			<label class="flex flex-col gap-1">
				<span class="text-xs text-muted-foreground">{m.dashboard_field_local_folder()}</span
				>
				<input
					bind:value={localFolder}
					class="rounded border border-input bg-muted px-3 py-2 text-sm text-foreground outline-none focus:border-ring"
					placeholder={m.dashboard_placeholder_local_folder()}
				/>
			</label>
			<label class="flex flex-col gap-1">
				<span class="text-xs text-muted-foreground"
					>{m.dashboard_field_default_base_branch()}</span
				>
				<input
					bind:value={defaultBaseBranch}
					class="rounded border border-input bg-muted px-3 py-2 text-sm text-foreground outline-none focus:border-ring"
					placeholder={m.dashboard_placeholder_base_branch()}
				/>
			</label>
			<label class="flex flex-col gap-1">
				<span class="text-xs text-muted-foreground"
					>{m.dashboard_field_worktree_parent_folder()}</span
				>
				<input
					bind:value={worktreeParentFolder}
					class="rounded border border-input bg-muted px-3 py-2 text-sm text-foreground outline-none focus:border-ring"
					placeholder={m.dashboard_placeholder_worktree_parent()}
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
				{m.btn_cancel()}
			</button>
			<button
				type="submit"
				class="rounded bg-primary px-4 py-2 text-sm text-primary-foreground transition-colors hover:bg-primary/90"
			>
				{m.btn_create()}
			</button>
		</div>
	</form>
</dialog>
