<script lang="ts">
	import { Button } from '$lib/components/shadcn/button/index.js';
	import { SimpleTooltip } from '$lib/components/shadcn/tooltip/index.js';
	import FolderIcon from '@lucide/svelte/icons/folder';
	import TerminalIcon from '@lucide/svelte/icons/terminal';
	import VscodeIcon from '$lib/components/derived/icons/VscodeIcon.svelte';
	import Volume2Icon from '@lucide/svelte/icons/volume-2';
	import VolumeXIcon from '@lucide/svelte/icons/volume-x';
	import { useIssueCard } from './index.js';
	import { useIssues } from '$lib/modules/issues';
	import { invoke } from '$lib/tauri.js';

	const ctx = useIssueCard();
	const issuesStore = useIssues();

	const QUICK_ACTION_COMMANDS = {
		'open-folder': 'open_folder_in_explorer',
		'open-terminal': 'open_terminal',
		'open-editor': 'open_in_editor',
	} as const;

	type QuickActionKey = keyof typeof QUICK_ACTION_COMMANDS;

	async function handleQuickAction(event: MouseEvent, action: QuickActionKey) {
		event.stopPropagation();
		if (!ctx.hasWorktree) {
			await handleAssignFolder();
			return;
		}
		const folderPath = ctx.issue.worktree_folder ?? ctx.issue.editor_folder;
		if (!folderPath) {
			return;
		}
		try {
			const command = QUICK_ACTION_COMMANDS[action];
			if (action === 'open-terminal') {
				await invoke(command, { folderPath, tabColor: ctx.issue.color });
			} else {
				await invoke(command, { folderPath });
			}
		} catch (error) {
			console.error(`Failed to ${action}:`, error);
		}
	}

	async function handleAssignFolder() {
		try {
			const folder = await invoke<string | null>('pick_folder');
			if (folder !== null) {
				issuesStore.patchIssueLocal(ctx.issue.id, {
					worktree_folder: folder,
					editor_folder: folder,
				});
			}
		} catch (error) {
			console.error('Failed to assign folder:', error);
		}
	}

	function handleQuickActionContextMenu(event: MouseEvent) {
		event.preventDefault();
		event.stopPropagation();
		void handleAssignFolder();
	}

	async function handleToggleMute(event: MouseEvent) {
		event.stopPropagation();
		try {
			await invoke('toggle_issue_sound_mute', { issueId: ctx.issue.id });
			issuesStore.patchIssueLocal(ctx.issue.id, {
				is_sound_muted: !ctx.issue.is_sound_muted,
			});
		} catch (error) {
			console.error('Failed to toggle mute:', error);
		}
	}
</script>

<div class="ml-0.5 flex items-center gap-0.5" style="color: inherit;">
	<SimpleTooltip
		text={ctx.hasWorktree ? `Open ${ctx.issue.branch_name ?? 'folder'}` : 'Assign folder'}
	>
		<Button
			intent="ghost-overlay"
			size="icon-sm"
			aria-label="Open folder"
			class={ctx.hasWorktree ? '' : 'opacity-35!'}
			onclick={(event: MouseEvent) => void handleQuickAction(event, 'open-folder')}
			oncontextmenu={handleQuickActionContextMenu}
		>
			<FolderIcon strokeWidth={1.7} data-icon="inline-end" />
		</Button>
	</SimpleTooltip>
	<SimpleTooltip text={ctx.hasWorktree ? 'Open Terminal' : 'Assign folder'}>
		<Button
			intent="ghost-overlay"
			size="icon-sm"
			aria-label="Open terminal"
			class={ctx.hasWorktree ? '' : 'opacity-35!'}
			onclick={(event: MouseEvent) => void handleQuickAction(event, 'open-terminal')}
			oncontextmenu={handleQuickActionContextMenu}
		>
			<TerminalIcon strokeWidth={1.7} data-icon="inline-end" />
		</Button>
	</SimpleTooltip>
	<SimpleTooltip text={ctx.hasWorktree ? 'Open Editor' : 'Assign folder'}>
		<Button
			intent="ghost-overlay"
			size="icon-sm"
			aria-label="Open editor"
			class={ctx.hasWorktree ? '' : 'opacity-35!'}
			onclick={(event: MouseEvent) => void handleQuickAction(event, 'open-editor')}
			oncontextmenu={handleQuickActionContextMenu}
		>
			<VscodeIcon data-icon="inline-end" />
		</Button>
	</SimpleTooltip>
	<SimpleTooltip
		text={ctx.issue.is_sound_muted
			? 'Unmute sounds for this issue'
			: 'Mute sounds for this issue'}
	>
		<Button
			intent="ghost-overlay"
			size="icon-sm"
			aria-label="Toggle mute"
			class={ctx.issue.is_sound_muted ? 'opacity-35!' : ''}
			onclick={handleToggleMute}
			oncontextmenu={(event: MouseEvent) => {
				event.preventDefault();
				event.stopPropagation();
			}}
		>
			{#if ctx.issue.is_sound_muted}
				<VolumeXIcon strokeWidth={1.7} data-icon="inline-start" />
			{:else}
				<Volume2Icon strokeWidth={1.7} data-icon="inline-start" />
			{/if}
		</Button>
	</SimpleTooltip>
</div>
