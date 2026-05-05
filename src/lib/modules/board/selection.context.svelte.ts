import { createContext } from 'svelte';
import { SvelteSet } from 'svelte/reactivity';
import { StateRaw } from '$lib/reactivity/state.svelte.js';
import { Persisted, stringSerde } from '$lib/reactivity/persisted.svelte.js';
import { GLOW_COLORS } from '$lib/modules/visualization/constants.js';
import { computeMergedBatchSelection } from '$lib/components/batch_selection_utils.js';
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

function isHexColor(value: unknown): value is string {
	return typeof value === 'string' && /^#[0-9a-fA-F]{6}$/.test(value);
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

	const hoverGlowColor = new Persisted<string>({
		key: 'grovekeeper_hover_glow_color',
		serde: stringSerde(isHexColor),
		defaultValue: GLOW_COLORS.yellow,
	});

	const activeGlowColor = new Persisted<string>({
		key: 'grovekeeper_active_glow_color',
		serde: stringSerde(isHexColor),
		defaultValue: GLOW_COLORS.green,
	});

	function hoverIssue(issueId: string) {
		hoveredIssueId.current = issueId;
	}

	function unhover() {
		hoveredIssueId.current = null;
	}

	function activateIssue(issueId: string) {
		if (activeIssueId.current === issueId) {
			if (activeTab.current !== BOTTOM_PANEL_TABS.issueDetail) {
				activeTab.current = BOTTOM_PANEL_TABS.issueDetail;
			}
			return;
		}
		activeIssueId.current = issueId;
		if (activeTab.current === null && !shouldShowPrdOverview(issueId, prdIssueId.current)) {
			activeTab.current = BOTTOM_PANEL_TABS.issueDetail;
		}
		batchSelectedIssueIds.clear();
		individuallySelectedIds.clear();
		rangeSelectedIds.clear();
		batchAnchorId.current = null;
	}

	function deactivate() {
		activeIssueId.current = null;
		activeTab.current = null;
	}

	function setActiveTab(tab: BottomPanelTab | null) {
		activeTab.current = tab;
		batchSelectedIssueIds.clear();
		individuallySelectedIds.clear();
		rangeSelectedIds.clear();
		batchAnchorId.current = null;
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
		batchSelectedIssueIds.clear();
		individuallySelectedIds.clear();
		rangeSelectedIds.clear();
		batchAnchorId.current = null;
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
		get hoverGlowColor() {
			return hoverGlowColor.current;
		},
		set hoverGlowColor(value: string) {
			hoverGlowColor.current = value;
		},
		get activeGlowColor() {
			return activeGlowColor.current;
		},
		set activeGlowColor(value: string) {
			activeGlowColor.current = value;
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
		hoverIssue,
		unhover,
		activateIssue,
		deactivate,
		setActiveTab,
		setPrdIssueId,
		toggleForestCollapsed,
		toggleBatchSelect,
		batchRangeSelect,
		batchSelectAll,
		batchDeselectAll,
		removeBatchItems,
	};
}
