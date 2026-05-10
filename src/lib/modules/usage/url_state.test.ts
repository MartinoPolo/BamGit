import { describe, it, expect } from 'vitest';
import { GROUP_BY_OPTIONS, USAGE_SCOPES } from './usage_types.js';
import {
	serializeUsageToParams,
	parseUsageFromUrl,
	usageMatchesUrl,
	buildUsageUrl,
	type UrlUsageState,
} from './url_state.js';

const EMPTY_STATE: UrlUsageState = {
	period: null,
	scope: null,
	groupBy: null,
	customFrom: null,
	customTo: null,
};

describe('serializeUsageToParams', () => {
	it('serializes period to ?period=X', () => {
		const params = serializeUsageToParams({ ...EMPTY_STATE, period: 'week' });
		expect(params.get('period')).toBe('week');
	});

	it('serializes scope to ?scope=X', () => {
		const params = serializeUsageToParams({ ...EMPTY_STATE, scope: 'global' });
		expect(params.get('scope')).toBe('global');
	});

	it('serializes groupBy when not none', () => {
		const params = serializeUsageToParams({ ...EMPTY_STATE, groupBy: 'model' });
		expect(params.get('groupBy')).toBe('model');
	});

	it('omits groupBy when none', () => {
		const params = serializeUsageToParams({ ...EMPTY_STATE, groupBy: 'none' });
		expect(params.has('groupBy')).toBe(false);
	});

	it('serializes custom date range when period is custom', () => {
		const params = serializeUsageToParams({
			...EMPTY_STATE,
			period: 'custom',
			customFrom: '2026-01-01',
			customTo: '2026-01-31',
		});
		expect(params.get('from')).toBe('2026-01-01');
		expect(params.get('to')).toBe('2026-01-31');
	});

	it('omits from/to when period is not custom', () => {
		const params = serializeUsageToParams({
			...EMPTY_STATE,
			period: 'week',
			customFrom: '2026-01-01',
			customTo: '2026-01-31',
		});
		expect(params.has('from')).toBe(false);
		expect(params.has('to')).toBe(false);
	});

	it('omits null values from params', () => {
		const params = serializeUsageToParams(EMPTY_STATE);
		expect(params.toString()).toBe('');
	});

	it('serializes all fields together', () => {
		const params = serializeUsageToParams({
			period: 'custom',
			scope: 'workspace',
			groupBy: 'provider',
			customFrom: '2026-05-01',
			customTo: '2026-05-10',
		});
		expect(params.get('period')).toBe('custom');
		expect(params.get('scope')).toBe('workspace');
		expect(params.get('groupBy')).toBe('provider');
		expect(params.get('from')).toBe('2026-05-01');
		expect(params.get('to')).toBe('2026-05-10');
	});
});

describe('parseUsageFromUrl', () => {
	it('parses valid period param', () => {
		const url = new URL('http://localhost/?period=week');
		expect(parseUsageFromUrl(url).period).toBe('week');
	});

	it('returns null for invalid period', () => {
		const url = new URL('http://localhost/?period=bogus');
		expect(parseUsageFromUrl(url).period).toBeNull();
	});

	it('parses valid scope param', () => {
		const url = new URL('http://localhost/?scope=global');
		expect(parseUsageFromUrl(url).scope).toBe('global');
	});

	it('returns null for invalid scope', () => {
		const url = new URL('http://localhost/?scope=bogus');
		expect(parseUsageFromUrl(url).scope).toBeNull();
	});

	it('parses valid groupBy param', () => {
		const url = new URL('http://localhost/?groupBy=model');
		expect(parseUsageFromUrl(url).groupBy).toBe('model');
	});

	it('returns null for invalid groupBy', () => {
		const url = new URL('http://localhost/?groupBy=bogus');
		expect(parseUsageFromUrl(url).groupBy).toBeNull();
	});

	it('parses from/to params', () => {
		const url = new URL('http://localhost/?from=2026-01-01&to=2026-01-31');
		const result = parseUsageFromUrl(url);
		expect(result.customFrom).toBe('2026-01-01');
		expect(result.customTo).toBe('2026-01-31');
	});

	it('returns null for missing from/to', () => {
		const url = new URL('http://localhost/');
		const result = parseUsageFromUrl(url);
		expect(result.customFrom).toBeNull();
		expect(result.customTo).toBeNull();
	});

	it('no params returns all null', () => {
		const url = new URL('http://localhost/');
		expect(parseUsageFromUrl(url)).toEqual(EMPTY_STATE);
	});

	it('validates all MetricsPeriod values', () => {
		for (const period of ['today', 'week', 'thirty-days', 'month', 'all', 'custom']) {
			const url = new URL(`http://localhost/?period=${period}`);
			expect(parseUsageFromUrl(url).period).toBe(period);
		}
	});

	it('validates all UsageScope values', () => {
		for (const scope of Object.values(USAGE_SCOPES)) {
			const url = new URL(`http://localhost/?scope=${scope}`);
			expect(parseUsageFromUrl(url).scope).toBe(scope);
		}
	});

	it('validates all GroupByOption values', () => {
		for (const groupBy of Object.values(GROUP_BY_OPTIONS)) {
			const url = new URL(`http://localhost/?groupBy=${groupBy}`);
			expect(parseUsageFromUrl(url).groupBy).toBe(groupBy);
		}
	});
});

describe('usageMatchesUrl', () => {
	it('returns true when all state fields match URL params', () => {
		const url = new URL('http://localhost/?period=week&scope=workspace&groupBy=model');
		const state: UrlUsageState = {
			period: 'week',
			scope: 'workspace',
			groupBy: 'model',
			customFrom: null,
			customTo: null,
		};
		expect(usageMatchesUrl(state, url)).toBe(true);
	});

	it('returns false when period differs', () => {
		const url = new URL('http://localhost/?period=week');
		expect(usageMatchesUrl({ ...EMPTY_STATE, period: 'month' }, url)).toBe(false);
	});

	it('returns false when scope differs', () => {
		const url = new URL('http://localhost/?scope=global');
		expect(usageMatchesUrl({ ...EMPTY_STATE, scope: 'workspace' }, url)).toBe(false);
	});

	it('returns false when groupBy differs', () => {
		const url = new URL('http://localhost/?groupBy=model');
		expect(usageMatchesUrl({ ...EMPTY_STATE, groupBy: 'provider' }, url)).toBe(false);
	});

	it('null state matches URL without params', () => {
		const url = new URL('http://localhost/');
		expect(usageMatchesUrl(EMPTY_STATE, url)).toBe(true);
	});

	it('returns true when custom dates match', () => {
		const url = new URL('http://localhost/?from=2026-01-01&to=2026-01-31');
		const state: UrlUsageState = {
			...EMPTY_STATE,
			customFrom: '2026-01-01',
			customTo: '2026-01-31',
		};
		expect(usageMatchesUrl(state, url)).toBe(true);
	});

	it('returns false when custom dates differ', () => {
		const url = new URL('http://localhost/?from=2026-01-01&to=2026-01-31');
		const state: UrlUsageState = {
			...EMPTY_STATE,
			customFrom: '2026-02-01',
			customTo: '2026-02-28',
		};
		expect(usageMatchesUrl(state, url)).toBe(false);
	});
});

describe('buildUsageUrl', () => {
	it('creates URL with usage params', () => {
		const base = new URL('http://localhost/usage');
		const result = buildUsageUrl(base, { ...EMPTY_STATE, period: 'week', scope: 'global' });
		expect(result.searchParams.get('period')).toBe('week');
		expect(result.searchParams.get('scope')).toBe('global');
		expect(result.pathname).toBe('/usage');
	});

	it('replaces existing search params', () => {
		const base = new URL('http://localhost/usage?old=param&other=value');
		const result = buildUsageUrl(base, { ...EMPTY_STATE, period: 'today' });
		expect(result.searchParams.has('old')).toBe(false);
		expect(result.searchParams.has('other')).toBe(false);
		expect(result.searchParams.get('period')).toBe('today');
	});

	it('preserves pathname and origin', () => {
		const base = new URL('http://localhost:1420/dashboard/usage');
		const result = buildUsageUrl(base, EMPTY_STATE);
		expect(result.origin).toBe('http://localhost:1420');
		expect(result.pathname).toBe('/dashboard/usage');
	});

	it('null state produces clean URL', () => {
		const base = new URL('http://localhost/?period=week');
		const result = buildUsageUrl(base, EMPTY_STATE);
		expect(result.href).toBe('http://localhost/');
	});
});
