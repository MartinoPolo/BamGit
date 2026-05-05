import { isBottomPanelTab } from './selection.js';
import type { BottomPanelTab } from './selection.js';

// ─── URL Param Names ────────────────────────────────────────────────────

const PARAM_ISSUE = 'issue';
const PARAM_TAB = 'tab';

// ─── Types ──────────────────────────────────────────────────────────────

export interface UrlSelectionState {
	issueId: string | null;
	tab: BottomPanelTab | null;
}

// ─── Serialize ──────────────────────────────────────────────────────────

export function serializeSelectionToParams(state: UrlSelectionState): URLSearchParams {
	const params = new URLSearchParams();
	if (state.issueId !== null) {
		params.set(PARAM_ISSUE, state.issueId);
	}
	if (state.tab !== null) {
		params.set(PARAM_TAB, state.tab);
	}
	return params;
}

// ─── Parse ──────────────────────────────────────────────────────────────

export function parseSelectionFromUrl(url: URL): UrlSelectionState {
	const issueId = url.searchParams.get(PARAM_ISSUE);
	const tabParam = url.searchParams.get(PARAM_TAB);
	const tab = isBottomPanelTab(tabParam) ? tabParam : null;
	return { issueId, tab };
}

// ─── Match Check ────────────────────────────────────────────────────────

export function selectionMatchesUrl(state: UrlSelectionState, url: URL): boolean {
	const current = parseSelectionFromUrl(url);
	return current.issueId === state.issueId && current.tab === state.tab;
}

// ─── Build URL ──────────────────────────────────────────────────────────

export function buildSelectionUrl(baseUrl: URL, state: UrlSelectionState): URL {
	const newUrl = new URL(baseUrl);
	newUrl.search = '';
	const params = serializeSelectionToParams(state);
	const paramString = params.toString();
	if (paramString) {
		newUrl.search = paramString;
	}
	return newUrl;
}
