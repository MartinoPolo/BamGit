import { describe, it, expect } from 'vitest';
import { computeLabelOverflow } from './label_overflow.js';

describe('computeLabelOverflow', () => {
	it('returns zero visible and zero overflow for 0 labels', () => {
		expect(computeLabelOverflow(0)).toEqual({ visibleCount: 0, overflowCount: 0 });
	});

	it('returns all visible and zero overflow for count within limit', () => {
		expect(computeLabelOverflow(2)).toEqual({ visibleCount: 2, overflowCount: 0 });
	});

	it('returns all visible and zero overflow at exact limit', () => {
		expect(computeLabelOverflow(3)).toEqual({ visibleCount: 3, overflowCount: 0 });
	});

	it('returns max visible and overflow of 1 for count exceeding limit by 1', () => {
		expect(computeLabelOverflow(4)).toEqual({ visibleCount: 3, overflowCount: 1 });
	});

	it('returns max visible and correct overflow for large counts', () => {
		expect(computeLabelOverflow(5)).toEqual({ visibleCount: 3, overflowCount: 2 });
		expect(computeLabelOverflow(10)).toEqual({ visibleCount: 3, overflowCount: 7 });
	});
});
