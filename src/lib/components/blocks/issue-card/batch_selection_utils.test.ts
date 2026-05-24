import { describe, it, expect } from 'vitest';
import {
	computeRangeSelection,
	computeMergedBatchSelection,
	ISSUE_CARD_STATES,
	BATCH_SELECTED_GLOW_COLOR,
} from './batch_selection_utils.js';

describe('computeRangeSelection', () => {
	it('returns IDs between anchor and target inclusive when anchor comes first', () => {
		const flatOrder = ['a', 'b', 'c', 'd', 'e'];
		expect(computeRangeSelection('b', 'd', flatOrder)).toEqual(['b', 'c', 'd']);
	});

	it('returns IDs between target and anchor inclusive when anchor comes after target', () => {
		const flatOrder = ['a', 'b', 'c', 'd', 'e'];
		expect(computeRangeSelection('d', 'b', flatOrder)).toEqual(['b', 'c', 'd']);
	});

	it('returns single-element array when anchor equals target', () => {
		const flatOrder = ['a', 'b', 'c'];
		expect(computeRangeSelection('b', 'b', flatOrder)).toEqual(['b']);
	});

	it('returns [targetId] when anchor is not in flatOrder', () => {
		const flatOrder = ['a', 'b', 'c'];
		expect(computeRangeSelection('z', 'b', flatOrder)).toEqual(['b']);
	});

	it('returns [targetId] when target is not in flatOrder', () => {
		const flatOrder = ['a', 'b', 'c'];
		expect(computeRangeSelection('a', 'z', flatOrder)).toEqual(['z']);
	});

	it('returns [targetId] when neither ID is in flatOrder', () => {
		const flatOrder = ['a', 'b', 'c'];
		expect(computeRangeSelection('x', 'z', flatOrder)).toEqual(['z']);
	});

	it('returns [targetId] when flatOrder is empty', () => {
		expect(computeRangeSelection('a', 'b', [])).toEqual(['b']);
	});

	it('returns full range when anchor is first and target is last', () => {
		const flatOrder = ['a', 'b', 'c'];
		expect(computeRangeSelection('a', 'c', flatOrder)).toEqual(['a', 'b', 'c']);
	});

	it('returns full range when anchor is last and target is first', () => {
		const flatOrder = ['a', 'b', 'c'];
		expect(computeRangeSelection('c', 'a', flatOrder)).toEqual(['a', 'b', 'c']);
	});
});

describe('ISSUE_CARD_STATES', () => {
	it('has all expected state keys', () => {
		const expectedKeys = [
			'ghost',
			'active',
			'hovered',
			'selectionHover',
			'selected',
			'archived',
			'worktreeSetup',
			'interactive',
		];
		expect(Object.keys(ISSUE_CARD_STATES).sort()).toEqual(expectedKeys.sort());
	});

	it('has non-empty string values for every key', () => {
		for (const value of Object.values(ISSUE_CARD_STATES)) {
			expect(typeof value).toBe('string');
			expect(value.length).toBeGreaterThan(0);
		}
	});
});

describe('BATCH_SELECTED_GLOW_COLOR', () => {
	it('uses --primary CSS variable', () => {
		expect(BATCH_SELECTED_GLOW_COLOR).toBe('var(--primary)');
	});
});
describe('computeMergedBatchSelection', () => {
	const flatOrder = ['a', 'b', 'c', 'd', 'e'];

	it('returns only target when no anchor (first shift-click)', () => {
		const individual = new Set<string>();
		const result = computeMergedBatchSelection(individual, null, 'c', flatOrder);
		expect(result.mergedIds).toEqual(new Set(['c']));
		expect(result.rangeIds).toEqual(new Set(['c']));
	});

	it('computes range from anchor to target and merges with individual selections', () => {
		const individual = new Set(['a', 'e']); // Ctrl+clicked
		const result = computeMergedBatchSelection(individual, 'b', 'd', flatOrder);
		// Range: b,c,d. Individual: a,e. Merged: a,b,c,d,e
		expect(result.mergedIds).toEqual(new Set(['a', 'b', 'c', 'd', 'e']));
		expect(result.rangeIds).toEqual(new Set(['b', 'c', 'd']));
	});

	it('shift-clicking a shorter range removes items outside new range but keeps individuals', () => {
		// First shift-click selected b,c,d,e (range b→e)
		// Now shift-click to c (range b→c). Only b,c in range.
		// Individual: a. Merged: a,b,c
		const individual = new Set(['a']);
		const result = computeMergedBatchSelection(individual, 'b', 'c', flatOrder);
		expect(result.mergedIds).toEqual(new Set(['a', 'b', 'c']));
		expect(result.rangeIds).toEqual(new Set(['b', 'c']));
	});

	it('preserves Ctrl+clicked items even when range shrinks', () => {
		const individual = new Set(['a', 'c']); // Ctrl+clicked
		const result = computeMergedBatchSelection(individual, 'd', 'e', flatOrder);
		// Range: d,e. Individual: a,c. Merged: a,c,d,e
		expect(result.mergedIds).toEqual(new Set(['a', 'c', 'd', 'e']));
		expect(result.rangeIds).toEqual(new Set(['d', 'e']));
	});

	it('handles anchor not in flatOrder gracefully', () => {
		const individual = new Set(['a']);
		const result = computeMergedBatchSelection(individual, 'z', 'c', flatOrder);
		// computeRangeSelection returns ['c'] when anchor not found
		expect(result.mergedIds).toEqual(new Set(['a', 'c']));
		expect(result.rangeIds).toEqual(new Set(['c']));
	});

	it('handles empty individual set with valid range', () => {
		const individual = new Set<string>();
		const result = computeMergedBatchSelection(individual, 'b', 'd', flatOrder);
		expect(result.mergedIds).toEqual(new Set(['b', 'c', 'd']));
		expect(result.rangeIds).toEqual(new Set(['b', 'c', 'd']));
	});
});
