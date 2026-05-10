import { onMount, untrack } from 'svelte';
import { pushState } from '$app/navigation';
import { resolve } from '$app/paths';
import { page } from '$app/state';
import {
	parseUsageFromUrl,
	usageMatchesUrl,
	urlUsageStateEquals,
	buildUsageUrl,
	type UrlUsageState,
} from './url_state.js';
import {
	isMetricsPeriod,
	isGroupByOption,
	isUsageScope,
	type MetricsPeriod,
	type GroupByOption,
	type UsageScope,
} from './usage_types.js';

const USAGE_ROUTE_ID = '/usage';

interface UsageSyncTarget {
	readonly activePeriod: MetricsPeriod;
	readonly scope: UsageScope;
	readonly groupBy: GroupByOption;
	readonly customDateRange: { start: string; end: string } | null;
	restoreFromUrl: (
		period: MetricsPeriod | null,
		scope: UsageScope | null,
		groupBy: GroupByOption | null,
		customFrom: string | null,
		customTo: string | null,
	) => void;
}

export function initUsageUrlStateSync(target: UsageSyncTarget): void {
	let isRestoring = false;
	let initialized = false;
	let lastPushedState: UrlUsageState | null = null;

	function pushToUrl(
		period: MetricsPeriod,
		scope: UsageScope,
		groupBy: GroupByOption,
		customRange: { start: string; end: string } | null,
	) {
		if (isRestoring || !initialized) {
			return;
		}

		if (page.route.id !== USAGE_ROUTE_ID) {
			return;
		}

		const state: UrlUsageState = {
			period,
			scope,
			groupBy,
			customFrom: period === 'custom' && customRange ? customRange.start : null,
			customTo: period === 'custom' && customRange ? customRange.end : null,
		};

		if (urlUsageStateEquals(lastPushedState, state)) {
			return;
		}

		if (usageMatchesUrl(state, page.url)) {
			return;
		}

		lastPushedState = state;
		const newUrl = buildUsageUrl(page.url, state);
		// eslint-disable-next-line svelte/no-navigation-without-resolve -- URL built with resolve() + dynamic search params
		pushState(resolve(USAGE_ROUTE_ID) + newUrl.search, {
			usagePeriod: state.period,
			usageScope: state.scope,
			usageGroupBy: state.groupBy,
			usageCustomFrom: state.customFrom,
			usageCustomTo: state.customTo,
		});
	}

	$effect(() => {
		const period = target.activePeriod;
		const scope = target.scope;
		const groupBy = target.groupBy;
		const customRange = target.customDateRange;
		untrack(() => pushToUrl(period, scope, groupBy, customRange));
	});

	$effect(() => {
		const pageState = page.state as App.PageState;
		untrack(() => {
			if (!initialized || isRestoring) {
				return;
			}

			if (page.route.id !== USAGE_ROUTE_ID) {
				return;
			}

			const period = isMetricsPeriod(pageState.usagePeriod) ? pageState.usagePeriod : null;
			const scope = isUsageScope(pageState.usageScope) ? pageState.usageScope : null;
			const groupBy = isGroupByOption(pageState.usageGroupBy) ? pageState.usageGroupBy : null;
			const customFrom =
				typeof pageState.usageCustomFrom === 'string' ? pageState.usageCustomFrom : null;
			const customTo =
				typeof pageState.usageCustomTo === 'string' ? pageState.usageCustomTo : null;

			if (
				urlUsageStateEquals(lastPushedState, {
					period,
					scope,
					groupBy,
					customFrom,
					customTo,
				})
			) {
				return;
			}

			isRestoring = true;
			try {
				target.restoreFromUrl(period, scope, groupBy, customFrom, customTo);
				lastPushedState = { period, scope, groupBy, customFrom, customTo };
			} finally {
				isRestoring = false;
			}
		});
	});

	onMount(() => {
		if (page.route.id === USAGE_ROUTE_ID) {
			isRestoring = true;
			try {
				const parsed = parseUsageFromUrl(page.url);
				target.restoreFromUrl(
					parsed.period,
					parsed.scope,
					parsed.groupBy,
					parsed.customFrom,
					parsed.customTo,
				);
				lastPushedState = parsed;
			} finally {
				isRestoring = false;
			}
		}
		initialized = true;
	});
}
