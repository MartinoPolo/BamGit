import { describe, it, expect } from 'vitest';
import {
	findPaletteForDashboard,
	selectActiveDashboardId,
	resolveActiveDashboardId,
} from './types.js';
import type { ColorPalette } from '$lib/types/generated';

describe('findPaletteForDashboard', () => {
	const defaultId = 'palette-vivid';
	const palettes: ColorPalette[] = [
		{ id: 'palette-first', name: 'First', colors: [], is_built_in: true },
		{ id: 'palette-vivid', name: 'Vivid', colors: [], is_built_in: true },
		{ id: 'palette-custom', name: 'Custom', colors: [], is_built_in: false },
	];

	it('returns the default palette when colorPaletteId is null', () => {
		expect(findPaletteForDashboard(palettes, null, defaultId)).toEqual(palettes[1]);
	});

	it('falls back to first palette when default is not found', () => {
		expect(findPaletteForDashboard(palettes, null, 'nonexistent')).toEqual(palettes[0]);
	});

	it('returns null when list is empty and colorPaletteId is null', () => {
		expect(findPaletteForDashboard([], null, defaultId)).toBeNull();
	});

	it('finds palette by id when colorPaletteId is provided', () => {
		expect(findPaletteForDashboard(palettes, 'palette-custom', defaultId)).toEqual(palettes[2]);
	});

	it('returns null when colorPaletteId is not found', () => {
		expect(findPaletteForDashboard(palettes, 'missing-id', defaultId)).toBeNull();
	});
});

describe('selectActiveDashboardId', () => {
	const dashboards = [{ id: 'dash-1' }, { id: 'dash-2' }, { id: 'dash-3' }];

	it('selects lastViewedId when it exists in dashboards', () => {
		expect(selectActiveDashboardId(dashboards, 'dash-2')).toBe('dash-2');
	});

	it('falls back to first dashboard when lastViewedId is not found', () => {
		expect(selectActiveDashboardId(dashboards, 'nonexistent')).toBe('dash-1');
	});

	it('falls back to first dashboard when lastViewedId is null', () => {
		expect(selectActiveDashboardId(dashboards, null)).toBe('dash-1');
	});

	it('returns null when dashboards is empty', () => {
		expect(selectActiveDashboardId([], null)).toBeNull();
	});

	it('returns null when dashboards is empty and lastViewedId is set', () => {
		expect(selectActiveDashboardId([], 'dash-1')).toBeNull();
	});
});

describe('resolveActiveDashboardId', () => {
	const dashboards = [{ id: 'dash-1' }, { id: 'dash-2' }];

	it('keeps current active ID when it exists in dashboards', () => {
		expect(resolveActiveDashboardId(dashboards, 'dash-2')).toBe('dash-2');
	});

	it('falls back to first dashboard when current is not found', () => {
		expect(resolveActiveDashboardId(dashboards, 'deleted')).toBe('dash-1');
	});

	it('falls back to first dashboard when current is null', () => {
		expect(resolveActiveDashboardId(dashboards, null)).toBe('dash-1');
	});

	it('returns null when dashboards is empty', () => {
		expect(resolveActiveDashboardId([], 'dash-1')).toBeNull();
	});
});
