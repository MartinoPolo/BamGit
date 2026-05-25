import { createContext } from 'svelte';
import { StateRaw } from '$lib/reactivity/state.svelte.js';
import { Persisted, jsonSerde } from '$lib/reactivity/persisted.svelte.js';
import { useSettings } from '$lib/modules/settings';
import {
	isOverviewSortMode,
	isOverviewSortDirection,
	isOverviewFilterMode,
	isOverviewFooterContent,
	OVERVIEW_SORT_DEFAULT,
	OVERVIEW_SORT_DIRECTION_DEFAULT,
	OVERVIEW_FILTER_DEFAULT,
	OVERVIEW_FOOTER_CONTENT_DEFAULT,
	type OverviewSortMode,
	type OverviewSortDirection,
	type OverviewFilterMode,
	type OverviewFooterContent,
} from './overview_toolbar_types.js';

type OverviewToolbarContext = ReturnType<typeof createOverviewToolbarContext>;

const [useOverviewToolbar, setOverviewToolbarInternal] = createContext<OverviewToolbarContext>();
export { useOverviewToolbar };

export function setOverviewToolbarContext() {
	const ctx = createOverviewToolbarContext();
	setOverviewToolbarInternal(ctx);
	return ctx;
}

function createOverviewToolbarContext() {
	const settingsCtx = useSettings();

	const searchQuery = new StateRaw('');

	const sortMode = new Persisted<OverviewSortMode>({
		key: 'overview.sort',
		serde: jsonSerde(isOverviewSortMode),
		defaultValue: OVERVIEW_SORT_DEFAULT,
	});

	const sortDirection = new Persisted<OverviewSortDirection>({
		key: 'overview.sort_direction',
		serde: jsonSerde(isOverviewSortDirection),
		defaultValue: OVERVIEW_SORT_DIRECTION_DEFAULT,
	});

	const filterMode = new Persisted<OverviewFilterMode>({
		key: 'overview.filter',
		serde: jsonSerde(isOverviewFilterMode),
		defaultValue: OVERVIEW_FILTER_DEFAULT,
	});

	const showArchived = new StateRaw(false);

	const footerContent = {
		get current(): OverviewFooterContent {
			const raw = settingsCtx.get('overviewFooterContent');
			return isOverviewFooterContent(raw) ? raw : OVERVIEW_FOOTER_CONTENT_DEFAULT;
		},
		set current(value: OverviewFooterContent) {
			void settingsCtx.set('overviewFooterContent', value);
		},
	};

	const isNonDefaultSort = $derived(
		sortMode.current !== OVERVIEW_SORT_DEFAULT ||
			sortDirection.current !== OVERVIEW_SORT_DIRECTION_DEFAULT,
	);
	const isNonDefaultFilter = $derived(filterMode.current !== OVERVIEW_FILTER_DEFAULT);
	const isNonDefaultFooter = $derived(footerContent.current !== OVERVIEW_FOOTER_CONTENT_DEFAULT);

	return {
		searchQuery,
		sortMode,
		sortDirection,
		filterMode,
		showArchived,
		footerContent,
		get isNonDefaultSort() {
			return isNonDefaultSort;
		},
		get isNonDefaultFilter() {
			return isNonDefaultFilter;
		},
		get isNonDefaultFooter() {
			return isNonDefaultFooter;
		},
	};
}
