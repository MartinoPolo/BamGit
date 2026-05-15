import { describe, it, expect } from 'vitest';
import { BOTTOM_PANEL_TABS } from './selection.js';
import {
	serializeSelectionToParams,
	parseSelectionFromUrl,
	selectionMatchesUrl,
	buildSelectionUrl,
} from './url_state.js';

describe('serializeSelectionToParams', () => {
	it('encodes issue and tab', () => {
		const params = serializeSelectionToParams({ issueId: 'abc-123', tab: 'dependencies' });
		expect(params.get('issue')).toBe('abc-123');
		expect(params.get('tab')).toBe('dependencies');
	});

	it('omits null issue', () => {
		const params = serializeSelectionToParams({ issueId: null, tab: 'issues' });
		expect(params.has('issue')).toBe(false);
		expect(params.get('tab')).toBe('issues');
	});

	it('omits null tab', () => {
		const params = serializeSelectionToParams({ issueId: 'abc', tab: null });
		expect(params.get('issue')).toBe('abc');
		expect(params.has('tab')).toBe(false);
	});

	it('both null produces empty params', () => {
		const params = serializeSelectionToParams({ issueId: null, tab: null });
		expect(params.toString()).toBe('');
	});
});

describe('parseSelectionFromUrl', () => {
	it('parses valid params', () => {
		const url = new URL('http://localhost/?issue=abc-123&tab=dependencies');
		expect(parseSelectionFromUrl(url)).toEqual({ issueId: 'abc-123', tab: 'dependencies' });
	});

	it('invalid tab returns null tab', () => {
		const url = new URL('http://localhost/?issue=abc&tab=bogus');
		expect(parseSelectionFromUrl(url)).toEqual({ issueId: 'abc', tab: null });
	});

	it('no params returns both null', () => {
		const url = new URL('http://localhost/');
		expect(parseSelectionFromUrl(url)).toEqual({ issueId: null, tab: null });
	});

	it('only issue param', () => {
		const url = new URL('http://localhost/?issue=abc');
		expect(parseSelectionFromUrl(url)).toEqual({ issueId: 'abc', tab: null });
	});

	it('validates all valid tab values', () => {
		for (const tabValue of Object.values(BOTTOM_PANEL_TABS)) {
			const url = new URL(`http://localhost/?tab=${tabValue}`);
			const result = parseSelectionFromUrl(url);
			expect(result.tab).toBe(tabValue);
		}
	});
});

describe('selectionMatchesUrl', () => {
	it('returns true when matching', () => {
		const url = new URL('http://localhost/?issue=abc&tab=issues');
		expect(selectionMatchesUrl({ issueId: 'abc', tab: 'issues' }, url)).toBe(true);
	});

	it('returns false when different issue', () => {
		const url = new URL('http://localhost/?issue=abc&tab=issues');
		expect(selectionMatchesUrl({ issueId: 'xyz', tab: 'issues' }, url)).toBe(false);
	});

	it('returns false when different tab', () => {
		const url = new URL('http://localhost/?issue=abc&tab=issues');
		expect(selectionMatchesUrl({ issueId: 'abc', tab: 'kanban' }, url)).toBe(false);
	});

	it('null state matches URL without params', () => {
		const url = new URL('http://localhost/');
		expect(selectionMatchesUrl({ issueId: null, tab: null }, url)).toBe(true);
	});

	it('returns false when state has issue but URL does not', () => {
		const url = new URL('http://localhost/');
		expect(selectionMatchesUrl({ issueId: 'abc', tab: null }, url)).toBe(false);
	});

	it('returns false when URL has issue but state does not', () => {
		const url = new URL('http://localhost/?issue=abc');
		expect(selectionMatchesUrl({ issueId: null, tab: null }, url)).toBe(false);
	});
});

describe('parseSelectionFromUrl — edge cases', () => {
	it('unknown tab value in URL falls back to null tab', () => {
		const url = new URL('http://localhost/?issue=abc&tab=unknown-panel');
		const result = parseSelectionFromUrl(url);
		expect(result).toEqual({ issueId: 'abc', tab: null });
	});

	it('any string is accepted as issue ID (validation is UI-level)', () => {
		const url = new URL('http://localhost/?issue=not-a-uuid&tab=issues');
		const result = parseSelectionFromUrl(url);
		expect(result.issueId).toBe('not-a-uuid');
	});

	it('both issue and tab present serialize/deserialize round-trip correctly', () => {
		const original = { issueId: 'abc-123', tab: 'dependencies' as const };
		const params = serializeSelectionToParams(original);
		const url = new URL(`http://localhost/?${params.toString()}`);
		const parsed = parseSelectionFromUrl(url);
		expect(parsed).toEqual(original);
	});

	it('empty string issue is treated as present', () => {
		const url = new URL('http://localhost/?issue=');
		const result = parseSelectionFromUrl(url);
		expect(result.issueId).toBe('');
	});
});

describe('buildSelectionUrl', () => {
	it('builds correct URL with params', () => {
		const base = new URL('http://localhost/');
		const result = buildSelectionUrl(base, { issueId: 'abc', tab: 'dependencies' });
		expect(result.href).toBe('http://localhost/?issue=abc&tab=dependencies');
	});

	it('clears existing params', () => {
		const base = new URL('http://localhost/?old=param');
		const result = buildSelectionUrl(base, { issueId: 'abc', tab: null });
		expect(result.href).toBe('http://localhost/?issue=abc');
	});

	it('both null produces clean URL', () => {
		const base = new URL('http://localhost/?issue=abc');
		const result = buildSelectionUrl(base, { issueId: null, tab: null });
		expect(result.href).toBe('http://localhost/');
	});
});
