import { describe, it, expect } from 'vitest';
import { parseWindowLabel, isWindowType } from './types.js';

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
