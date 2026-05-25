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
	import BranchCombobox from '$lib/components/derived/branch-combobox/BranchCombobox.svelte';
	import GhSetupBanner from '$lib/components/blocks/github/GhSetupBanner.svelte';
	import GitHubAuthWizard from '$lib/components/blocks/github-auth/GitHubAuthWizard.svelte';
	import {
		buildUpdateDashboardRequest,
		deriveWorktreeFolder,
	} from '$lib/components/blocks/issue/dialog_helpers.js';

	interface Props {
		dashboard: Dashboard | null;
		onClose: () => void;
		onUpdate: (request: UpdateDashboardRequest) => void;
		onArchive: (id: string) => void;
	}

	let { dashboard, onClose, onUpdate, onArchive }: Props = $props();

	const versionControl = useVersionControl();

	let name = $state('');
	let githubRepo = $state('');
	let localFolder = $state('');
	let defaultBaseBranch = $state('');
	let worktreeParentFolder = $state('');
	let accentColor = $state(WORKSPACE_ACCENT_PALETTE[0]);
	let authWizardOpen = $state(false);
	let confirmArchive = $state(false);
	let worktreeManuallyEdited = $state(false);

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
				confirmArchive = false;
				worktreeManuallyEdited =
					dashboard!.worktree_parent_folder !== null &&
					dashboard!.worktree_parent_folder !== '';
			});
		}
	});

	$effect(() => {
		if (localFolder !== '' && !worktreeManuallyEdited) {
			worktreeParentFolder = deriveWorktreeFolder(localFolder);
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

	function handleArchive() {
		if (dashboard === null) {
			return;
		}
		if (!confirmArchive) {
			confirmArchive = true;
			return;
		}
		onArchive(dashboard.id);
		onClose();
	}

	function handleOpenChange(isOpen: boolean) {
		if (!isOpen) {
			onClose();
		}
	}
</script>

<Dialog.Root {open} onOpenChange={handleOpenChange}>
	<Dialog.Content class="max-w-md" onEscapeKeydown={(e) => e.stopPropagation()}>
		{#if dashboard}
			<form onsubmit={handleSubmit} class="flex flex-col gap-4">
				<Dialog.Header>
					<Dialog.Title>{m.dashboard_edit_title()}</Dialog.Title>
				</Dialog.Header>

				<Dialog.Body class="flex flex-col gap-4">
					<!-- Name -->
					<div class="flex flex-col gap-1.5">
						<Label for="edit-dashboard-name">{m.dashboard_field_name()}</Label>
						<Input id="edit-dashboard-name" bind:value={name} required />
					</div>

					<GhSetupBanner
						authStatus={versionControl.authStatus}
						onconnect={() => (authWizardOpen = true)}
					/>

					<!-- GitHub Repo -->
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

					<!-- Default Base Branch -->
					<div class="flex flex-col gap-1.5">
						<Label for="edit-dashboard-base-branch"
							>{m.dashboard_field_default_base_branch()}</Label
						>
						<BranchCombobox
							id="edit-dashboard-base-branch"
							bind:value={defaultBaseBranch}
							{githubRepo}
							disabled={!githubRepo}
							placeholder={githubRepo
								? m.dashboard_placeholder_base_branch()
								: m.dashboard_placeholder_branch_select_repo_first()}
						/>
					</div>

					<!-- Local Folder -->
					<div class="flex flex-col gap-1.5">
						<Label for="edit-dashboard-local-folder"
							>{m.dashboard_field_local_folder()}</Label
						>
						<PathInput id="edit-dashboard-local-folder" bind:value={localFolder} />
					</div>

					<!-- Worktree Parent Folder -->
					<div class="flex flex-col gap-1.5">
						<Label for="edit-dashboard-worktree"
							>{m.dashboard_field_worktree_parent_folder()}</Label
						>
						<PathInput
							id="edit-dashboard-worktree"
							bind:value={worktreeParentFolder}
							onchange={() => {
								worktreeManuallyEdited = true;
							}}
						/>
					</div>

					<!-- Accent Color -->
					<div class="flex flex-col gap-1.5">
						<Label>{m.palette_color_palette()}</Label>
						<ColorPickerContent
							colors={WORKSPACE_ACCENT_PALETTE}
							selectedColor={accentColor}
							onSelect={(color) => (accentColor = color)}
						/>
					</div>
				</Dialog.Body>

				<Dialog.Footer class="justify-between">
					<Button intent="danger" type="button" size="sm" onclick={handleArchive}>
						{confirmArchive ? m.btn_confirm_archive() : m.btn_archive()}
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
