import { describe, it, expect } from 'vitest';
import { findNotificationDotColor } from './notification-helpers.js';
import type { NotificationEventType } from '$lib/types/generated';

describe('findNotificationDotColor', () => {
	const dotColors: Record<NotificationEventType, string | null> = {
		'needs-input': 'bg-amber-400',
		'needs-review': 'bg-blue-400',
		errored: 'bg-red-400',
		finished: null,
		'pr-ready': null,
	};

	it('returns color for first session with a colored pending type', () => {
		const getPendingType = (id: string) => {
			if (id === 'session-2') {
				return 'needs-input' as NotificationEventType;
			}
			return undefined;
		};
		expect(
			findNotificationDotColor(['session-1', 'session-2'], getPendingType, dotColors),
		).toBe('bg-amber-400');
	});

	it('returns null when no sessions have pending types', () => {
		expect(findNotificationDotColor(['s1', 's2'], () => undefined, dotColors)).toBeNull();
	});

	it('returns null for empty session list', () => {
		expect(findNotificationDotColor([], () => undefined, dotColors)).toBeNull();
	});

	it('skips pending types with null color', () => {
		const getPendingType = (id: string) => {
			if (id === 'session-1') {
				return 'finished' as NotificationEventType;
			}
			if (id === 'session-2') {
				return 'errored' as NotificationEventType;
			}
			return undefined;
		};
		expect(
			findNotificationDotColor(['session-1', 'session-2'], getPendingType, dotColors),
		).toBe('bg-red-400');
	});

	it('returns first matching color in order', () => {
		const getPendingType = () => 'needs-review' as NotificationEventType;
		expect(findNotificationDotColor(['s1', 's2'], getPendingType, dotColors)).toBe(
			'bg-blue-400',
		);
	});
});
