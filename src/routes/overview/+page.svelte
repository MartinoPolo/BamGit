<script lang="ts">
	import { onMount } from 'svelte';
	import { openPath } from '@tauri-apps/plugin-opener';
	import { useBoard } from '$lib/modules/board';
	import { getOverviewData, openWorkspaceWindow } from '$lib/modules/window';
	import WorkspaceCard from '$lib/components/WorkspaceCard.svelte';
	import AddWorkspaceCard from '$lib/components/AddWorkspaceCard.svelte';
	import type { OverviewWorkspaceData } from '$lib/types/generated';

	const boardStore = useBoard();

	let workspaces = $state<OverviewWorkspaceData[]>([]);
	let loading = $state(true);
	let error = $state<string | null>(null);

	onMount(async () => {
		try {
			workspaces = await getOverviewData();
		} catch (err) {
			error = String(err);
		} finally {
			loading = false;
		}
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
</script>

<div class="flex flex-col gap-6 p-8">
	<div>
		<h1 class="text-2xl font-bold text-foreground">Grovekeeper</h1>
		<p class="text-sm text-muted-foreground">Your workspaces</p>
	</div>

	{#if loading}
		<p class="text-muted-foreground">Loading workspaces...</p>
	{:else if error}
		<p class="text-destructive">Error: {error}</p>
	{:else}
		<div class="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-4">
			{#each workspaces as workspace (workspace.dashboard_id)}
				<WorkspaceCard
					{workspace}
					palette={boardStore.getPaletteForDashboard(workspace.color_palette_id ?? null)}
					onclick={() => handleOpenWorkspace(workspace.dashboard_id)}
					onGithubClick={workspace.github_repo
						? () => handleGithubClick(workspace.github_repo!)
						: undefined}
					onFolderClick={workspace.local_folder
						? () => handleFolderClick(workspace.local_folder!)
						: undefined}
				/>
			{/each}
			<AddWorkspaceCard onclick={() => (boardStore.showCreateDialog = true)} />
		</div>
	{/if}
</div>
