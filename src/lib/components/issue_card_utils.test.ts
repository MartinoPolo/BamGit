import { describe, it, expect } from 'vitest';
import {
	getPriorityBorderClass,
	PRIORITY_OPTIONS,
	PRIORITY_BORDER_CLASSES,
	PRIORITY_BADGE_CLASSES,
} from './issue_card_utils.js';

describe('getPriorityBorderClass', () => {
	it('returns transparent when prioritiesEnabled is false regardless of priority', () => {
		expect(getPriorityBorderClass('top', false)).toBe('border-l-transparent');
		expect(getPriorityBorderClass('high', false)).toBe('border-l-transparent');
		expect(getPriorityBorderClass('medium', false)).toBe('border-l-transparent');
		expect(getPriorityBorderClass('low', false)).toBe('border-l-transparent');
		expect(getPriorityBorderClass('lowest', false)).toBe('border-l-transparent');
		expect(getPriorityBorderClass(null, false)).toBe('border-l-transparent');
	});

	it('returns border-l-priority-top for top priority when enabled', () => {
		expect(getPriorityBorderClass('top', true)).toBe('border-l-priority-top');
	});

	it('returns border-l-priority-high for high priority when enabled', () => {
		expect(getPriorityBorderClass('high', true)).toBe('border-l-priority-high');
	});

	it('returns border-l-priority-medium for medium priority when enabled', () => {
		expect(getPriorityBorderClass('medium', true)).toBe('border-l-priority-medium');
	});

	it('returns border-l-priority-low for low priority when enabled', () => {
		expect(getPriorityBorderClass('low', true)).toBe('border-l-priority-low');
	});

	it('returns border-l-priority-lowest for lowest priority when enabled', () => {
		expect(getPriorityBorderClass('lowest', true)).toBe('border-l-priority-lowest');
	});

	it('returns transparent for null priority when enabled', () => {
		expect(getPriorityBorderClass(null, true)).toBe('border-l-transparent');
	});
});

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

describe('PRIORITY_BORDER_CLASSES', () => {
	it('maps all five priority levels to semantic tokens', () => {
		expect(PRIORITY_BORDER_CLASSES.top).toBe('border-l-priority-top');
		expect(PRIORITY_BORDER_CLASSES.high).toBe('border-l-priority-high');
		expect(PRIORITY_BORDER_CLASSES.medium).toBe('border-l-priority-medium');
		expect(PRIORITY_BORDER_CLASSES.low).toBe('border-l-priority-low');
		expect(PRIORITY_BORDER_CLASSES.lowest).toBe('border-l-priority-lowest');
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
