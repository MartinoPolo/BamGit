<script lang="ts">
	import * as m from '$lib/paraglide/messages.js';
	import type { CreateDashboardRequest } from '$lib/modules/board';
	import type { Dashboard, ColorPalette } from '$lib/types/generated';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import { Checkbox } from '$lib/components/ui/checkbox/index.js';
	import PaletteSelector from './PaletteSelector.svelte';
	import PathInput from './PathInput.svelte';
	import RepoCombobox from './RepoCombobox.svelte';
	import { buildCreateDashboardRequest } from './dialog_helpers.js';

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

	function handleOpenChange(isOpen: boolean) {
		if (!isOpen) {
			handleCancel();
		}
	}
</script>

<Dialog.Root {open} onOpenChange={handleOpenChange}>
	<Dialog.Content class="max-w-md">
		<form onsubmit={handleSubmit} class="flex flex-col gap-4">
			<Dialog.Header>
				<Dialog.Title>{m.dashboard_create_title()}</Dialog.Title>
			</Dialog.Header>

			<Dialog.Body class="flex flex-col gap-4">
				<!-- Type selector -->
				<div class="flex gap-2">
					<Button
						type="button"
						variant={dashboardType === 'repo' ? 'primary' : 'secondary'}
						size="sm"
						class="flex-1"
						onclick={() => (dashboardType = 'repo')}
					>
						◆ {m.dashboard_type_repo()}
					</Button>
					<Button
						type="button"
						variant={dashboardType === 'portfolio' ? 'primary' : 'secondary'}
						size="sm"
						class="flex-1"
						onclick={() => (dashboardType = 'portfolio')}
					>
						◇ {m.dashboard_type_portfolio()}
					</Button>
				</div>

				<!-- Name -->
				<div class="flex flex-col gap-1.5">
					<Label for="dashboard-name">{m.dashboard_field_name()}</Label>
					<Input
						id="dashboard-name"
						bind:value={name}
						required
						placeholder={m.dashboard_placeholder_name()}
					/>
				</div>

				<!-- Color palette -->
				<PaletteSelector
					palettes={colorPalettes}
					selectedPaletteId={colorPaletteId}
					onSelect={(id) => (colorPaletteId = id)}
				/>

				<!-- Repo-specific fields -->
				{#if dashboardType === 'portfolio'}
					<fieldset class="flex flex-col gap-1">
						<legend class="text-xs text-muted-foreground"
							>{m.dashboard_field_repo_dashboards()}</legend
						>
						{#if repoDashboards.length === 0}
							<p class="text-xs text-muted-foreground">
								{m.dashboard_no_repo_dashboards()}
							</p>
						{:else}
							<div
								class="flex flex-col gap-1 rounded border border-input bg-muted p-2"
							>
								{#each repoDashboards as repo (repo.id)}
									<label
										class="flex items-center gap-2 rounded px-2 py-1 text-sm hover:bg-accent"
									>
										<Checkbox
											checked={selectedRepoIds.has(repo.id)}
											onCheckedChange={(checked) => {
												const next = new Set(selectedRepoIds);
												if (checked === true) {
													next.add(repo.id);
												} else {
													next.delete(repo.id);
												}
												selectedRepoIds = next;
											}}
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
					<div class="flex flex-col gap-1.5">
						<Label for="dashboard-github-repo">{m.dashboard_field_github_repo()}</Label>
						<RepoCombobox
							id="dashboard-github-repo"
							bind:value={githubRepo}
							placeholder={m.dashboard_placeholder_github_repo()}
						/>
					</div>
					<div class="flex flex-col gap-1.5">
						<Label for="dashboard-local-folder"
							>{m.dashboard_field_local_folder()}</Label
						>
						<PathInput
							id="dashboard-local-folder"
							bind:value={localFolder}
							placeholder={m.dashboard_placeholder_local_folder()}
						/>
					</div>
					<div class="flex flex-col gap-1.5">
						<Label for="dashboard-base-branch"
							>{m.dashboard_field_default_base_branch()}</Label
						>
						<Input
							id="dashboard-base-branch"
							bind:value={defaultBaseBranch}
							placeholder={m.dashboard_placeholder_base_branch()}
						/>
					</div>
					<div class="flex flex-col gap-1.5">
						<Label for="dashboard-worktree-folder"
							>{m.dashboard_field_worktree_parent_folder()}</Label
						>
						<PathInput
							id="dashboard-worktree-folder"
							bind:value={worktreeParentFolder}
							placeholder={m.dashboard_placeholder_worktree_parent()}
						/>
					</div>
				{/if}
			</Dialog.Body>

			<Dialog.Footer>
				<Button variant="ghost" type="button" onclick={handleCancel}>
					{m.btn_cancel()}
				</Button>
				<Button type="submit">
					{m.btn_create()}
				</Button>
			</Dialog.Footer>
		</form>
	</Dialog.Content>
</Dialog.Root>
