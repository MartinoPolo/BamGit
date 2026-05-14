<script lang="ts">
	import { untrack } from 'svelte';
	import * as m from '$lib/paraglide/messages.js';
	import type { UpdateDashboardRequest } from '$lib/modules/board';
	import type { Dashboard } from '$lib/types/generated';
	import * as Dialog from '$lib/components/shadcn/dialog/index.js';
	import { Button } from '$lib/components/shadcn/button/index.js';
	import { Input } from '$lib/components/shadcn/input/index.js';
	import { Label } from '$lib/components/shadcn/label/index.js';
	import { ColorPickerContent } from '$lib/components/derived/color-picker/index.js';
	import { WORKSPACE_ACCENT_PALETTE } from '$lib/components/derived/color-picker/color_utils.js';
	import { useVersionControl } from '$lib/modules/version-control';
	import PathInput from '$lib/components/derived/path-input/PathInput.svelte';
	import RepoCombobox from '$lib/components/derived/repo-combobox/RepoCombobox.svelte';
	import GhSetupBanner from '$lib/components/blocks/github/GhSetupBanner.svelte';
	import GitHubAuthWizard from '$lib/components/blocks/github-auth/GitHubAuthWizard.svelte';
	import { buildUpdateDashboardRequest } from '$lib/components/blocks/issue/dialog_helpers.js';

	interface Props {
		dashboard: Dashboard | null;
		onClose: () => void;
		onUpdate: (request: UpdateDashboardRequest) => void;
		onDelete: (id: string) => void;
	}

	let { dashboard, onClose, onUpdate, onDelete }: Props = $props();

	const versionControl = useVersionControl();

	let name = $state('');
	let githubRepo = $state('');
	let localFolder = $state('');
	let defaultBaseBranch = $state('');
	let worktreeParentFolder = $state('');
	let accentColor = $state(WORKSPACE_ACCENT_PALETTE[0]);
	let authWizardOpen = $state(false);
	let confirmDelete = $state(false);

	const open = $derived(dashboard !== null);

	$effect(() => {
		if (dashboard !== null) {
			untrack(() => {
				name = dashboard!.name;
				githubRepo = dashboard!.github_repo ?? '';
				localFolder = dashboard!.local_folder ?? '';
				defaultBaseBranch = dashboard!.default_base_branch ?? '';
				worktreeParentFolder = dashboard!.worktree_parent_folder ?? '';
				accentColor = dashboard!.accent_color ?? WORKSPACE_ACCENT_PALETTE[0];
				confirmDelete = false;
			});
		}
	});

	function handleSubmit(event: SubmitEvent) {
		event.preventDefault();
		const request = buildUpdateDashboardRequest(
			dashboard,
			name,
			accentColor,
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

					<div class="flex flex-col gap-1.5">
						<Label>{m.palette_color_palette()}</Label>
						<ColorPickerContent
							colors={WORKSPACE_ACCENT_PALETTE}
							selectedColor={accentColor}
							onSelect={(color) => (accentColor = color)}
						/>
					</div>

					{#if dashboard.type === 'repo'}
						<GhSetupBanner
							authStatus={versionControl.authStatus}
							onconnect={() => (authWizardOpen = true)}
						/>

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
					<Button intent="danger" type="button" size="sm" onclick={handleDelete}>
						{confirmDelete ? m.btn_confirm_delete() : m.btn_delete()}
					</Button>
					<div class="flex gap-2">
						<Button intent="ghost" type="button" onclick={onClose}>
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

<GitHubAuthWizard
	bind:open={authWizardOpen}
	onconnected={() => void versionControl.checkAuthStatus()}
/>
