<script lang="ts">
	import * as m from '$lib/paraglide/messages.js';
	import type { CreateDashboardRequest } from '$lib/modules/board';
	import * as Dialog from '$lib/components/shadcn/dialog/index.js';
	import { Button } from '$lib/components/shadcn/button/index.js';
	import { Input } from '$lib/components/shadcn/input/index.js';
	import { Label } from '$lib/components/shadcn/label/index.js';
	import { ColorPickerContent } from '$lib/components/derived/color-picker/index.js';
	import { WORKSPACE_ACCENT_PALETTE } from '$lib/components/derived/color-picker/color_utils.js';
	import PathInput from '$lib/components/derived/path-input/PathInput.svelte';
	import RepoCombobox from '$lib/components/derived/repo-combobox/RepoCombobox.svelte';
	import BranchCombobox from '$lib/components/derived/branch-combobox/BranchCombobox.svelte';
	import {
		buildCreateDashboardRequest,
		deriveWorktreeFolder,
	} from '$lib/components/blocks/issue/dialog_helpers.js';

	interface Props {
		open: boolean;
		onClose: () => void;
		onCreate: (request: CreateDashboardRequest) => void;
	}

	let { open, onClose, onCreate }: Props = $props();

	let name = $state('');
	let githubRepo = $state('');
	let localFolder = $state('');
	let defaultBaseBranch = $state('');
	let worktreeParentFolder = $state('');
	let accentColor = $state(WORKSPACE_ACCENT_PALETTE[0]);
	let worktreeManuallyEdited = $state(false);

	$effect(() => {
		if (localFolder && !worktreeManuallyEdited) {
			worktreeParentFolder = deriveWorktreeFolder(localFolder);
		}
	});

	function resetForm() {
		name = '';
		githubRepo = '';
		localFolder = '';
		defaultBaseBranch = '';
		worktreeParentFolder = '';
		accentColor = WORKSPACE_ACCENT_PALETTE[0];
		worktreeManuallyEdited = false;
	}

	function handleSubmit(event: SubmitEvent) {
		event.preventDefault();
		const request = buildCreateDashboardRequest(
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
		onCreate(request);
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
	<Dialog.Content class="max-w-md" onEscapeKeydown={(e) => e.stopPropagation()}>
		<form onsubmit={handleSubmit} class="flex flex-col gap-4">
			<Dialog.Header>
				<Dialog.Title>{m.dashboard_create_title()}</Dialog.Title>
			</Dialog.Header>

			<Dialog.Body class="flex flex-col gap-4">
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

				<!-- GitHub Repo -->
				<div class="flex flex-col gap-1.5">
					<Label for="dashboard-github-repo">{m.dashboard_field_github_repo()}</Label>
					<RepoCombobox
						id="dashboard-github-repo"
						bind:value={githubRepo}
						placeholder={m.dashboard_placeholder_github_repo()}
					/>
				</div>

				<!-- Default Base Branch -->
				<div class="flex flex-col gap-1.5">
					<Label for="dashboard-base-branch"
						>{m.dashboard_field_default_base_branch()}</Label
					>
					<BranchCombobox
						id="dashboard-base-branch"
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
					<Label for="dashboard-local-folder">{m.dashboard_field_local_folder()}</Label>
					<PathInput
						id="dashboard-local-folder"
						bind:value={localFolder}
						placeholder={m.dashboard_placeholder_local_folder()}
					/>
				</div>

				<!-- Worktree Parent Folder -->
				<div class="flex flex-col gap-1.5">
					<Label for="dashboard-worktree-folder"
						>{m.dashboard_field_worktree_parent_folder()}</Label
					>
					<PathInput
						id="dashboard-worktree-folder"
						bind:value={worktreeParentFolder}
						placeholder={m.dashboard_placeholder_worktree_parent()}
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

			<Dialog.Footer>
				<Button intent="ghost" type="button" onclick={handleCancel}>
					{m.btn_cancel()}
				</Button>
				<Button type="submit">
					{m.btn_create()}
				</Button>
			</Dialog.Footer>
		</form>
	</Dialog.Content>
</Dialog.Root>
