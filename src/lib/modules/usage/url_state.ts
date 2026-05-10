import {
	isMetricsPeriod,
	isGroupByOption,
	isUsageScope,
	type MetricsPeriod,
	type GroupByOption,
	type UsageScope,
} from './usage_types.js';

// ─── URL Param Names ────────────────────────────────────────────────────

const PARAM_PERIOD = 'period';
const PARAM_SCOPE = 'scope';
const PARAM_GROUP_BY = 'groupBy';
const PARAM_FROM = 'from';
const PARAM_TO = 'to';

// ─── Types ──────────────────────────────────────────────────────────────

export interface UrlUsageState {
	period: MetricsPeriod | null;
	scope: UsageScope | null;
	groupBy: GroupByOption | null;
	customFrom: string | null;
	customTo: string | null;
}

// ─── Serialize ──────────────────────────────────────────────────────────

export function serializeUsageToParams(state: UrlUsageState): URLSearchParams {
	const params = new URLSearchParams();
	if (state.period !== null) {
		params.set(PARAM_PERIOD, state.period);
	}
	if (state.scope !== null) {
		params.set(PARAM_SCOPE, state.scope);
	}
	if (state.groupBy !== null && state.groupBy !== 'none') {
		params.set(PARAM_GROUP_BY, state.groupBy);
	}
	if (state.period === 'custom') {
		if (state.customFrom !== null) {
			params.set(PARAM_FROM, state.customFrom);
		}
		if (state.customTo !== null) {
			params.set(PARAM_TO, state.customTo);
		}
	}
	return params;
}

// ─── Parse ──────────────────────────────────────────────────────────────

export function parseUsageFromUrl(url: URL): UrlUsageState {
	const periodParam = url.searchParams.get(PARAM_PERIOD);
	const scopeParam = url.searchParams.get(PARAM_SCOPE);
	const groupByParam = url.searchParams.get(PARAM_GROUP_BY);
	const customFrom = url.searchParams.get(PARAM_FROM);
	const customTo = url.searchParams.get(PARAM_TO);

	return {
		period: isMetricsPeriod(periodParam) ? periodParam : null,
		scope: isUsageScope(scopeParam) ? scopeParam : null,
		groupBy: isGroupByOption(groupByParam) ? groupByParam : null,
		customFrom,
		customTo,
	};
}

// ─── Match Check ────────────────────────────────────────────────────────

export function usageMatchesUrl(state: UrlUsageState, url: URL): boolean {
	const current = parseUsageFromUrl(url);
	return (
		current.period === state.period &&
		current.scope === state.scope &&
		current.groupBy === state.groupBy &&
		current.customFrom === state.customFrom &&
		current.customTo === state.customTo
	);
}

// ─── Equality ───────────────────────────────────────────────────────────

export function urlUsageStateEquals(a: UrlUsageState | null, b: UrlUsageState): boolean {
	if (a === null) {
		return false;
	}
	return (
		a.period === b.period &&
		a.scope === b.scope &&
		a.groupBy === b.groupBy &&
		a.customFrom === b.customFrom &&
		a.customTo === b.customTo
	);
}

// ─── Build URL ──────────────────────────────────────────────────────────

export function buildUsageUrl(baseUrl: URL, state: UrlUsageState): URL {
	const newUrl = new URL(baseUrl);
	newUrl.search = '';
	const params = serializeUsageToParams(state);
	const paramString = params.toString();
	if (paramString) {
		newUrl.search = paramString;
	}
	return newUrl;
}
