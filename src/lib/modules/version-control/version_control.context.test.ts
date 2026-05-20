import { describe, it, expect } from 'vitest';
import { isCacheStale } from './version_control.context.svelte.js';

describe('isCacheStale', () => {
	it('returns true when entries array is empty', () => {
		expect(isCacheStale([], 5)).toBe(true);
	});

	it('returns true when any entry has null fetched_at', () => {
		const entries = [{ fetched_at: new Date().toISOString() }, { fetched_at: null }];
		expect(isCacheStale(entries, 5)).toBe(true);
	});

	it('returns true when any entry exceeds threshold', () => {
		const now = Date.now();
		const sixMinutesAgo = new Date(now - 6 * 60 * 1000).toISOString();
		const oneMinuteAgo = new Date(now - 1 * 60 * 1000).toISOString();
		const entries = [{ fetched_at: oneMinuteAgo }, { fetched_at: sixMinutesAgo }];
		expect(isCacheStale(entries, 5)).toBe(true);
	});

	it('returns false when all entries are within threshold', () => {
		const now = Date.now();
		const twoMinutesAgo = new Date(now - 2 * 60 * 1000).toISOString();
		const threeMinutesAgo = new Date(now - 3 * 60 * 1000).toISOString();
		const entries = [{ fetched_at: twoMinutesAgo }, { fetched_at: threeMinutesAgo }];
		expect(isCacheStale(entries, 5)).toBe(false);
	});
});
