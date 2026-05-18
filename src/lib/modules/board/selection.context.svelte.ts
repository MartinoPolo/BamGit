import { createContext } from 'svelte';
import { SvelteSet } from 'svelte/reactivity';
import { StateRaw } from '$lib/reactivity/state.svelte.js';
import { computeMergedBatchSelection } from '$lib/components/blocks/issue-card/batch_selection_utils.js';
import { BOTTOM_PANEL_TABS, shouldShowPrdOverview } from './selection.js';
import type { BottomPanelTab } from './selection.js';

type SelectionContext = ReturnType<typeof createSelectionContext>;

const [useSelection, setSelectionInternal] = createContext<SelectionContext>();
export { useSelection };

export function setSelectionContext() {
	const ctx = createSelectionContext();
	setSelectionInternal(ctx);
	return ctx;
}

function createSelectionContext() {
	const activeIssueId = new StateRaw<string | null>(null);
	const hoveredIssueId = new StateRaw<string | null>(null);
	const activeTab = new StateRaw<BottomPanelTab | null>(null);
	const prdIssueId = new StateRaw<string | null>(null);
	const forestCollapsed = new StateRaw(false);
	const batchSelectedIssueIds = new SvelteSet<string>();
	const batchAnchorId = new StateRaw<string | null>(null);
	const individuallySelectedIds = new SvelteSet<string>();
	const rangeSelectedIds = new SvelteSet<string>();
	const modifierHeld = new StateRaw(false);
	const flatVisualOrder = new StateRaw<readonly string[]>([]);

	function hoverIssue(issueId: string) {
		hoveredIssueId.current = issueId;
	}

	function unhover() {
		hoveredIssueId.current = null;
	}

	function setModifierHeld(held: boolean) {
		if (held !== modifierHeld.current) {
			modifierHeld.current = held;
		}
	}

	function setFlatVisualOrder(ids: readonly string[]) {
		flatVisualOrder.current = ids;
	}

	function handleCardClick(issueId: string, event: MouseEvent) {
		if (event.shiftKey) {
			event.preventDefault();
			batchRangeSelect(issueId, flatVisualOrder.current);
			return;
		}
		if (event.ctrlKey || event.metaKey) {
			event.preventDefault();
			toggleBatchSelect(issueId);
			return;
		}
		selectExclusive(issueId);
	}

	function clearBatchSelection() {
		batchSelectedIssueIds.clear();
		individuallySelectedIds.clear();
		rangeSelectedIds.clear();
		batchAnchorId.current = null;
	}

	function activateIssue(issueId: string) {
		activeIssueId.current = issueId;
		activeTab.current = BOTTOM_PANEL_TABS.issueDetail;
	}

	function selectExclusive(issueId: string) {
		if (batchSelectedIssueIds.size === 1 && batchSelectedIssueIds.has(issueId)) {
			clearBatchSelection();
			return;
		}
		clearBatchSelection();
		batchSelectedIssueIds.add(issueId);
		individuallySelectedIds.add(issueId);
		batchAnchorId.current = issueId;
	}

	function deactivate() {
		activeIssueId.current = null;
		activeTab.current = null;
	}

	function restoreFromUrl(issueId: string | null, tab: BottomPanelTab | null) {
		activeIssueId.current = issueId;
		activeTab.current = tab;
		clearBatchSelection();
	}

	function setActiveTab(tab: BottomPanelTab | null) {
		activeTab.current = tab;
		clearBatchSelection();
	}

	function toggleBatchSelect(issueId: string) {
		if (individuallySelectedIds.has(issueId)) {
			individuallySelectedIds.delete(issueId);
			batchSelectedIssueIds.delete(issueId);
		} else {
			individuallySelectedIds.add(issueId);
			batchSelectedIssueIds.add(issueId);
		}
		batchAnchorId.current = issueId;
	}

	function batchRangeSelect(targetId: string, flatOrder: readonly string[]) {
		const { mergedIds, rangeIds } = computeMergedBatchSelection(
			individuallySelectedIds,
			batchAnchorId.current,
			targetId,
			flatOrder,
		);

		rangeSelectedIds.clear();
		for (const id of rangeIds) {
			rangeSelectedIds.add(id);
		}

		batchSelectedIssueIds.clear();
		for (const id of mergedIds) {
			batchSelectedIssueIds.add(id);
		}

		if (batchAnchorId.current === null) {
			batchAnchorId.current = targetId;
		}
	}

	function batchSelectAll(issueIds: readonly string[]) {
		for (const id of issueIds) {
			batchSelectedIssueIds.add(id);
			individuallySelectedIds.add(id);
		}
	}

	function batchDeselectAll() {
		clearBatchSelection();
	}

	function removeBatchItems(ids: readonly string[]) {
		for (const id of ids) {
			batchSelectedIssueIds.delete(id);
			individuallySelectedIds.delete(id);
			rangeSelectedIds.delete(id);
		}
	}

	function setPrdIssueId(id: string | null) {
		prdIssueId.current = id;
	}

	function toggleForestCollapsed() {
		forestCollapsed.current = !forestCollapsed.current;
	}

	return {
		get hoveredIssueId() {
			return hoveredIssueId.current;
		},
		get activeIssueId() {
			return activeIssueId.current;
		},
		get activeTab() {
			return activeTab.current;
		},
		get prdIssueId() {
			return prdIssueId.current;
		},
		get showPrdOverview() {
			return shouldShowPrdOverview(activeIssueId.current, prdIssueId.current);
		},
		get forestCollapsed() {
			return forestCollapsed.current;
		},
		batchSelectedIssueIds: batchSelectedIssueIds as ReadonlySet<string>,
		get batchCount() {
			return batchSelectedIssueIds.size;
		},
		get batchAnchorId() {
			return batchAnchorId.current;
		},
		get isModifierHeld() {
			return modifierHeld.current;
		},
		hoverIssue,
		unhover,
		setModifierHeld,
		setFlatVisualOrder,
		handleCardClick,
		activateIssue,
		deactivate,
		restoreFromUrl,
		setActiveTab,
		setPrdIssueId,
		toggleForestCollapsed,
		selectExclusive,
		toggleBatchSelect,
		batchRangeSelect,
		batchSelectAll,
		batchDeselectAll,
		removeBatchItems,
	};
}
