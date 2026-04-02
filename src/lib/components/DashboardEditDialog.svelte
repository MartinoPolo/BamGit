<script lang="ts">
	import type { Dashboard, UpdateDashboardRequest } from '$lib/types/dashboard';

	interface Props {
		dashboard: Dashboard | null;
		on_close: () => void;
		on_update: (request: UpdateDashboardRequest) => void;
		on_delete: (id: string) => void;
	}

	let { dashboard, on_close, on_update, on_delete }: Props = $props();

	let name = $state('');
	let github_repo = $state('');
	let local_folder = $state('');
	let default_base_branch = $state('');
	let worktree_parent_folder = $state('');
	let confirm_delete = $state(false);
	let dialog_element: HTMLDialogElement | undefined = $state();

	$effect(() => {
		if (dashboard !== null && dialog_element !== undefined && !dialog_element.open) {
			name = dashboard.name;
			github_repo = dashboard.github_repo ?? '';
			local_folder = dashboard.local_folder ?? '';
			default_base_branch = dashboard.default_base_branch ?? '';
			worktree_parent_folder = dashboard.worktree_parent_folder ?? '';
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
	class="w-full max-w-md rounded-lg border border-neutral-700 bg-neutral-900 p-0 text-neutral-100 shadow-xl backdrop:bg-black/50"
>
	{#if dashboard}
		<form onsubmit={handle_submit} class="flex flex-col gap-4 p-6">
			<h2 class="text-lg font-semibold">Edit Dashboard</h2>

			<label class="flex flex-col gap-1">
				<span class="text-xs text-neutral-400">Name *</span>
				<input
					bind:value={name}
					required
					class="rounded border border-neutral-700 bg-neutral-800 px-3 py-2 text-sm text-neutral-100 outline-none focus:border-blue-500"
				/>
			</label>

			{#if dashboard.type === 'repo'}
				<label class="flex flex-col gap-1">
					<span class="text-xs text-neutral-400">GitHub Repo</span>
					<input
						bind:value={github_repo}
						class="rounded border border-neutral-700 bg-neutral-800 px-3 py-2 text-sm text-neutral-100 outline-none focus:border-blue-500"
						placeholder="owner/repo"
					/>
				</label>
				<label class="flex flex-col gap-1">
					<span class="text-xs text-neutral-400">Local Folder</span>
					<input
						bind:value={local_folder}
						class="rounded border border-neutral-700 bg-neutral-800 px-3 py-2 text-sm text-neutral-100 outline-none focus:border-blue-500"
					/>
				</label>
				<label class="flex flex-col gap-1">
					<span class="text-xs text-neutral-400">Default Base Branch</span>
					<input
						bind:value={default_base_branch}
						class="rounded border border-neutral-700 bg-neutral-800 px-3 py-2 text-sm text-neutral-100 outline-none focus:border-blue-500"
					/>
				</label>
				<label class="flex flex-col gap-1">
					<span class="text-xs text-neutral-400">Worktree Parent Folder</span>
					<input
						bind:value={worktree_parent_folder}
						class="rounded border border-neutral-700 bg-neutral-800 px-3 py-2 text-sm text-neutral-100 outline-none focus:border-blue-500"
					/>
				</label>
			{/if}

			<div class="flex items-center justify-between pt-2">
				<button
					type="button"
					onclick={handle_delete}
					class="rounded px-3 py-2 text-sm transition-colors {confirm_delete
						? 'bg-red-600 text-white'
						: 'text-red-400 hover:text-red-300'}"
				>
					{confirm_delete ? 'Confirm Delete' : 'Delete'}
				</button>
				<div class="flex gap-2">
					<button
						type="button"
						onclick={on_close}
						class="rounded px-4 py-2 text-sm text-neutral-400 transition-colors hover:text-neutral-200"
					>
						Cancel
					</button>
					<button
						type="submit"
						class="rounded bg-blue-600 px-4 py-2 text-sm text-white transition-colors hover:bg-blue-500"
					>
						Save
					</button>
				</div>
			</div>
		</form>
	{/if}
</dialog>
