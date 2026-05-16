import { describe, it, expect } from 'vitest';
import {
	isMetricsPeriod,
	isGroupByOption,
	isUsageScope,
	isChartColorTheme,
} from './usage_types.js';

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
