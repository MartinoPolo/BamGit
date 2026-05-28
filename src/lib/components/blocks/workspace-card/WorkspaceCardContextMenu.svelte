<script lang="ts">
	import type { Snippet } from 'svelte';
	import * as ContextMenu from '$lib/components/shadcn/context-menu/index.js';
	import type { OverviewWorkspaceData } from '$lib/types/generated';
	import { openUrl, openPath } from '$lib/opener.js';
	import EditIcon from '@lucide/svelte/icons/pencil';
	import SettingsIcon from '@lucide/svelte/icons/settings';
	import FolderOpenIcon from '@lucide/svelte/icons/folder-open';
	import ExternalLinkIcon from '@lucide/svelte/icons/external-link';
	import GithubIcon from '$lib/components/derived/icons/GithubIcon.svelte';
	import ArchiveIcon from '@lucide/svelte/icons/archive';
	import ArchiveRestoreIcon from '@lucide/svelte/icons/archive-restore';
	import Trash2Icon from '@lucide/svelte/icons/trash-2';

	interface Props {
		workspace: OverviewWorkspaceData;
		onEdit: (workspace: OverviewWorkspaceData) => void;
		onSettings: (workspace: OverviewWorkspaceData) => void;
		onArchive: (workspace: OverviewWorkspaceData) => void;
		onUnarchive: (workspace: OverviewWorkspaceData) => void;
		onDelete: (workspace: OverviewWorkspaceData) => void;
		onOpenInNewWindow?: (workspace: OverviewWorkspaceData) => void;
		children: Snippet;
	}

	let {
		workspace,
		onEdit,
		onSettings,
		onArchive,
		onUnarchive,
		onDelete,
		onOpenInNewWindow,
		children,
	}: Props = $props();

	const isArchived = $derived(workspace.status === 'archived');
	const hasFolder = $derived(workspace.local_folder != null);
	const hasGithubRepo = $derived(workspace.github_repo != null);

	function handleOpenFolder() {
		if (workspace.local_folder != null) {
			void openPath(workspace.local_folder);
		}
	}

	function handleOpenGithub() {
		if (workspace.github_repo != null) {
			void openUrl(`https://github.com/${workspace.github_repo}`);
		}
	}
</script>

<ContextMenu.Root>
	<ContextMenu.Trigger>
		{@render children()}
	</ContextMenu.Trigger>

	<ContextMenu.Content>
		<ContextMenu.Group>
			<ContextMenu.Item onclick={() => onEdit(workspace)}>
				<EditIcon />
				Edit...
			</ContextMenu.Item>
			<ContextMenu.Item onclick={() => onSettings(workspace)}>
				<SettingsIcon />
				Settings
			</ContextMenu.Item>
			{#if onOpenInNewWindow}
				<ContextMenu.Item onclick={() => onOpenInNewWindow(workspace)}>
					<ExternalLinkIcon />
					Open in new window
				</ContextMenu.Item>
			{/if}
		</ContextMenu.Group>

		<ContextMenu.Separator />

		<ContextMenu.Group>
			<ContextMenu.Item
				disabled={!hasFolder}
				onclick={handleOpenFolder}
				title={!hasFolder ? 'No folder configured' : undefined}
			>
				<FolderOpenIcon />
				Open Folder
			</ContextMenu.Item>
			<ContextMenu.Item
				disabled={!hasGithubRepo}
				onclick={handleOpenGithub}
				title={!hasGithubRepo ? 'No GitHub repository configured' : undefined}
			>
				<GithubIcon />
				Open in GitHub
			</ContextMenu.Item>
		</ContextMenu.Group>

		<ContextMenu.Separator />

		<ContextMenu.Group>
			{#if isArchived}
				<ContextMenu.Item onclick={() => onUnarchive(workspace)}>
					<ArchiveRestoreIcon />
					Unarchive
				</ContextMenu.Item>
			{:else}
				<ContextMenu.Item onclick={() => onArchive(workspace)}>
					<ArchiveIcon />
					Archive
				</ContextMenu.Item>
			{/if}

			<ContextMenu.Item variant="destructive" onclick={() => onDelete(workspace)}>
				<Trash2Icon />
				Delete...
			</ContextMenu.Item>
		</ContextMenu.Group>
	</ContextMenu.Content>
</ContextMenu.Root>
