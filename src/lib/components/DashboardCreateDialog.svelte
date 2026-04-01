<script lang="ts">
	import type { CreateDashboardRequest, Dashboard } from '$lib/types/dashboard';

	interface Props {
		open: boolean;
		repo_dashboards: Dashboard[];
		on_close: () => void;
		on_create: (request: CreateDashboardRequest, selected_repo_ids: string[]) => void;
	}

	let { open, repo_dashboards, on_close, on_create }: Props = $props();

	let dashboard_type = $state<'repo' | 'portfolio'>('repo');
	let name = $state('');
	let github_repo = $state('');
	let local_folder = $state('');
	let default_base_branch = $state('');
	let worktree_parent_folder = $state('');
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
	class="w-full max-w-md rounded-lg border border-neutral-700 bg-neutral-900 p-0 text-neutral-100 shadow-xl backdrop:bg-black/50"
>
	<form onsubmit={handle_submit} class="flex flex-col gap-4 p-6">
		<h2 class="text-lg font-semibold">Create Dashboard</h2>

		<!-- Type selector -->
		<div class="flex gap-2">
			<button
				type="button"
				onclick={() => (dashboard_type = 'repo')}
				class="flex-1 rounded px-3 py-2 text-sm transition-colors {dashboard_type === 'repo'
					? 'bg-blue-600 text-white'
					: 'bg-neutral-800 text-neutral-400 hover:text-neutral-200'}"
			>
				◆ Repo
			</button>
			<button
				type="button"
				onclick={() => (dashboard_type = 'portfolio')}
				class="flex-1 rounded px-3 py-2 text-sm transition-colors {dashboard_type === 'portfolio'
					? 'bg-blue-600 text-white'
					: 'bg-neutral-800 text-neutral-400 hover:text-neutral-200'}"
			>
				◇ Portfolio
			</button>
		</div>

		<!-- Name (always shown) -->
		<label class="flex flex-col gap-1">
			<span class="text-xs text-neutral-400">Name *</span>
			<input
				bind:value={name}
				required
				class="rounded border border-neutral-700 bg-neutral-800 px-3 py-2 text-sm text-neutral-100 outline-none focus:border-blue-500"
				placeholder="My Project"
			/>
		</label>

		<!-- Repo-specific fields -->
		{#if dashboard_type === 'portfolio'}
			<!-- Portfolio repo picker -->
			<fieldset class="flex flex-col gap-1">
				<legend class="text-xs text-neutral-400">Repo Dashboards</legend>
				{#if repo_dashboards.length === 0}
					<p class="text-xs text-neutral-500">No repo dashboards yet. Create one first.</p>
				{:else}
					<div class="flex flex-col gap-1 rounded border border-neutral-700 bg-neutral-800 p-2">
						{#each repo_dashboards as repo (repo.id)}
							<label class="flex items-center gap-2 rounded px-2 py-1 text-sm hover:bg-neutral-700">
								<input
									type="checkbox"
									checked={selected_repo_ids.has(repo.id)}
									onchange={() => {
										const next = new Set(selected_repo_ids);
										if (next.has(repo.id)) {
								next.delete(repo.id);
							}
										else { next.add(repo.id); }
										selected_repo_ids = next;
									}}
									class="accent-blue-500"
								/>
								<span class="text-neutral-300">{repo.name}</span>
								{#if repo.github_repo}
									<span class="text-xs text-neutral-500">{repo.github_repo}</span>
								{/if}
							</label>
						{/each}
					</div>
				{/if}
			</fieldset>
		{:else if dashboard_type === 'repo'}
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
					placeholder="C:/projects/my-project"
				/>
			</label>
			<label class="flex flex-col gap-1">
				<span class="text-xs text-neutral-400">Default Base Branch</span>
				<input
					bind:value={default_base_branch}
					class="rounded border border-neutral-700 bg-neutral-800 px-3 py-2 text-sm text-neutral-100 outline-none focus:border-blue-500"
					placeholder="main"
				/>
			</label>
			<label class="flex flex-col gap-1">
				<span class="text-xs text-neutral-400">Worktree Parent Folder</span>
				<input
					bind:value={worktree_parent_folder}
					class="rounded border border-neutral-700 bg-neutral-800 px-3 py-2 text-sm text-neutral-100 outline-none focus:border-blue-500"
					placeholder="C:/worktrees/my-project"
				/>
			</label>
		{/if}

		<!-- Actions -->
		<div class="flex justify-end gap-2 pt-2">
			<button
				type="button"
				onclick={handle_cancel}
				class="rounded px-4 py-2 text-sm text-neutral-400 transition-colors hover:text-neutral-200"
			>
				Cancel
			</button>
			<button
				type="submit"
				class="rounded bg-blue-600 px-4 py-2 text-sm text-white transition-colors hover:bg-blue-500"
			>
				Create
			</button>
		</div>
	</form>
</dialog>
