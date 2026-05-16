import { describe, it, expect } from 'vitest';
import {
	computeCommandResultsOverflow,
	MAX_VISIBLE_COMMAND_RESULTS,
} from './command_results_overflow.js';

describe('computeCommandResultsOverflow', () => {
	it('returns zero visible and zero overflow for 0 results', () => {
		expect(computeCommandResultsOverflow(0)).toEqual({ visibleCount: 0, overflowCount: 0 });
	});

	it('returns all visible and zero overflow for 1 result', () => {
		expect(computeCommandResultsOverflow(1)).toEqual({ visibleCount: 1, overflowCount: 0 });
	});

	it('returns all visible and zero overflow at exact limit', () => {
		expect(computeCommandResultsOverflow(3)).toEqual({ visibleCount: 3, overflowCount: 0 });
	});

	it('returns max visible and overflow of 1 for count exceeding limit by 1', () => {
		expect(computeCommandResultsOverflow(4)).toEqual({ visibleCount: 3, overflowCount: 1 });
	});

	it('returns max visible and correct overflow for large counts', () => {
		expect(computeCommandResultsOverflow(5)).toEqual({ visibleCount: 3, overflowCount: 2 });
		expect(computeCommandResultsOverflow(8)).toEqual({ visibleCount: 3, overflowCount: 5 });
	});

	it('exports MAX_VISIBLE_COMMAND_RESULTS as 3', () => {
		expect(MAX_VISIBLE_COMMAND_RESULTS).toBe(3);
	});
});
