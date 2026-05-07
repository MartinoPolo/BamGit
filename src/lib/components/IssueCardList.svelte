<script lang="ts">
	import type { Issue } from '$lib/modules/issues';
	import type { GitStatusCache } from '$lib/types/generated';
	import type { IssueCardCallbacks, IssuePriority } from '$lib/modules/issues';
	import type { TreeVisualization } from '$lib/modules/visualization';
	import { SPECIAL_LABELS } from '$lib/modules/visualization/constants.js';
	import {
		deriveContextualActions,
		type ContextualActionInput,
	} from '$lib/modules/contextual-actions';
	import { useSelection } from '$lib/modules/board';
	import IssueCard from './IssueCard.svelte';
	import IssueCardContextMenu from './IssueCardContextMenu.svelte';
	import BatchActionToolbar from './BatchActionToolbar.svelte';

	// fallow-ignore-next-line code-duplication
	interface Props extends IssueCardCallbacks {
		parentIssues: Issue[];
		archivedIssues: Issue[];
		showArchived: boolean;
		isPortfolio: boolean;
		cacheMap?: Map<string, GitStatusCache>;
		ghAvailable?: boolean;
		prioritiesEnabled?: boolean;
		getChildren: (parentId: string) => Issue[];
		getNotificationDotColor?: (issueId: string) => string | null;
		getVisualization?: (issueId: string) => TreeVisualization | undefined;
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
		cacheMap = new Map(),
		ghAvailable = false,
		prioritiesEnabled = true,
		getChildren,
		getNotificationDotColor,
		getVisualization,
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

	let isModifierHeld = $state(false);

	function updateModifierState(event: MouseEvent | KeyboardEvent) {
		isModifierHeld = event.ctrlKey || event.metaKey || event.shiftKey;
	}

	function handleCardClick(issue: Issue, event: MouseEvent) {
		if (event.shiftKey) {
			event.preventDefault();
			selection.batchRangeSelect(issue.id, flatIssueIds);
			return;
		}
		if (event.ctrlKey || event.metaKey) {
			event.preventDefault();
			selection.toggleBatchSelect(issue.id);
			return;
		}
		selection.selectExclusive(issue.id);
	}

	function handleTitleClick(issue: Issue) {
		selection.activateIssue(issue.id);
	}

	const parentIssueMap = $derived(new Map(parentIssues.map((i) => [i.id, i])));

	function getPrdParent(issue: Issue): { number: number | null; url: string | null } | null {
		if (issue.parent_issue_id === null) {
			return null;
		}
		const parent = parentIssueMap.get(issue.parent_issue_id);
		if (parent === undefined) {
			return null;
		}
		const hasPrdLabel = parent.labels.some((l) => l.name.toLowerCase() === SPECIAL_LABELS.prd);
		if (!hasPrdLabel) {
			return null;
		}
		return { number: parent.github_issue_number, url: parent.github_issue_url };
	}

	// fallow-ignore-next-line complexity
	function handleKeydown(event: KeyboardEvent) {
		if ((event.ctrlKey || event.metaKey) && event.key === 'a') {
			event.preventDefault();
			selection.batchSelectAll(flatIssueIds);
			return;
		}
		updateModifierState(event);
		if (event.key === 'Escape') {
			event.preventDefault();
			selection.batchDeselectAll();
			selection.deactivate();
			return;
		}
	}

	function handleToggleSelect(issueId: string) {
		selection.toggleBatchSelect(issueId);
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

	// fallow-ignore-next-line complexity
	function getDerivedActions(issue: Issue) {
		const cache = cacheMap.get(issue.id);
		const input: ContextualActionInput = {
			worktreeState: issue.worktree_state,
			sessionState: null,
			prState: cache?.pr_state ?? null,
			hasLocalChanges: cache?.has_local_changes ?? false,
			aheadRemoteCount: cache?.ahead_remote_count ?? 0,
			behindBaseCount: cache?.behind_base_count ?? 0,
			mergeConflict: cache?.merge_conflict ?? false,
			labels: issue.labels,
		};
		return deriveContextualActions(input);
	}
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
	onkeydown={handleKeydown}
	onkeyup={updateModifierState}
	onpointermove={updateModifierState}
	tabindex="-1"
	class="outline-none"
>
	<!-- Persistent toolbar -->
	<div class="mb-3">
		<BatchActionToolbar
			selectedCount={selection.batchCount}
			{selectedIssues}
			onDeselectAll={handleDeselectAll}
			onBatchArchive={handleBatchArchive}
			onBatchUnarchive={handleBatchUnarchive}
			onBatchDelete={handleBatchDelete}
			onBatchChangePriority={handleBatchChangePriority}
			onBatchPrune={handleBatchPrune}
		/>
	</div>

	<!-- Responsive grid -->
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div
		class="grid gap-2"
		style="grid-template-columns: repeat(auto-fill, minmax(450px, 1fr));"
		onclick={(event) => {
			if (event.target === event.currentTarget) {
				selection.deactivate();
				selection.batchDeselectAll();
			}
		}}
	>
		{#each flatVisualOrder as issue (issue.id)}
			<div
				style:content-visibility="auto"
				style:contain-intrinsic-size="auto 450px auto 180px"
			>
				<IssueCardContextMenu
					{issue}
					isBatchSelected={selection.batchSelectedIssueIds.has(issue.id)}
					derivedActions={getDerivedActions(issue)}
					onToggleSelect={() => handleToggleSelect(issue.id)}
					onContextualAction={(actionId) => onExecuteAction?.(actionId, issue.id)}
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
						cache={cacheMap.get(issue.id)}
						{ghAvailable}
						notificationDotColor={getNotificationDotColor?.(issue.id) ?? null}
						childCount={getChildCount(issue.id)}
						prdParent={getPrdParent(issue)}
						{prioritiesEnabled}
						visualization={getVisualization?.(issue.id)}
						isActive={selection.activeIssueId === issue.id}
						isHovered={selection.hoveredIssueId === issue.id}
						isBatchSelected={selection.batchSelectedIssueIds.has(issue.id)}
						{isModifierHeld}
						onCardClick={(event) => handleCardClick(issue, event)}
						onTitleClick={() => handleTitleClick(issue)}
						onMouseEnter={() => selection.hoverIssue(issue.id)}
						onMouseLeave={() => selection.unhover()}
						{onExecuteAction}
					/>
				</IssueCardContextMenu>
			</div>
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
			<div
				class="grid gap-2"
				style="grid-template-columns: repeat(auto-fill, minmax(450px, 1fr));"
			>
				{#each archivedIssues as issue (issue.id)}
					<div
						style:content-visibility="auto"
						style:contain-intrinsic-size="auto 450px auto 180px"
					>
						<IssueCardContextMenu
							{issue}
							isBatchSelected={selection.batchSelectedIssueIds.has(issue.id)}
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
								prdParent={getPrdParent(issue)}
								visualization={getVisualization?.(issue.id)}
								isActive={selection.activeIssueId === issue.id}
								isHovered={selection.hoveredIssueId === issue.id}
								isBatchSelected={selection.batchSelectedIssueIds.has(issue.id)}
								onCardClick={(event) => handleCardClick(issue, event)}
								onTitleClick={() => handleTitleClick(issue)}
								onMouseEnter={() => selection.hoverIssue(issue.id)}
								onMouseLeave={() => selection.unhover()}
							/>
						</IssueCardContextMenu>
					</div>
				{/each}
			</div>
		</div>
	{/if}
</div>
