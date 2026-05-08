import { describe, it, expect } from 'vitest';
import { findNotificationDotColor } from './notification_helpers.js';
import type { NotificationEventType } from '$lib/types/generated';

describe('findNotificationDotColor', () => {
	const dotColors: Partial<Record<NotificationEventType, string | null>> = {
		'session.needs-input': 'bg-amber-400',
		'session.error': 'bg-red-400',
		'session.end': 'bg-green-400',
		'merge.conflict': 'bg-orange-400',
		'pr.ready': 'bg-blue-400',
	};

	it('returns color for first session with a colored pending type', () => {
		const getPendingType = (id: string) => {
			if (id === 'session-2') {
				return 'session.needs-input' as NotificationEventType;
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

	it('skips pending types without a dot color', () => {
		const getPendingType = (id: string) => {
			if (id === 'session-1') {
				return 'task.complete' as NotificationEventType;
			}
			if (id === 'session-2') {
				return 'session.error' as NotificationEventType;
			}
			return undefined;
		};
		expect(
			findNotificationDotColor(['session-1', 'session-2'], getPendingType, dotColors),
		).toBe('bg-red-400');
	});

	it('returns first matching color in order', () => {
		const getPendingType = () => 'pr.ready' as NotificationEventType;
		expect(findNotificationDotColor(['s1', 's2'], getPendingType, dotColors)).toBe(
			'bg-blue-400',
		);
	});
});
