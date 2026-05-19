<script lang="ts">
	import type { Snippet } from 'svelte';
	import * as ContextMenu from '$lib/components/shadcn/context-menu/index.js';
	import type { Issue, IssueCardCallbacks } from '$lib/modules/issues';
	import {
		ACTION_POOL,
		type DerivedActions,
		type ActionId,
	} from '$lib/modules/contextual-actions';
	import { PRIORITY_OPTIONS } from '$lib/components/blocks/issue/issue_card_utils.js';
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
	import ZapIcon from '@lucide/svelte/icons/zap';
	import CommandSubmenu from './CommandSubmenu.svelte';

	// fallow-ignore-next-line code-duplication
	interface Props extends IssueCardCallbacks {
		issue: Issue;
		isBatchSelected: boolean;
		derivedActions?: DerivedActions | null;
		onToggleSelect: () => void;
		onContextualAction?: (actionId: ActionId) => void;
		children: Snippet;
	}

	let {
		issue,
		isBatchSelected,
		derivedActions = null,
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
		onContextualAction,
		children,
	}: Props = $props();

	const allContextualActions = $derived.by(() => {
		if (!derivedActions) {
			return [];
		}
		const actions: { id: ActionId; disabled: boolean }[] = [];
		if (derivedActions.primary) {
			actions.push({ id: derivedActions.primary, disabled: false });
		}
		if (derivedActions.secondary) {
			actions.push({ id: derivedActions.secondary, disabled: false });
		}
		for (const id of derivedActions.overflow) {
			actions.push({ id, disabled: false });
		}
		for (const id of derivedActions.disabled) {
			if (!actions.some((a) => a.id === id)) {
				actions.push({ id, disabled: true });
			}
		}
		return actions;
	});

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

		<!-- Contextual Actions -->
		{#if allContextualActions.length > 0 && onContextualAction}
			<ContextMenu.Separator />
			<ContextMenu.Sub>
				<ContextMenu.SubTrigger>
					<ZapIcon class="size-4" />
					Actions
				</ContextMenu.SubTrigger>
				<ContextMenu.Portal>
					<ContextMenu.SubContent>
						{#each allContextualActions as action (action.id)}
							<ContextMenu.Item
								disabled={action.disabled}
								onclick={() => onContextualAction!(action.id)}
							>
								{ACTION_POOL[action.id].label}
							</ContextMenu.Item>
						{/each}
					</ContextMenu.SubContent>
				</ContextMenu.Portal>
			</ContextMenu.Sub>
		{/if}

		<!-- Commands submenu -->
		<CommandSubmenu dashboardId={issue.dashboard_id} issueId={issue.id} />

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
			<ContextMenu.Portal>
				<ContextMenu.SubContent>
					{#each PRIORITY_OPTIONS as option (option.value)}
						<ContextMenu.Item onclick={() => onChangePriority(issue.id, option.value)}>
							{#if issue.priority === option.value}
								<CheckIcon class="size-4" />
							{:else}
								<span class="inline-flex size-4 shrink-0"></span>
							{/if}
							{option.label()}
						</ContextMenu.Item>
					{/each}
				</ContextMenu.SubContent>
			</ContextMenu.Portal>
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
