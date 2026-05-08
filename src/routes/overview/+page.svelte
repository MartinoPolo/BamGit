<script lang="ts">
	import * as m from '$lib/paraglide/messages.js';
	import { openPath } from '$lib/opener.js';
	import { useBoard } from '$lib/modules/board';
	import { getOverviewData, openWorkspaceWindow } from '$lib/modules/window';
	import WorkspaceCard from '$lib/components/WorkspaceCard.svelte';
	import AddWorkspaceCard from '$lib/components/AddWorkspaceCard.svelte';
	import type { OverviewWorkspaceData } from '$lib/types/generated';

	const boardStore = useBoard();

	let workspaces = $state<OverviewWorkspaceData[]>([]);
	let loading = $state(true);
	let error = $state<string | null>(null);

	$effect(() => {
		void boardStore.dashboards; // re-run when workspace list changes
		void (async () => {
			loading = true;
			try {
				workspaces = await getOverviewData();
				error = null;
			} catch (err) {
				error = String(err);
			} finally {
				loading = false;
			}
		})();
	});

	async function handleOpenWorkspace(dashboardId: string) {
		try {
			await openWorkspaceWindow(dashboardId);
		} catch (err) {
			console.error('Failed to open workspace window:', err);
		}
	}

	function handleGithubClick(githubRepo: string) {
		window.open(`https://github.com/${githubRepo}`, '_blank');
	}

	function handleFolderClick(localFolder: string) {
		void openPath(localFolder);
	}

	function handleConfigWizard(_dashboardId: string) {
		// TODO: open config wizard for workspace
		console.info('Config wizard for', _dashboardId);
	}
</script>

<div class="flex flex-col gap-6 p-8">
	<div>
		<h1 class="text-2xl font-bold text-foreground">{m.app_name()}</h1>
		<p class="text-sm text-muted-foreground">{m.overview_subtitle()}</p>
	</div>

	{#if loading}
		<p class="text-muted-foreground">{m.overview_loading()}</p>
	{:else if error !== null}
		<p class="text-destructive">{m.error_prefix({ message: error })}</p>
	{:else}
		<div class="grid auto-rows-[1fr] grid-cols-[repeat(auto-fill,340px)] gap-4">
			{#each workspaces as workspace (workspace.dashboard_id)}
				<WorkspaceCard
					{workspace}
					onclick={() => handleOpenWorkspace(workspace.dashboard_id)}
					onGithubClick={workspace.github_repo != null
						? () => handleGithubClick(workspace.github_repo!)
						: () => handleConfigWizard(workspace.dashboard_id)}
					onFolderClick={workspace.local_folder != null
						? () => handleFolderClick(workspace.local_folder!)
						: () => handleConfigWizard(workspace.dashboard_id)}
					onGithubRightClick={() => handleConfigWizard(workspace.dashboard_id)}
					onFolderRightClick={() => handleConfigWizard(workspace.dashboard_id)}
				/>
			{/each}
			<AddWorkspaceCard onclick={() => (boardStore.showCreateDialog = true)} />
		</div>
	{/if}
</div>
