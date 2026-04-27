import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { formatRelativeTime } from './time.js';

describe('formatRelativeTime', () => {
	beforeEach(() => {
		vi.useFakeTimers();
		vi.setSystemTime(new Date('2024-01-01T12:00:00Z'));
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it('returns "Never synced" for null', () => {
		expect(formatRelativeTime(null)).toBe('Never synced');
	});

	it('returns "Just now" within 60 seconds', () => {
		expect(formatRelativeTime('2024-01-01 11:59:30')).toBe('Just now');
		expect(formatRelativeTime('2024-01-01 11:59:01')).toBe('Just now');
	});

	it('returns minutes for 1-59 minutes ago', () => {
		expect(formatRelativeTime('2024-01-01 11:59:00')).toBe('1m ago');
		expect(formatRelativeTime('2024-01-01 11:45:00')).toBe('15m ago');
		expect(formatRelativeTime('2024-01-01 11:00:01')).toBe('59m ago');
	});

	it('returns hours for 1-23 hours ago', () => {
		expect(formatRelativeTime('2024-01-01 11:00:00')).toBe('1h ago');
		expect(formatRelativeTime('2024-01-01 09:00:00')).toBe('3h ago');
		expect(formatRelativeTime('2023-12-31 12:00:01')).toBe('23h ago');
	});

	it('returns days for 1+ days ago', () => {
		expect(formatRelativeTime('2023-12-31 12:00:00')).toBe('1d ago');
		expect(formatRelativeTime('2023-12-30 12:00:00')).toBe('2d ago');
	});
});
