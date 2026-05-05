import { createContext } from 'svelte';
import { SvelteSet } from 'svelte/reactivity';
import { StateRaw } from '$lib/reactivity/state.svelte.js';
import { Persisted, stringSerde } from '$lib/reactivity/persisted.svelte.js';
import { GLOW_COLORS } from '$lib/modules/visualization/constants.js';
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
	const selectedIssueId = new StateRaw<string | null>(null);
	const hoveredIssueId = new StateRaw<string | null>(null);
	const activeTab = new StateRaw<BottomPanelTab | null>(null);
	const prdIssueId = new StateRaw<string | null>(null);
	const forestCollapsed = new StateRaw(false);
	const batchSelectedIssueIds = new SvelteSet<string>();
	const batchAnchorId = new StateRaw<string | null>(null);

	const hoverGlowColor = new Persisted<string>({
		key: 'grovekeeper_hover_glow_color',
		serde: stringSerde(isHexColor),
		defaultValue: GLOW_COLORS.yellow,
	});

	const selectedGlowColor = new Persisted<string>({
		key: 'grovekeeper_selected_glow_color',
		serde: stringSerde(isHexColor),
		defaultValue: GLOW_COLORS.blue,
	});

	function hoverIssue(issueId: string) {
		hoveredIssueId.current = issueId;
	}

	function unhover() {
		hoveredIssueId.current = null;
	}

	function selectIssue(issueId: string) {
		if (selectedIssueId.current === issueId) {
			selectedIssueId.current = null;
			activeTab.current = null;
		} else {
			selectedIssueId.current = issueId;
			if (activeTab.current === null && !shouldShowPrdOverview(issueId, prdIssueId.current)) {
				activeTab.current = BOTTOM_PANEL_TABS.issueDetail;
			}
		}
		batchSelectedIssueIds.clear();
		batchAnchorId.current = null;
	}

	function deselect() {
		selectedIssueId.current = null;
		activeTab.current = null;
	}

	function setActiveTab(tab: BottomPanelTab | null) {
		activeTab.current = tab;
		batchSelectedIssueIds.clear();
		batchAnchorId.current = null;
	}

	function toggleBatchSelect(issueId: string) {
		if (batchSelectedIssueIds.has(issueId)) {
			batchSelectedIssueIds.delete(issueId);
		} else {
			batchSelectedIssueIds.add(issueId);
		}
		batchAnchorId.current = issueId;
	}

	function batchRangeSelect(targetId: string, flatOrder: readonly string[]) {
		const anchorId = batchAnchorId.current;
		if (anchorId === null) {
			batchSelectedIssueIds.add(targetId);
			batchAnchorId.current = targetId;
			return;
		}
		const anchorIndex = flatOrder.indexOf(anchorId);
		const targetIndex = flatOrder.indexOf(targetId);
		if (anchorIndex === -1 || targetIndex === -1) {
			batchSelectedIssueIds.add(targetId);
			return;
		}
		const startIndex = Math.min(anchorIndex, targetIndex);
		const endIndex = Math.max(anchorIndex, targetIndex);
		for (let i = startIndex; i <= endIndex; i++) {
			batchSelectedIssueIds.add(flatOrder[i]);
		}
	}

	function batchSelectAll(issueIds: readonly string[]) {
		for (const id of issueIds) {
			batchSelectedIssueIds.add(id);
		}
	}

	function batchDeselectAll() {
		batchSelectedIssueIds.clear();
		batchAnchorId.current = null;
	}

	function removeBatchItems(ids: readonly string[]) {
		for (const id of ids) {
			batchSelectedIssueIds.delete(id);
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
		get selectedIssueId() {
			return selectedIssueId.current;
		},
		get activeTab() {
			return activeTab.current;
		},
		get prdIssueId() {
			return prdIssueId.current;
		},
		get showPrdOverview() {
			return shouldShowPrdOverview(selectedIssueId.current, prdIssueId.current);
		},
		get hoverGlowColor() {
			return hoverGlowColor.current;
		},
		set hoverGlowColor(value: string) {
			hoverGlowColor.current = value;
		},
		get selectedGlowColor() {
			return selectedGlowColor.current;
		},
		set selectedGlowColor(value: string) {
			selectedGlowColor.current = value;
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
		selectIssue,
		deselect,
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
