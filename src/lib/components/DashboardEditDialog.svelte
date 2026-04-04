<script lang="ts">
	import type { Dashboard, UpdateDashboardRequest } from '$lib/types/dashboard';
	import type { ColorPalette } from '$lib/types/color_palette';
	import PaletteSelector from './PaletteSelector.svelte';

	interface Props {
		dashboard: Dashboard | null;
		color_palettes: ColorPalette[];
		on_close: () => void;
		on_update: (request: UpdateDashboardRequest) => void;
		on_delete: (id: string) => void;
	}

	let { dashboard, color_palettes, on_close, on_update, on_delete }: Props = $props();

	let name = $state('');
	let github_repo = $state('');
	let local_folder = $state('');
	let default_base_branch = $state('');
	let worktree_parent_folder = $state('');
	let color_palette_id = $state<string | null>(null);
	let confirm_delete = $state(false);
	let dialog_element: HTMLDialogElement | undefined = $state();

	$effect(() => {
		if (dashboard !== null && dialog_element !== undefined && !dialog_element.open) {
			name = dashboard.name;
			github_repo = dashboard.github_repo ?? '';
			local_folder = dashboard.local_folder ?? '';
			default_base_branch = dashboard.default_base_branch ?? '';
			worktree_parent_folder = dashboard.worktree_parent_folder ?? '';
			color_palette_id = dashboard.color_palette_id ?? null;
			confirm_delete = false;
			dialog_element.showModal();
		} else if (dashboard === null && dialog_element?.open === true) {
			dialog_element.close();
		}
	});

	function handle_submit(event: SubmitEvent) {
		event.preventDefault();
		if (dashboard === null || !name.trim()) {
			return;
		}

		const request: UpdateDashboardRequest = {
			id: dashboard.id,
			name: name.trim(),
			color_palette_id: color_palette_id,
		};

		if (dashboard.type === 'repo') {
			request.github_repo = github_repo.trim() || null;
			request.local_folder = local_folder.trim() || null;
			request.default_base_branch = default_base_branch.trim() || null;
			request.worktree_parent_folder = worktree_parent_folder.trim() || null;
		}

		on_update(request);
		on_close();
	}

	function handle_delete() {
		if (dashboard === null) {
			return;
		}
		if (!confirm_delete) {
			confirm_delete = true;
			return;
		}
		on_delete(dashboard.id);
		on_close();
	}
</script>

<dialog
	bind:this={dialog_element}
	onclose={on_close}
	class="w-full max-w-md rounded-lg border border-border bg-popover p-0 text-popover-foreground shadow-xl backdrop:bg-black/50"
>
	{#if dashboard}
		<form onsubmit={handle_submit} class="flex flex-col gap-4 p-6">
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
				palettes={color_palettes}
				selected_palette_id={color_palette_id}
				on_select={(id) => (color_palette_id = id)}
			/>

			{#if dashboard.type === 'repo'}
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
					/>
				</label>
				<label class="flex flex-col gap-1">
					<span class="text-xs text-muted-foreground">Default Base Branch</span>
					<input
						bind:value={default_base_branch}
						class="rounded border border-input bg-muted px-3 py-2 text-sm text-foreground outline-none focus:border-ring"
					/>
				</label>
				<label class="flex flex-col gap-1">
					<span class="text-xs text-muted-foreground">Worktree Parent Folder</span>
					<input
						bind:value={worktree_parent_folder}
						class="rounded border border-input bg-muted px-3 py-2 text-sm text-foreground outline-none focus:border-ring"
					/>
				</label>
			{/if}

			<div class="flex items-center justify-between pt-2">
				<button
					type="button"
					onclick={handle_delete}
					class="rounded px-3 py-2 text-sm transition-colors {confirm_delete
						? 'bg-destructive text-destructive-foreground'
						: 'text-destructive hover:text-destructive/80'}"
				>
					{confirm_delete ? 'Confirm Delete' : 'Delete'}
				</button>
				<div class="flex gap-2">
					<button
						type="button"
						onclick={on_close}
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
