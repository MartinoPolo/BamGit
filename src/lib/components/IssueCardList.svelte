<script lang="ts">
	import type { Issue } from '$lib/modules/issues';
	import type { Action, GitStatusCache } from '$lib/types/generated';
	import type { IssueCardCallbacks, IssuePriority } from '$lib/modules/issues';
	import { useSelection } from '$lib/modules/board';
	import IssueCard from './IssueCard.svelte';
	import IssueCardContextMenu from './IssueCardContextMenu.svelte';
	import BatchActionToolbar from './BatchActionToolbar.svelte';
	import { computeSelectAllCheckboxState } from './batch_selection_utils.js';

	// fallow-ignore-next-line code-duplication
	interface Props extends IssueCardCallbacks {
		parentIssues: Issue[];
		archivedIssues: Issue[];
		showArchived: boolean;
		isPortfolio: boolean;
		actions?: Action[];
		forceExpanded?: boolean;
		cacheMap?: Map<string, GitStatusCache>;
		ghAvailable?: boolean;
		prioritiesEnabled?: boolean;
		paletteColors?: string[];
		usedColors?: string[];
		isDarkMode?: boolean;
		getChildren: (parentId: string) => Issue[];
		getNotificationDotColor?: (issueId: string) => string | null;
		getProgressLines?: (issueId: string) => readonly string[];
		onBatchArchive?: (issueIds: string[]) => void;
		onBatchUnarchive?: (issueIds: string[]) => void;
		onBatchDelete?: (issueIds: string[]) => void;
		onBatchChangePriority?: (issueIds: string[], priority: IssuePriority | null) => void;
		onBatchPrune?: (issueIds: string[]) => void;
	}

	let {
		parentIssues,
		archivedIssues,
		showArchived,
		isPortfolio,
		actions = [],
		forceExpanded,
		cacheMap = new Map(),
		ghAvailable = false,
		prioritiesEnabled = true,
		paletteColors = [],
		usedColors = [],
		isDarkMode = false,
		getChildren,
		getNotificationDotColor,
		getProgressLines,
		onArchive,
		onUnarchive,
		onEdit,
		onDelete,
		onChangePriority,
		onRename,
		onSetupWorktree,
		onRemoveWorktree,
		onExecuteAction,
		onChangeColor,
		onBatchArchive,
		onBatchUnarchive,
		onBatchDelete,
		onBatchChangePriority,
		onBatchPrune,
	}: Props = $props();

	const selection = useSelection();

	const flatVisualOrder = $derived.by(() => {
		const order: Issue[] = [];
		for (const parent of parentIssues) {
			order.push(parent);
			if (isPortfolio) {
				const children = getChildren(parent.id);
				for (const child of children) {
					order.push(child);
				}
			}
		}
		return order;
	});

	const flatIssueIds = $derived(flatVisualOrder.map((issue) => issue.id));

	const selectedIssues = $derived(
		flatVisualOrder.filter((issue) => selection.batchSelectedIssueIds.has(issue.id)),
	);

	const selectAllState = $derived(
		computeSelectAllCheckboxState(selection.batchCount, flatVisualOrder.length),
	);

	let isModifierHeld = $state(false);

	function handleCardClick(issue: Issue, event: MouseEvent) {
		if (event.ctrlKey || event.metaKey) {
			event.preventDefault();
			selection.toggleBatchSelect(issue.id);
			return;
		}
		if (event.shiftKey) {
			event.preventDefault();
			selection.batchRangeSelect(issue.id, flatIssueIds);
			return;
		}
		selection.selectIssue(issue.id);
	}

	// fallow-ignore-next-line complexity
	function handleKeydown(event: KeyboardEvent) {
		if ((event.ctrlKey || event.metaKey) && event.key === 'a') {
			event.preventDefault();
			selection.batchSelectAll(flatIssueIds);
			return;
		}
		if (event.key === 'Escape') {
			event.preventDefault();
			selection.batchDeselectAll();
			return;
		}
		if (event.key === 'Control' || event.key === 'Meta' || event.key === 'Shift') {
			isModifierHeld = true;
		}
	}

	function handleKeyup(event: KeyboardEvent) {
		if (event.key === 'Control' || event.key === 'Meta' || event.key === 'Shift') {
			isModifierHeld = false;
		}
	}

	function handleToggleSelect(issueId: string) {
		selection.toggleBatchSelect(issueId);
	}

	function handleSelectAll() {
		selection.batchSelectAll(flatIssueIds);
	}

	function handleDeselectAll() {
		selection.batchDeselectAll();
	}

	function handleBatchArchive() {
		const ids = selectedIssues
			.filter((issue) => issue.status === 'active')
			.map((issue) => issue.id);
		if (onBatchArchive) {
			onBatchArchive(ids);
		} else {
			for (const issue of selectedIssues.filter((i) => i.status === 'active')) {
				onArchive(issue);
			}
		}
		selection.removeBatchItems(ids);
	}

	function handleBatchUnarchive() {
		const ids = selectedIssues
			.filter((issue) => issue.status === 'archived')
			.map((issue) => issue.id);
		if (onBatchUnarchive) {
			onBatchUnarchive(ids);
		} else {
			for (const id of ids) {
				onUnarchive(id);
			}
		}
	}

	function handleBatchDelete() {
		const ids = selectedIssues.map((issue) => issue.id);
		if (onBatchDelete) {
			onBatchDelete(ids);
		} else {
			for (const issue of selectedIssues) {
				onDelete(issue);
			}
		}
		selection.removeBatchItems(ids);
	}

	function handleBatchChangePriority(priority: IssuePriority | null) {
		const ids = selectedIssues.map((issue) => issue.id);
		if (onBatchChangePriority) {
			onBatchChangePriority(ids, priority);
		} else {
			for (const id of ids) {
				onChangePriority(id, priority);
			}
		}
	}

	function handleBatchPrune() {
		const ids = selectedIssues
			.filter((issue) => issue.worktree_state === 'active')
			.map((issue) => issue.id);
		if (onBatchPrune) {
			onBatchPrune(ids);
		}
	}

	function getChildCount(issueId: string): number {
		if (!isPortfolio) {
			return 0;
		}
		return getChildren(issueId).length;
	}
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div onkeydown={handleKeydown} onkeyup={handleKeyup} tabindex="-1" class="outline-none">
	<!-- Batch action toolbar -->
	{#if selection.batchCount > 0}
		<div class="mb-3">
			<BatchActionToolbar
				selectedCount={selection.batchCount}
				{selectedIssues}
				selectAllCheckboxState={selectAllState}
				onSelectAll={handleSelectAll}
				onDeselectAll={handleDeselectAll}
				onBatchArchive={handleBatchArchive}
				onBatchUnarchive={handleBatchUnarchive}
				onBatchDelete={handleBatchDelete}
				onBatchChangePriority={handleBatchChangePriority}
				onBatchPrune={handleBatchPrune}
			/>
		</div>
	{/if}

	<!-- Two-column grid -->
	<div class="grid grid-cols-2 gap-2">
		{#each flatVisualOrder as issue (issue.id)}
			<IssueCardContextMenu
				{issue}
				isBatchSelected={selection.batchSelectedIssueIds.has(issue.id)}
				{paletteColors}
				{usedColors}
				{isDarkMode}
				onToggleSelect={() => handleToggleSelect(issue.id)}
				{onArchive}
				{onUnarchive}
				{onEdit}
				{onDelete}
				{onChangePriority}
				{onRename}
				{onSetupWorktree}
				{onRemoveWorktree}
				{onChangeColor}
			>
				<IssueCard
					{issue}
					{actions}
					cache={cacheMap.get(issue.id)}
					{ghAvailable}
					notificationDotColor={getNotificationDotColor?.(issue.id) ?? null}
					childCount={getChildCount(issue.id)}
					{forceExpanded}
					progressLines={getProgressLines?.(issue.id) ?? []}
					{prioritiesEnabled}
					isActive={selection.selectedIssueId === issue.id}
					isBatchSelected={selection.batchSelectedIssueIds.has(issue.id)}
					isSelectionReady={isModifierHeld &&
						!selection.batchSelectedIssueIds.has(issue.id)}
					onCardClick={(event) => handleCardClick(issue, event)}
					{onExecuteAction}
				/>
			</IssueCardContextMenu>
		{/each}
	</div>

	<!-- Archived issues section -->
	{#if showArchived && archivedIssues.length > 0}
		<div class="mt-4 border-t border-border pt-4">
			<h3
				class="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground/60"
			>
				Archived ({archivedIssues.length})
			</h3>
			<div class="grid grid-cols-2 gap-2">
				{#each archivedIssues as issue (issue.id)}
					<IssueCardContextMenu
						{issue}
						isBatchSelected={selection.batchSelectedIssueIds.has(issue.id)}
						{paletteColors}
						{usedColors}
						{isDarkMode}
						onToggleSelect={() => handleToggleSelect(issue.id)}
						{onArchive}
						{onUnarchive}
						{onEdit}
						{onDelete}
						{onChangePriority}
					>
						<IssueCard
							{issue}
							cache={cacheMap.get(issue.id)}
							{ghAvailable}
							isActive={selection.selectedIssueId === issue.id}
							isBatchSelected={selection.batchSelectedIssueIds.has(issue.id)}
							onCardClick={(event) => handleCardClick(issue, event)}
						/>
					</IssueCardContextMenu>
				{/each}
			</div>
		</div>
	{/if}
</div>
