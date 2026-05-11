<script lang="ts">
	import type { Issue, IssuePriority } from '$lib/modules/issues';
	import { PRIORITY_OPTIONS } from '$lib/components/blocks/issue/issue_card_utils.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Popover from '$lib/components/ui/popover/index.js';
	import * as Tooltip from '$lib/components/ui/tooltip/index.js';
	import ArchiveIcon from '@lucide/svelte/icons/archive';
	import ArchiveRestoreIcon from '@lucide/svelte/icons/archive-restore';
	import Trash2Icon from '@lucide/svelte/icons/trash-2';
	import ScissorsIcon from '@lucide/svelte/icons/scissors';
	import ChevronDownIcon from '@lucide/svelte/icons/chevron-down';
	import XIcon from '@lucide/svelte/icons/x';

	interface Props {
		selectedCount: number;
		selectedIssues: Issue[];
		onDeselectAll: () => void;
		onBatchArchive: () => void;
		onBatchUnarchive: () => void;
		onBatchDelete: () => void;
		onBatchChangePriority: (priority: IssuePriority | null) => void;
		onBatchPrune: () => void;
	}

	let {
		selectedCount,
		selectedIssues,
		onDeselectAll,
		onBatchArchive,
		onBatchUnarchive,
		onBatchDelete,
		onBatchChangePriority,
		onBatchPrune,
	}: Props = $props();

	const hasActiveIssues = $derived(selectedIssues.some((i) => i.status === 'active'));
	const hasArchivedIssues = $derived(selectedIssues.some((i) => i.status === 'archived'));
	const hasActiveWorktrees = $derived(selectedIssues.some((i) => i.worktree_state === 'active'));
	const hasBatchSelection = $derived(selectedCount > 0);

	const toolbarBackground = $derived.by(() => {
		if (hasBatchSelection) {
			return 'color-mix(in oklch, var(--primary) 10%, var(--surface))';
		}
		return 'transparent';
	});

	const toolbarBorderColor = $derived.by(() => {
		if (hasBatchSelection) {
			return 'color-mix(in oklch, var(--primary) 30%, var(--border))';
		}
		return 'transparent';
	});

	let priorityPopoverOpen = $state(false);

	function handlePrioritySelect(priority: IssuePriority | null) {
		priorityPopoverOpen = false;
		onBatchChangePriority(priority);
	}
</script>

<Tooltip.Provider>
	<div
		class="flex min-h-10.5 items-center gap-3 rounded-md border px-3.5 py-2 text-[13px] font-medium"
		style="background: {toolbarBackground}; border-color: {toolbarBorderColor};"
	>
		{#if hasBatchSelection}
			<!-- Count badge + label -->
			<div class="flex items-center gap-2">
				<span
					class="rounded bg-primary px-2 py-0.5 font-mono text-xs text-primary-foreground"
				>
					{selectedCount}
				</span>
				<span class="text-foreground-muted">
					{selectedCount === 1 ? 'issue selected' : 'issues selected'}
				</span>
			</div>

			<!-- Spacer -->
			<div class="flex-1"></div>

			<!-- Batch action buttons -->
			<div class="flex items-center gap-1.5">
				{#if hasActiveIssues}
					<Tooltip.Root>
						<Tooltip.Trigger>
							{#snippet child({ props })}
								<Button
									{...props}
									variant="ghost"
									size="sm"
									onclick={onBatchArchive}
									disabled={!hasActiveIssues}
									aria-label="Archive selected"
								>
									<ArchiveIcon />
									Archive
								</Button>
							{/snippet}
						</Tooltip.Trigger>
						<Tooltip.Content>Archive selected issues</Tooltip.Content>
					</Tooltip.Root>
				{/if}

				{#if hasArchivedIssues}
					<Tooltip.Root>
						<Tooltip.Trigger>
							{#snippet child({ props })}
								<Button
									{...props}
									variant="ghost"
									size="sm"
									onclick={onBatchUnarchive}
									disabled={!hasArchivedIssues}
									aria-label="Unarchive selected"
								>
									<ArchiveRestoreIcon />
									Unarchive
								</Button>
							{/snippet}
						</Tooltip.Trigger>
						<Tooltip.Content>Unarchive selected issues</Tooltip.Content>
					</Tooltip.Root>
				{/if}

				<Tooltip.Root>
					<Tooltip.Trigger>
						{#snippet child({ props })}
							<Button
								{...props}
								variant="danger"
								size="sm"
								onclick={onBatchDelete}
								aria-label="Delete selected"
							>
								<Trash2Icon />
								Delete
							</Button>
						{/snippet}
					</Tooltip.Trigger>
					<Tooltip.Content>Delete selected issues</Tooltip.Content>
				</Tooltip.Root>

				<Popover.Root bind:open={priorityPopoverOpen}>
					<Popover.Trigger>
						{#snippet child({ props })}
							<Button
								{...props}
								variant="ghost"
								size="sm"
								aria-label="Change priority"
							>
								Change Priority
								<ChevronDownIcon />
							</Button>
						{/snippet}
					</Popover.Trigger>
					<Popover.Content class="w-40 p-1" align="end">
						{#each PRIORITY_OPTIONS as option (option.value)}
							<Popover.Item
								onclick={() => handlePrioritySelect(option.value)}
								role="menuitem"
							>
								{option.label()}
							</Popover.Item>
						{/each}
					</Popover.Content>
				</Popover.Root>

				{#if hasActiveWorktrees}
					<Tooltip.Root>
						<Tooltip.Trigger>
							{#snippet child({ props })}
								<Button
									{...props}
									variant="ghost"
									size="icon-sm"
									onclick={onBatchPrune}
									disabled={!hasActiveWorktrees}
									aria-label="Clean selected worktrees"
								>
									<ScissorsIcon />
								</Button>
							{/snippet}
						</Tooltip.Trigger>
						<Tooltip.Content
							>Remove active worktrees for selected issues</Tooltip.Content
						>
					</Tooltip.Root>
				{/if}

				<Button
					variant="ghost"
					size="icon-sm"
					onclick={onDeselectAll}
					aria-label="Deselect all"
				>
					<XIcon />
				</Button>
			</div>
		{:else}
			<!-- Default state: Clean Up Worktrees button only -->
			<div class="flex flex-1 items-center justify-end">
				<Tooltip.Root>
					<Tooltip.Trigger>
						{#snippet child({ props })}
							<Button
								{...props}
								variant="ghost"
								size="icon-sm"
								onclick={onBatchPrune}
								aria-label="Clean up worktrees"
							>
								<ScissorsIcon />
							</Button>
						{/snippet}
					</Tooltip.Trigger>
					<Tooltip.Content>Remove inactive and orphaned worktrees</Tooltip.Content>
				</Tooltip.Root>
			</div>
		{/if}
	</div>
</Tooltip.Provider>
