<script lang="ts">
	import type { Issue, IssuePriority } from '$lib/modules/issues';
	import { PRIORITY_OPTIONS } from '$lib/components/issue_card_utils.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import Checkbox from '$lib/components/ui/checkbox/Checkbox.svelte';
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
		selectAllCheckboxState: 'all' | 'some' | 'none';
		onSelectAll: () => void;
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
		selectAllCheckboxState,
		onSelectAll,
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

	const checkboxChecked = $derived(selectAllCheckboxState === 'all');
	const checkboxIndeterminate = $derived(selectAllCheckboxState === 'some');

	let priorityPopoverOpen = $state(false);

	function handleCheckboxClick() {
		if (selectAllCheckboxState === 'all') {
			onDeselectAll();
		} else {
			onSelectAll();
		}
	}

	function handlePrioritySelect(priority: IssuePriority | null) {
		priorityPopoverOpen = false;
		onBatchChangePriority(priority);
	}
</script>

<Tooltip.Provider>
	<div
		class="flex items-center gap-3 rounded-[var(--radius-md)] border px-[14px] py-2 text-[13px] font-medium"
		style="background: color-mix(in oklch, var(--primary) 10%, var(--surface)); border-color: color-mix(in oklch, var(--primary) 30%, var(--border));"
	>
		<!-- Select-all checkbox -->
		<Checkbox
			checked={checkboxChecked}
			indeterminate={checkboxIndeterminate}
			onclick={handleCheckboxClick}
			aria-label="Select all issues"
		/>

		<!-- Count badge + label -->
		<div class="flex items-center gap-2">
			<span class="rounded bg-primary px-2 py-0.5 font-mono text-xs text-primary-foreground">
				{selectedCount}
			</span>
			<span class="text-foreground-muted">
				{selectedCount === 1 ? 'issue selected' : 'issues selected'}
			</span>
		</div>

		<!-- Spacer -->
		<div class="flex-1"></div>

		<!-- Action buttons -->
		<div class="flex items-center gap-1.5">
			<!-- Archive -->
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

			<!-- Unarchive -->
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

			<!-- Delete -->
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

			<!-- Change Priority -->
			<Popover.Root bind:open={priorityPopoverOpen}>
				<Popover.Trigger>
					{#snippet child({ props })}
						<Button {...props} variant="ghost" size="sm" aria-label="Change priority">
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

			<!-- Prune worktrees -->
			{#if hasActiveWorktrees}
				<Tooltip.Root>
					<Tooltip.Trigger>
						{#snippet child({ props })}
							<Button
								{...props}
								variant="ghost"
								size="sm"
								onclick={onBatchPrune}
								disabled={!hasActiveWorktrees}
								aria-label="Prune worktrees"
							>
								<ScissorsIcon />
								Prune worktrees
							</Button>
						{/snippet}
					</Tooltip.Trigger>
					<Tooltip.Content>Remove active worktrees for selected issues</Tooltip.Content>
				</Tooltip.Root>
			{/if}

			<!-- Deselect all -->
			<Button
				variant="ghost"
				size="icon-sm"
				onclick={onDeselectAll}
				aria-label="Deselect all"
			>
				<XIcon />
			</Button>
		</div>
	</div>
</Tooltip.Provider>
