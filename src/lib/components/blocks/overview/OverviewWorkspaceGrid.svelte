<script lang="ts">
	import WorkspaceCard from '$lib/components/blocks/workspace-card/WorkspaceCard.svelte';
	import AddWorkspaceCard from '$lib/components/blocks/workspace/AddWorkspaceCard.svelte';
	import type { OverviewWorkspaceData } from '$lib/types/generated';

	interface Props {
		workspaces: OverviewWorkspaceData[];
		onAddWorkspace: () => void;
		onOpenWorkspace: (dashboardId: string) => void;
		onGithubClick: (workspace: OverviewWorkspaceData) => void;
		onFolderClick: (workspace: OverviewWorkspaceData) => void;
		onConfigureWorkspace: (dashboardId: string) => void;
	}

	let {
		workspaces,
		onAddWorkspace,
		onOpenWorkspace,
		onGithubClick,
		onFolderClick,
		onConfigureWorkspace,
	}: Props = $props();
</script>

<div
	class="grid auto-rows-fr grid-cols-[repeat(auto-fill,340px)] items-stretch gap-4 max-md:grid-cols-[minmax(0,1fr)]"
>
	{#each workspaces as workspace (workspace.dashboard_id)}
		<WorkspaceCard
			{workspace}
			onclick={() => onOpenWorkspace(workspace.dashboard_id)}
			onGithubClick={() => onGithubClick(workspace)}
			onFolderClick={() => onFolderClick(workspace)}
			onGithubRightClick={() => onConfigureWorkspace(workspace.dashboard_id)}
			onFolderRightClick={() => onConfigureWorkspace(workspace.dashboard_id)}
		/>
	{/each}
	<AddWorkspaceCard onclick={onAddWorkspace} />
</div>
