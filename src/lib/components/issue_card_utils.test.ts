import { describe, it, expect } from 'vitest';
import {
	getPriorityBorderClass,
	PRIORITY_OPTIONS,
	PRIORITY_BORDER_CLASSES,
	PRIORITY_BADGE_CLASSES,
	isExpandedStates,
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

	it('returns border-l-red-500 for top priority when enabled', () => {
		expect(getPriorityBorderClass('top', true)).toBe('border-l-red-500');
	});

	it('returns border-l-orange-400 for high priority when enabled', () => {
		expect(getPriorityBorderClass('high', true)).toBe('border-l-orange-400');
	});

	it('returns border-l-yellow-400 for medium priority when enabled', () => {
		expect(getPriorityBorderClass('medium', true)).toBe('border-l-yellow-400');
	});

	it('returns border-l-blue-400 for low priority when enabled', () => {
		expect(getPriorityBorderClass('low', true)).toBe('border-l-blue-400');
	});

	it('returns border-l-gray-400 for lowest priority when enabled', () => {
		expect(getPriorityBorderClass('lowest', true)).toBe('border-l-gray-400');
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
	it('maps all five priority levels', () => {
		expect(PRIORITY_BORDER_CLASSES.top).toBe('border-l-red-500');
		expect(PRIORITY_BORDER_CLASSES.high).toBe('border-l-orange-400');
		expect(PRIORITY_BORDER_CLASSES.medium).toBe('border-l-yellow-400');
		expect(PRIORITY_BORDER_CLASSES.low).toBe('border-l-blue-400');
		expect(PRIORITY_BORDER_CLASSES.lowest).toBe('border-l-gray-400');
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

describe('isExpandedStates', () => {
	it('returns true for empty object', () => {
		expect(isExpandedStates({})).toBe(true);
	});

	it('returns true for object with boolean values', () => {
		expect(isExpandedStates({ abc: true, def: false })).toBe(true);
	});

	it('returns false for null', () => {
		expect(isExpandedStates(null)).toBe(false);
	});

	it('returns false for string', () => {
		expect(isExpandedStates('string')).toBe(false);
	});

	it('returns false for object with non-boolean values', () => {
		expect(isExpandedStates({ abc: 123 })).toBe(false);
	});

	it('returns false for array', () => {
		expect(isExpandedStates([true])).toBe(false);
	});
});
