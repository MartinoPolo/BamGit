import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
	REFRESH_STATES,
	FRESH_THRESHOLD_MS,
	STALE_THRESHOLD_MS,
	GROUP_BY_OPTIONS,
	isMetricsPeriod,
	isGroupByOption,
	isUsageScope,
	isChartColorTheme,
	USAGE_SCOPES,
	type RefreshState,
	type GroupByOption,
	type MetricsPeriod,
} from './usage_types.js';

function buildGroupByArg(groupBy: GroupByOption): GroupByOption | undefined {
	return groupBy === GROUP_BY_OPTIONS.none ? undefined : groupBy;
}

function buildPeriodArg(
	activePeriod: MetricsPeriod,
	customDateRange: { start: string; end: string } | null,
): MetricsPeriod | { custom: { start: string; end: string } } {
	if (activePeriod === 'custom' && customDateRange) {
		return { custom: customDateRange };
	}
	return activePeriod;
}

describe('UsageContext — query building logic', () => {
	it('groupBy=none maps to undefined (not passed as "none")', () => {
		expect(buildGroupByArg(GROUP_BY_OPTIONS.none)).toBeUndefined();
	});

	it('groupBy=provider is included in the query', () => {
		expect(buildGroupByArg(GROUP_BY_OPTIONS.provider)).toBe('provider');
	});

	it('groupBy=model is included in the query', () => {
		expect(buildGroupByArg(GROUP_BY_OPTIONS.model)).toBe('model');
	});

	it('groupBy=category is included in the query', () => {
		expect(buildGroupByArg(GROUP_BY_OPTIONS.category)).toBe('category');
	});

	it('period=custom with date range builds custom object', () => {
		const result = buildPeriodArg('custom', { start: '2026-01-01', end: '2026-01-31' });
		expect(result).toEqual({ custom: { start: '2026-01-01', end: '2026-01-31' } });
	});

	it('period=custom without date range passes literal "custom"', () => {
		const result = buildPeriodArg('custom', null);
		expect(result).toBe('custom');
	});

	it('period=thirty-days passes literal string', () => {
		const result = buildPeriodArg('thirty-days', null);
		expect(result).toBe('thirty-days');
	});

	it('scope=workspace means dashboardId is relevant', () => {
		expect(USAGE_SCOPES.workspace).toBe('workspace');
	});

	it('scope=global means dashboardId is not relevant', () => {
		expect(USAGE_SCOPES.global).toBe('global');
	});
});

describe('UsageContext — freshness state transitions', () => {
	beforeEach(() => {
		vi.useFakeTimers();
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it('FRESH_THRESHOLD_MS is 30 seconds', () => {
		expect(FRESH_THRESHOLD_MS).toBe(30_000);
	});

	it('STALE_THRESHOLD_MS is 120 seconds', () => {
		expect(STALE_THRESHOLD_MS).toBe(120_000);
	});

	it('fresh timer transitions fresh → idle after FRESH_THRESHOLD_MS', () => {
		let state: RefreshState = REFRESH_STATES.fresh;
		const freshTimer = setTimeout(() => {
			if (state === REFRESH_STATES.fresh) {
				state = REFRESH_STATES.idle;
			}
		}, FRESH_THRESHOLD_MS);

		vi.advanceTimersByTime(FRESH_THRESHOLD_MS);
		expect(state).toBe(REFRESH_STATES.idle);
		clearTimeout(freshTimer);
	});

	it('fresh timer does not change state if already idle', () => {
		let state: RefreshState = REFRESH_STATES.idle;
		const freshTimer = setTimeout(() => {
			if (state === REFRESH_STATES.fresh) {
				state = REFRESH_STATES.idle;
			}
		}, FRESH_THRESHOLD_MS);

		vi.advanceTimersByTime(FRESH_THRESHOLD_MS);
		expect(state).toBe(REFRESH_STATES.idle);
		clearTimeout(freshTimer);
	});

	it('stale timer transitions idle → stale after STALE_THRESHOLD_MS', () => {
		let state: RefreshState = REFRESH_STATES.idle;
		const staleTimer = setTimeout(() => {
			if (state !== REFRESH_STATES.loading && state !== REFRESH_STATES.newDataAvailable) {
				state = REFRESH_STATES.stale;
			}
		}, STALE_THRESHOLD_MS);

		vi.advanceTimersByTime(STALE_THRESHOLD_MS);
		expect(state).toBe(REFRESH_STATES.stale);
		clearTimeout(staleTimer);
	});

	it('stale timer does not change loading state', () => {
		let state: RefreshState = REFRESH_STATES.loading;
		const staleTimer = setTimeout(() => {
			if (state !== REFRESH_STATES.loading && state !== REFRESH_STATES.newDataAvailable) {
				state = REFRESH_STATES.stale;
			}
		}, STALE_THRESHOLD_MS);

		vi.advanceTimersByTime(STALE_THRESHOLD_MS);
		expect(state).toBe(REFRESH_STATES.loading);
		clearTimeout(staleTimer);
	});

	it('stale timer does not change newDataAvailable state', () => {
		let state: RefreshState = REFRESH_STATES.newDataAvailable;
		const staleTimer = setTimeout(() => {
			if (state !== REFRESH_STATES.loading && state !== REFRESH_STATES.newDataAvailable) {
				state = REFRESH_STATES.stale;
			}
		}, STALE_THRESHOLD_MS);

		vi.advanceTimersByTime(STALE_THRESHOLD_MS);
		expect(state).toBe(REFRESH_STATES.newDataAvailable);
		clearTimeout(staleTimer);
	});

	it('full lifecycle: loading → fresh → idle → stale', () => {
		let state: RefreshState = REFRESH_STATES.loading;

		state = REFRESH_STATES.fresh;

		const freshTimer = setTimeout(() => {
			if (state === REFRESH_STATES.fresh) {
				state = REFRESH_STATES.idle;
			}
		}, FRESH_THRESHOLD_MS);
		const staleTimer = setTimeout(() => {
			if (state !== REFRESH_STATES.loading && state !== REFRESH_STATES.newDataAvailable) {
				state = REFRESH_STATES.stale;
			}
		}, STALE_THRESHOLD_MS);

		expect(state).toBe(REFRESH_STATES.fresh);

		vi.advanceTimersByTime(FRESH_THRESHOLD_MS);
		expect(state).toBe(REFRESH_STATES.idle);

		vi.advanceTimersByTime(STALE_THRESHOLD_MS - FRESH_THRESHOLD_MS);
		expect(state).toBe(REFRESH_STATES.stale);

		clearTimeout(freshTimer);
		clearTimeout(staleTimer);
	});

	it('timer cleanup clears both timers', () => {
		const freshTimer = setTimeout(() => {}, FRESH_THRESHOLD_MS);
		const staleTimer = setTimeout(() => {}, STALE_THRESHOLD_MS);
		clearTimeout(freshTimer);
		clearTimeout(staleTimer);

		expect(vi.getTimerCount()).toBe(0);
	});
});

describe('Usage type guards', () => {
	it('isMetricsPeriod accepts valid periods', () => {
		expect(isMetricsPeriod('today')).toBe(true);
		expect(isMetricsPeriod('week')).toBe(true);
		expect(isMetricsPeriod('thirty-days')).toBe(true);
		expect(isMetricsPeriod('month')).toBe(true);
		expect(isMetricsPeriod('all')).toBe(true);
		expect(isMetricsPeriod('custom')).toBe(true);
	});

	it('isMetricsPeriod rejects invalid values', () => {
		expect(isMetricsPeriod('7d')).toBe(false);
		expect(isMetricsPeriod('')).toBe(false);
		expect(isMetricsPeriod(null)).toBe(false);
		expect(isMetricsPeriod(42)).toBe(false);
	});

	it('isGroupByOption accepts valid options', () => {
		expect(isGroupByOption('none')).toBe(true);
		expect(isGroupByOption('model')).toBe(true);
		expect(isGroupByOption('provider')).toBe(true);
		expect(isGroupByOption('category')).toBe(true);
	});

	it('isGroupByOption rejects invalid values', () => {
		expect(isGroupByOption('date')).toBe(false);
		expect(isGroupByOption(null)).toBe(false);
	});

	it('isUsageScope accepts valid scopes', () => {
		expect(isUsageScope('workspace')).toBe(true);
		expect(isUsageScope('global')).toBe(true);
	});

	it('isUsageScope rejects invalid values', () => {
		expect(isUsageScope('local')).toBe(false);
		expect(isUsageScope(null)).toBe(false);
	});

	it('isChartColorTheme accepts valid themes', () => {
		expect(isChartColorTheme('monochrome')).toBe(true);
		expect(isChartColorTheme('traffic-light')).toBe(true);
		expect(isChartColorTheme('gradient')).toBe(true);
	});

	it('isChartColorTheme rejects invalid values', () => {
		expect(isChartColorTheme('rainbow')).toBe(false);
		expect(isChartColorTheme(null)).toBe(false);
	});
});
