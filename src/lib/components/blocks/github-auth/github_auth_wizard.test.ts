import { describe, it, expect } from 'vitest';
import { formatRemainingTime, getTimerUrgency } from './github_auth_wizard.svelte.js';

describe('formatRemainingTime', () => {
	it('formats 900 seconds as 15:00', () => {
		expect(formatRemainingTime(900)).toBe('15:00');
	});

	it('formats 0 seconds as 00:00', () => {
		expect(formatRemainingTime(0)).toBe('00:00');
	});

	it('formats 65 seconds as 01:05', () => {
		expect(formatRemainingTime(65)).toBe('01:05');
	});

	it('formats 59 seconds as 00:59', () => {
		expect(formatRemainingTime(59)).toBe('00:59');
	});
});

describe('getTimerUrgency', () => {
	it('returns normal for values above 300 seconds', () => {
		expect(getTimerUrgency(600)).toBe('normal');
	});

	it('returns warning at exactly 300 seconds', () => {
		expect(getTimerUrgency(300)).toBe('warning');
	});

	it('returns warning between 120 and 300 seconds', () => {
		expect(getTimerUrgency(250)).toBe('warning');
	});

	it('returns danger at exactly 120 seconds', () => {
		expect(getTimerUrgency(120)).toBe('danger');
	});

	it('returns danger below 120 seconds', () => {
		expect(getTimerUrgency(30)).toBe('danger');
	});

	it('returns danger at 0 seconds', () => {
		expect(getTimerUrgency(0)).toBe('danger');
	});
});
