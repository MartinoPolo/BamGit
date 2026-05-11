import { describe, it, expect } from 'vitest';
import { PRIORITY_OPTIONS, PRIORITY_BADGE_CLASSES } from './issue_card_utils.js';

describe('PRIORITY_OPTIONS', () => {
	it('has exactly 5 priority options (no "none")', () => {
		expect(PRIORITY_OPTIONS).toHaveLength(5);
	});

	it('every option has a non-null value', () => {
		for (const option of PRIORITY_OPTIONS) {
			expect(option.value).not.toBeNull();
		}
	});

	it('contains all priority levels', () => {
		const values = PRIORITY_OPTIONS.map((o) => o.value);
		expect(values).toEqual(['top', 'high', 'medium', 'low', 'lowest']);
	});
});

describe('PRIORITY_BADGE_CLASSES', () => {
	it('maps top, high, low, and lowest priorities', () => {
		expect(PRIORITY_BADGE_CLASSES.top).toBeDefined();
		expect(PRIORITY_BADGE_CLASSES.high).toBeDefined();
		expect(PRIORITY_BADGE_CLASSES.low).toBeDefined();
		expect(PRIORITY_BADGE_CLASSES.lowest).toBeDefined();
	});
});
