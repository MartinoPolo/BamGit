<script lang="ts">
	import type { Snippet } from 'svelte';
	import * as ContextMenu from '$lib/components/ui/context-menu/index.js';
	import type { Issue, IssueCardCallbacks } from '$lib/modules/issues';
	import { PRIORITY_OPTIONS } from '$lib/components/issue_card_utils.js';
	import CheckIcon from '@lucide/svelte/icons/check';
	import EditIcon from '@lucide/svelte/icons/pencil';
	import TagIcon from '@lucide/svelte/icons/tag';
	import PriorityIcon from '@lucide/svelte/icons/bar-chart-2';
	import PaletteIcon from '@lucide/svelte/icons/palette';
	import ArchiveIcon from '@lucide/svelte/icons/archive';
	import ArchiveRestoreIcon from '@lucide/svelte/icons/archive-restore';
	import GitBranchIcon from '@lucide/svelte/icons/git-branch';
	import GitBranchMinusIcon from '@lucide/svelte/icons/git-branch-minus';
	import TrashIcon from '@lucide/svelte/icons/trash-2';
	import SquareCheckIcon from '@lucide/svelte/icons/square-check';
	import SquareIcon from '@lucide/svelte/icons/square';

	// fallow-ignore-next-line code-duplication
	interface Props extends IssueCardCallbacks {
		issue: Issue;
		isBatchSelected: boolean;
		onToggleSelect: () => void;
		children: Snippet;
	}

	let {
		issue,
		isBatchSelected,
		onToggleSelect,
		onArchive,
		onUnarchive,
		onEdit,
		onDelete,
		onChangePriority,
		onRename,
		onSetupWorktree,
		onRemoveWorktree,
		onChangeColor,
		children,
	}: Props = $props();

	const isArchived = $derived(issue.status === 'archived');
	const isStandalone = $derived(issue.github_issue_url === null);
	const hasWorktree = $derived(
		issue.worktree_state !== 'none' && issue.worktree_state !== 'removed',
	);

	const selectLabel = $derived(isBatchSelected ? 'Deselect' : 'Select');
</script>

<ContextMenu.Root>
	<ContextMenu.Trigger>
		{@render children()}
	</ContextMenu.Trigger>

	<ContextMenu.Content>
		<!-- Select / Deselect -->
		<ContextMenu.Item onclick={onToggleSelect}>
			{#if isBatchSelected}
				<SquareCheckIcon class="size-4" />
			{:else}
				<SquareIcon class="size-4" />
			{/if}
			{selectLabel}
		</ContextMenu.Item>

		<ContextMenu.Separator />

		<!-- Edit -->
		<ContextMenu.Item onclick={() => onEdit(issue)}>
			<EditIcon class="size-4" />
			Edit
		</ContextMenu.Item>

		<!-- Rename — only for standalone issues (no GitHub URL) -->
		{#if isStandalone && onRename}
			<ContextMenu.Item onclick={() => onRename!(issue)}>
				<TagIcon class="size-4" />
				Rename
			</ContextMenu.Item>
		{/if}

		<!-- Priority submenu -->
		<ContextMenu.Sub>
			<ContextMenu.SubTrigger>
				<PriorityIcon class="size-4" />
				Priority
			</ContextMenu.SubTrigger>
			<ContextMenu.SubContent alignOffset={-5} sideOffset={2}>
				{#each PRIORITY_OPTIONS as option (option.value)}
					<ContextMenu.Item onclick={() => onChangePriority(issue.id, option.value)}>
						{#if issue.priority === option.value}
							<CheckIcon class="size-4" />
						{:else}
							<span class="size-4"></span>
						{/if}
						{option.label()}
					</ContextMenu.Item>
				{/each}
			</ContextMenu.SubContent>
		</ContextMenu.Sub>

		<!-- Change Color -->
		{#if onChangeColor}
			<ContextMenu.Item onclick={() => onChangeColor!(issue.id, issue.color ?? '#525252')}>
				<PaletteIcon class="size-4" />
				Change Color
			</ContextMenu.Item>
		{/if}

		<ContextMenu.Separator />

		<!-- Setup / Remove Worktree -->
		{#if hasWorktree}
			{#if onRemoveWorktree}
				<ContextMenu.Item onclick={() => onRemoveWorktree!(issue)}>
					<GitBranchMinusIcon class="size-4" />
					Remove Worktree
				</ContextMenu.Item>
			{/if}
		{:else if onSetupWorktree}
			<ContextMenu.Item onclick={() => onSetupWorktree!(issue)}>
				<GitBranchIcon class="size-4" />
				Setup Worktree
			</ContextMenu.Item>
		{/if}

		<!-- Archive / Unarchive -->
		{#if isArchived}
			<ContextMenu.Item onclick={() => onUnarchive(issue.id)}>
				<ArchiveRestoreIcon class="size-4" />
				Unarchive
			</ContextMenu.Item>
		{:else}
			<ContextMenu.Item onclick={() => onArchive(issue)}>
				<ArchiveIcon class="size-4" />
				Archive
			</ContextMenu.Item>
		{/if}

		<!-- Delete — destructive -->
		<ContextMenu.Item variant="destructive" onclick={() => onDelete(issue)}>
			<TrashIcon class="size-4" />
			Delete
		</ContextMenu.Item>
	</ContextMenu.Content>
</ContextMenu.Root>
