import { onMount, untrack } from 'svelte';
import { pushState } from '$app/navigation';
import { resolve } from '$app/paths';
import { page } from '$app/state';
import { parseSelectionFromUrl, selectionMatchesUrl, buildSelectionUrl } from './url_state.js';
import { isBottomPanelTab } from './selection.js';
import type { UrlSelectionState } from './url_state.js';
import type { BottomPanelTab } from './selection.js';

const WORKSPACE_ROUTE_ID = '/';

interface SelectionSyncTarget {
	readonly activeIssueId: string | null;
	readonly activeTab: BottomPanelTab | null;
	restoreFromUrl: (issueId: string | null, tab: BottomPanelTab | null) => void;
}

export function initUrlStateSync(selection: SelectionSyncTarget): void {
	let isRestoring = false;
	let initialized = false;
	let lastPushedState: UrlSelectionState | null = null;

	function pushSelectionToUrl(issueId: string | null, tab: BottomPanelTab | null) {
		if (isRestoring || !initialized) {
			return;
		}

		if (page.route.id !== WORKSPACE_ROUTE_ID) {
			return;
		}

		const state: UrlSelectionState = { issueId, tab };

		if (
			lastPushedState &&
			lastPushedState.issueId === state.issueId &&
			lastPushedState.tab === state.tab
		) {
			return;
		}

		if (selectionMatchesUrl(state, page.url)) {
			return;
		}

		lastPushedState = state;
		const newUrl = buildSelectionUrl(page.url, state);
		// eslint-disable-next-line svelte/no-navigation-without-resolve -- URL built with resolve() + dynamic search params
		pushState(resolve(WORKSPACE_ROUTE_ID) + newUrl.search, {
			activeIssueId: state.issueId,
			activeTab: state.tab,
		});
	}

	// Push selection changes to URL
	$effect(() => {
		const issueId = selection.activeIssueId;
		const tab = selection.activeTab;
		untrack(() => pushSelectionToUrl(issueId, tab));
	});

	// Restore selection from page.state on back/forward (shallow routing popstate)
	$effect(() => {
		const pageState = page.state as App.PageState;
		untrack(() => {
			if (!initialized || isRestoring) {
				return;
			}

			if (page.route.id !== WORKSPACE_ROUTE_ID) {
				return;
			}

			const issueId =
				typeof pageState.activeIssueId === 'string' ? pageState.activeIssueId : null;
			const tab = isBottomPanelTab(pageState.activeTab) ? pageState.activeTab : null;

			if (
				lastPushedState &&
				lastPushedState.issueId === issueId &&
				lastPushedState.tab === tab
			) {
				return;
			}

			isRestoring = true;
			try {
				selection.restoreFromUrl(issueId, tab);
				lastPushedState = { issueId, tab };
			} finally {
				isRestoring = false;
			}
		});
	});

	onMount(() => {
		if (page.route.id === WORKSPACE_ROUTE_ID) {
			isRestoring = true;
			try {
				const parsed = parseSelectionFromUrl(page.url);
				selection.restoreFromUrl(parsed.issueId, parsed.tab);
				lastPushedState = parsed;
			} finally {
				isRestoring = false;
			}
		}
		initialized = true;
	});
}
