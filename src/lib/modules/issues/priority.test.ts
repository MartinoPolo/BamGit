import { describe, it, expect } from 'vitest';
import { PRIORITY_ORDER } from './priority.js';

describe('priorityOrder', () => {
	it('covers all 5 priority levels', () => {
		expect(Object.keys(PRIORITY_ORDER)).toHaveLength(5);
		expect(PRIORITY_ORDER).toHaveProperty('lowest');
		expect(PRIORITY_ORDER).toHaveProperty('low');
		expect(PRIORITY_ORDER).toHaveProperty('medium');
		expect(PRIORITY_ORDER).toHaveProperty('high');
		expect(PRIORITY_ORDER).toHaveProperty('top');
	});

	it('assigns lower order values to higher priorities (top > high > medium > low > lowest)', () => {
		expect(PRIORITY_ORDER.top).toBeLessThan(PRIORITY_ORDER.high);
		expect(PRIORITY_ORDER.high).toBeLessThan(PRIORITY_ORDER.medium);
		expect(PRIORITY_ORDER.medium).toBeLessThan(PRIORITY_ORDER.low);
		expect(PRIORITY_ORDER.low).toBeLessThan(PRIORITY_ORDER.lowest);
	});
});
