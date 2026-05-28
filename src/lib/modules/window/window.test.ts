import { describe, it, expect } from 'vitest';
import {
	parseWindowLabel,
	isWindowType,
	resolvePopstateNavigation,
	resolveInitialDashboardId,
} from './types.js';

describe('parseWindowLabel', () => {
	it('parses overview label', () => {
		const result = parseWindowLabel('overview');
		expect(result).toEqual({ windowType: 'overview', dashboardId: null });
	});

	it('parses workspace label and extracts dashboard ID', () => {
		const result = parseWindowLabel('workspace-abc-123');
		expect(result).toEqual({ windowType: 'workspace', dashboardId: 'abc-123' });
	});

	it('parses workspace label with UUID dashboard ID', () => {
		const result = parseWindowLabel('workspace-550e8400-e29b-41d4-a716-446655440000');
		expect(result).toEqual({
			windowType: 'workspace',
			dashboardId: '550e8400-e29b-41d4-a716-446655440000',
		});
	});

	it('falls back to overview for unknown labels', () => {
		const result = parseWindowLabel('main');
		expect(result).toEqual({ windowType: 'overview', dashboardId: null });
	});

	it('falls back to overview for empty string', () => {
		const result = parseWindowLabel('');
		expect(result).toEqual({ windowType: 'overview', dashboardId: null });
	});
});

describe('isWindowType', () => {
	it('accepts overview', () => {
		expect(isWindowType('overview')).toBe(true);
	});

	it('accepts workspace', () => {
		expect(isWindowType('workspace')).toBe(true);
	});

	it('rejects invalid strings', () => {
		expect(isWindowType('main')).toBe(false);
		expect(isWindowType('settings')).toBe(false);
	});

	it('rejects non-string values', () => {
		expect(isWindowType(42)).toBe(false);
		expect(isWindowType(null)).toBe(false);
		expect(isWindowType(undefined)).toBe(false);
	});
});

describe('resolvePopstateNavigation', () => {
	const overviewPath = '/overview';

	it('returns overview when pathname matches overview path', () => {
		const result = resolvePopstateNavigation('/overview', overviewPath, undefined, 'dash-1');
		expect(result).toEqual({ windowType: 'overview', dashboardId: null });
	});

	it('returns overview when pathname is a sub-path of overview', () => {
		const result = resolvePopstateNavigation(
			'/overview/details',
			overviewPath,
			undefined,
			null,
		);
		expect(result).toEqual({ windowType: 'overview', dashboardId: null });
	});

	it('returns workspace with page state dashboardId when available', () => {
		const result = resolvePopstateNavigation('/', overviewPath, 'dash-abc', null);
		expect(result).toEqual({ windowType: 'workspace', dashboardId: 'dash-abc' });
	});

	it('falls back to current dashboardId when page state has none', () => {
		const result = resolvePopstateNavigation('/', overviewPath, undefined, 'dash-current');
		expect(result).toEqual({ windowType: 'workspace', dashboardId: 'dash-current' });
	});

	it('prefers page state dashboardId over current dashboardId', () => {
		const result = resolvePopstateNavigation('/', overviewPath, 'dash-from-state', 'dash-old');
		expect(result).toEqual({ windowType: 'workspace', dashboardId: 'dash-from-state' });
	});

	it('falls back to overview when no dashboardId available at workspace path', () => {
		const result = resolvePopstateNavigation('/', overviewPath, undefined, null);
		expect(result).toEqual({ windowType: 'overview', dashboardId: null });
	});

	it('handles base-path-prefixed overview sub-path', () => {
		const result = resolvePopstateNavigation(
			'/app/overview/details',
			'/app/overview',
			undefined,
			'dash-1',
		);
		expect(result).toEqual({ windowType: 'overview', dashboardId: null });
	});
});

describe('resolveInitialDashboardId', () => {
	it('returns parsed label result when label already has a dashboardId', () => {
		const result = resolveInitialDashboardId('workspace-abc', new URLSearchParams());
		expect(result).toEqual({ windowType: 'workspace', dashboardId: 'abc' });
	});

	it('returns workspace with dashboardId from searchParams when label has no dashboardId', () => {
		const result = resolveInitialDashboardId(
			'overview',
			new URLSearchParams('dashboardId=xyz'),
		);
		expect(result).toEqual({ windowType: 'workspace', dashboardId: 'xyz' });
	});

	it('returns overview fallback when neither label nor searchParams have dashboardId', () => {
		const result = resolveInitialDashboardId('overview', new URLSearchParams());
		expect(result).toEqual({ windowType: 'overview', dashboardId: null });
	});

	it('prefers label dashboardId over searchParams dashboardId', () => {
		const result = resolveInitialDashboardId(
			'workspace-from-label',
			new URLSearchParams('dashboardId=from-params'),
		);
		expect(result).toEqual({ windowType: 'workspace', dashboardId: 'from-label' });
	});
});
