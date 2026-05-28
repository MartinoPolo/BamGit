<script lang="ts">
	import WorkspaceCardContextMenu from './WorkspaceCardContextMenu.svelte';
	import type { OverviewWorkspaceData } from '$lib/types/generated';

	interface Props {
		workspace: OverviewWorkspaceData;
		onEdit: (workspace: OverviewWorkspaceData) => void;
		onSettings: (workspace: OverviewWorkspaceData) => void;
		onArchive: (workspace: OverviewWorkspaceData) => void;
		onUnarchive: (workspace: OverviewWorkspaceData) => void;
		onDelete: (workspace: OverviewWorkspaceData) => void;
		onOpenInNewWindow?: (workspace: OverviewWorkspaceData) => void;
		triggerLabel?: string;
	}

	let {
		workspace,
		onEdit,
		onSettings,
		onArchive,
		onUnarchive,
		onDelete,
		onOpenInNewWindow,
		triggerLabel = 'Test Workspace',
	}: Props = $props();
</script>

<WorkspaceCardContextMenu
	{workspace}
	{onEdit}
	{onSettings}
	{onArchive}
	{onUnarchive}
	{onDelete}
	{onOpenInNewWindow}
>
	<div data-testid="context-menu-trigger">{triggerLabel}</div>
</WorkspaceCardContextMenu>
