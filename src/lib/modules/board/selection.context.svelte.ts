import { createContext } from 'svelte';
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
	}

	function deselect() {
		selectedIssueId.current = null;
		activeTab.current = null;
	}

	function setActiveTab(tab: BottomPanelTab | null) {
		activeTab.current = tab;
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
		hoverIssue,
		unhover,
		selectIssue,
		deselect,
		setActiveTab,
		setPrdIssueId,
		toggleForestCollapsed,
	};
}
