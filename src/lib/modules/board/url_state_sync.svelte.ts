import { onMount } from 'svelte';
import { pushState, afterNavigate } from '$app/navigation';
import { resolve } from '$app/paths';
import { page } from '$app/state';
import { parseSelectionFromUrl, selectionMatchesUrl, buildSelectionUrl } from './url_state.js';
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

	function pushSelectionToUrl(issueId: string | null, tab: BottomPanelTab | null) {
		if (isRestoring || !initialized) {
			return;
		}

		if (page.route.id !== WORKSPACE_ROUTE_ID) {
			return;
		}

		const state: UrlSelectionState = { issueId, tab };

		if (selectionMatchesUrl(state, page.url)) {
			return;
		}

		const newUrl = buildSelectionUrl(page.url, state);
		// eslint-disable-next-line svelte/no-navigation-without-resolve -- URL built with resolve() + dynamic search params
		pushState(resolve(WORKSPACE_ROUTE_ID) + newUrl.search, {
			activeIssueId: state.issueId,
			activeTab: state.tab,
		});
	}

	function restoreFromUrlState(url: URL) {
		isRestoring = true;
		try {
			const parsed = parseSelectionFromUrl(url);
			selection.restoreFromUrl(parsed.issueId, parsed.tab);
		} finally {
			isRestoring = false;
		}
	}

	$effect(() => {
		pushSelectionToUrl(selection.activeIssueId, selection.activeTab);
	});

	onMount(() => {
		if (page.route.id === WORKSPACE_ROUTE_ID) {
			restoreFromUrlState(page.url);
		}
		initialized = true;
	});

	afterNavigate((navigation) => {
		if (navigation.type === 'popstate' && navigation.to?.route?.id === WORKSPACE_ROUTE_ID) {
			restoreFromUrlState(navigation.to.url);
		}
	});
}
