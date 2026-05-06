<script lang="ts">
	import * as m from '$lib/paraglide/messages.js';
	import type { UpdateDashboardRequest } from '$lib/modules/board';
	import type { Dashboard, ColorPalette } from '$lib/types/generated';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import PaletteSelector from './PaletteSelector.svelte';
	import PathInput from './PathInput.svelte';
	import RepoCombobox from './RepoCombobox.svelte';
	import { buildUpdateDashboardRequest } from './dialog_helpers.js';

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

	const open = $derived(dashboard !== null);

	$effect(() => {
		if (dashboard !== null) {
			name = dashboard.name;
			githubRepo = dashboard.github_repo ?? '';
			localFolder = dashboard.local_folder ?? '';
			defaultBaseBranch = dashboard.default_base_branch ?? '';
			worktreeParentFolder = dashboard.worktree_parent_folder ?? '';
			colorPaletteId = dashboard.color_palette_id ?? null;
			confirmDelete = false;
		}
	});

	function handleSubmit(event: SubmitEvent) {
		event.preventDefault();
		const request = buildUpdateDashboardRequest(
			dashboard,
			name,
			colorPaletteId,
			githubRepo,
			localFolder,
			defaultBaseBranch,
			worktreeParentFolder,
		);
		if (request === null) {
			return;
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

	function handleOpenChange(isOpen: boolean) {
		if (!isOpen) {
			onClose();
		}
	}
</script>

<Dialog.Root {open} onOpenChange={handleOpenChange}>
	<Dialog.Content class="max-w-md">
		{#if dashboard}
			<form onsubmit={handleSubmit} class="flex flex-col gap-4">
				<Dialog.Header>
					<Dialog.Title>{m.dashboard_edit_title()}</Dialog.Title>
				</Dialog.Header>

				<Dialog.Body class="flex flex-col gap-4">
					<div class="flex flex-col gap-1.5">
						<Label for="edit-dashboard-name">{m.dashboard_field_name()}</Label>
						<Input id="edit-dashboard-name" bind:value={name} required />
					</div>

					<PaletteSelector
						palettes={colorPalettes}
						selectedPaletteId={colorPaletteId}
						onSelect={(id) => (colorPaletteId = id)}
					/>

					{#if dashboard.type === 'repo'}
						<div class="flex flex-col gap-1.5">
							<Label for="edit-dashboard-github-repo"
								>{m.dashboard_field_github_repo()}</Label
							>
							<RepoCombobox
								id="edit-dashboard-github-repo"
								bind:value={githubRepo}
								placeholder={m.dashboard_placeholder_github_repo()}
							/>
						</div>
						<div class="flex flex-col gap-1.5">
							<Label for="edit-dashboard-local-folder"
								>{m.dashboard_field_local_folder()}</Label
							>
							<PathInput id="edit-dashboard-local-folder" bind:value={localFolder} />
						</div>
						<div class="flex flex-col gap-1.5">
							<Label for="edit-dashboard-base-branch"
								>{m.dashboard_field_default_base_branch()}</Label
							>
							<Input id="edit-dashboard-base-branch" bind:value={defaultBaseBranch} />
						</div>
						<div class="flex flex-col gap-1.5">
							<Label for="edit-dashboard-worktree"
								>{m.dashboard_field_worktree_parent_folder()}</Label
							>
							<PathInput
								id="edit-dashboard-worktree"
								bind:value={worktreeParentFolder}
							/>
						</div>
					{/if}
				</Dialog.Body>

				<Dialog.Footer class="justify-between">
					<Button variant="danger" type="button" size="sm" onclick={handleDelete}>
						{confirmDelete ? m.btn_confirm_delete() : m.btn_delete()}
					</Button>
					<div class="flex gap-2">
						<Button variant="ghost" type="button" onclick={onClose}>
							{m.btn_cancel()}
						</Button>
						<Button type="submit">
							{m.btn_save()}
						</Button>
					</div>
				</Dialog.Footer>
			</form>
		{/if}
	</Dialog.Content>
</Dialog.Root>
