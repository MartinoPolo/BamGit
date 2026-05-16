<script lang="ts">
	import { Button } from '$lib/components/shadcn/button/index.js';
	import { SimpleTooltip } from '$lib/components/shadcn/tooltip/index.js';
	import FolderIcon from '@lucide/svelte/icons/folder';
	import TerminalIcon from '@lucide/svelte/icons/terminal';
	import VscodeIcon from '$lib/components/derived/icons/VscodeIcon.svelte';
	import Volume2Icon from '@lucide/svelte/icons/volume-2';
	import VolumeXIcon from '@lucide/svelte/icons/volume-x';
	import { useIssueCard } from '$lib/modules/issue-card/index.js';
	import { useIssues } from '$lib/modules/issues';
	import { invoke } from '$lib/tauri.js';

	const ctx = useIssueCard();
	const issuesStore = useIssues();

	function handleQuickAction(event: MouseEvent, action: string) {
		event.stopPropagation();
		if (!ctx.hasWorktree) {
			if (ctx.onQuickActionAssignFolder) {
				ctx.onQuickActionAssignFolder(ctx.issue.id);
			}
			return;
		}
		if (ctx.onExecuteAction) {
			ctx.onExecuteAction(action, ctx.issue.id);
		}
	}

	function handleQuickActionContextMenu(event: MouseEvent) {
		event.preventDefault();
		event.stopPropagation();
		if (ctx.onQuickActionAssignFolder) {
			ctx.onQuickActionAssignFolder(ctx.issue.id);
		}
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

<div class="ml-0.5 flex items-center gap-0.5">
	<SimpleTooltip
		text={ctx.hasWorktree ? `Open ${ctx.issue.branch_name ?? 'folder'}` : 'Assign folder'}
	>
		<Button
			intent="ghost-overlay"
			size="icon-sm"
			aria-label="Open folder"
			style="opacity: {ctx.hasWorktree ? 0.6 : 0.35}"
			onclick={(event: MouseEvent) => handleQuickAction(event, 'open-folder')}
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
			style="opacity: {ctx.hasWorktree ? 0.6 : 0.35}"
			onclick={(event: MouseEvent) => handleQuickAction(event, 'open-terminal')}
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
			style="opacity: {ctx.hasWorktree ? 0.6 : 0.35}"
			onclick={(event: MouseEvent) => handleQuickAction(event, 'open-editor')}
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
			style="opacity: {ctx.issue.is_sound_muted ? 0.35 : 0.6}"
			onclick={handleToggleMute}
		>
			{#if ctx.issue.is_sound_muted}
				<VolumeXIcon strokeWidth={1.7} data-icon="inline-start" />
			{:else}
				<Volume2Icon strokeWidth={1.7} data-icon="inline-start" />
			{/if}
		</Button>
	</SimpleTooltip>
</div>
