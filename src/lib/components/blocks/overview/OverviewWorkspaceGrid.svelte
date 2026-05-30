<script lang="ts">
	import WorkspaceCard from '$lib/components/blocks/workspace-card/WorkspaceCard.svelte';
	import WorkspaceCardContextMenu from '$lib/components/blocks/workspace-card/WorkspaceCardContextMenu.svelte';
	import AddWorkspaceCard from '$lib/components/blocks/workspace/AddWorkspaceCard.svelte';
	import type { OverviewWorkspaceData } from '$lib/types/generated';
	import {
		OVERVIEW_FOOTER_CONTENT_DEFAULT,
		type OverviewFooterContent,
	} from './overview_toolbar_types.js';

	interface Props {
		workspaces: OverviewWorkspaceData[];
		footerContent?: OverviewFooterContent;
		currency?: string;
		exchangeRate?: number | null;
		onAddWorkspace: () => void;
		onOpenWorkspace: (dashboardId: string) => void;
		onGithubClick: (workspace: OverviewWorkspaceData) => void;
		onFolderClick: (workspace: OverviewWorkspaceData) => void;
		onGithubRightClick: (workspace: OverviewWorkspaceData) => void;
		onFolderRightClick: (workspace: OverviewWorkspaceData) => void;
		onEdit: (workspace: OverviewWorkspaceData) => void;
		onSettings: (workspace: OverviewWorkspaceData) => void;
		onArchive: (workspace: OverviewWorkspaceData) => void;
		onUnarchive: (workspace: OverviewWorkspaceData) => void;
		onDelete: (workspace: OverviewWorkspaceData) => void;
		onOpenInNewWindow?: (workspace: OverviewWorkspaceData) => void;
	}

	let {
		workspaces,
		footerContent = OVERVIEW_FOOTER_CONTENT_DEFAULT,
		currency,
		exchangeRate,
		onAddWorkspace,
		onOpenWorkspace,
		onGithubClick,
		onFolderClick,
		onGithubRightClick,
		onFolderRightClick,
		onEdit,
		onSettings,
		onArchive,
		onUnarchive,
		onDelete,
		onOpenInNewWindow,
	}: Props = $props();
</script>

<div
	class="grid auto-rows-fr grid-cols-[repeat(auto-fill,340px)] items-stretch gap-4 max-md:grid-cols-[minmax(0,1fr)]"
>
	{#each workspaces as workspace (workspace.dashboard_id)}
		<WorkspaceCardContextMenu
			{workspace}
			{onEdit}
			{onSettings}
			{onArchive}
			{onUnarchive}
			{onDelete}
			{onOpenInNewWindow}
		>
			<WorkspaceCard
				{workspace}
				{footerContent}
				{currency}
				{exchangeRate}
				onclick={() => onOpenWorkspace(workspace.dashboard_id)}
				onGithubClick={() => onGithubClick(workspace)}
				onFolderClick={() => onFolderClick(workspace)}
				onGithubRightClick={() => onGithubRightClick(workspace)}
				onFolderRightClick={() => onFolderRightClick(workspace)}
			/>
		</WorkspaceCardContextMenu>
	{/each}
	<AddWorkspaceCard onclick={onAddWorkspace} />
</div>
