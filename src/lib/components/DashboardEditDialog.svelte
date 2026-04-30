<script lang="ts">
	import * as m from '$lib/paraglide/messages.js';
	import type { UpdateDashboardRequest } from '$lib/modules/board';
	import type { Dashboard, ColorPalette } from '$lib/types/generated';
	import PaletteSelector from './PaletteSelector.svelte';
	import { syncDialogVisibility, buildUpdateDashboardRequest } from './dialog_helpers.js';

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
		syncDialogVisibility(dashboard !== null, dialogElement, () => {
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
</script>

<dialog
	bind:this={dialogElement}
	onclose={onClose}
	class="w-full max-w-md rounded-lg border border-border bg-popover p-0 text-popover-foreground shadow-xl backdrop:bg-black/50"
>
	{#if dashboard}
		<form onsubmit={handleSubmit} class="flex flex-col gap-4 p-6">
			<h2 class="text-lg font-semibold">{m.dashboard_edit_title()}</h2>

			<label class="flex flex-col gap-1">
				<span class="text-xs text-muted-foreground">{m.dashboard_field_name()}</span>
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
					<span class="text-xs text-muted-foreground"
						>{m.dashboard_field_github_repo()}</span
					>
					<input
						bind:value={githubRepo}
						class="rounded border border-input bg-muted px-3 py-2 text-sm text-foreground outline-none focus:border-ring"
						placeholder={m.dashboard_placeholder_github_repo()}
					/>
				</label>
				<label class="flex flex-col gap-1">
					<span class="text-xs text-muted-foreground"
						>{m.dashboard_field_local_folder()}</span
					>
					<input
						bind:value={localFolder}
						class="rounded border border-input bg-muted px-3 py-2 text-sm text-foreground outline-none focus:border-ring"
					/>
				</label>
				<label class="flex flex-col gap-1">
					<span class="text-xs text-muted-foreground"
						>{m.dashboard_field_default_base_branch()}</span
					>
					<input
						bind:value={defaultBaseBranch}
						class="rounded border border-input bg-muted px-3 py-2 text-sm text-foreground outline-none focus:border-ring"
					/>
				</label>
				<label class="flex flex-col gap-1">
					<span class="text-xs text-muted-foreground"
						>{m.dashboard_field_worktree_parent_folder()}</span
					>
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
					{confirmDelete ? m.btn_confirm_delete() : m.btn_delete()}
				</button>
				<div class="flex gap-2">
					<button
						type="button"
						onclick={onClose}
						class="rounded px-4 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
					>
						{m.btn_cancel()}
					</button>
					<button
						type="submit"
						class="rounded bg-primary px-4 py-2 text-sm text-primary-foreground transition-colors hover:bg-primary/90"
					>
						{m.btn_save()}
					</button>
				</div>
			</div>
		</form>
	{/if}
</dialog>
