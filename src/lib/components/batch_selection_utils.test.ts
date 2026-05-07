import { describe, it, expect } from 'vitest';
import {
	computeRangeSelection,
	computeSelectAllCheckboxState,
	computeMergedBatchSelection,
	CARD_STATE_CLASSES,
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

describe('computeSelectAllCheckboxState', () => {
	it("returns 'all' when selectedCount equals totalCount and totalCount > 0", () => {
		expect(computeSelectAllCheckboxState(5, 5)).toBe('all');
	});

	it("returns 'some' when selectedCount is between 0 and totalCount", () => {
		expect(computeSelectAllCheckboxState(3, 5)).toBe('some');
	});

	it("returns 'some' when selectedCount is 1 out of many", () => {
		expect(computeSelectAllCheckboxState(1, 10)).toBe('some');
	});

	it("returns 'none' when selectedCount is 0", () => {
		expect(computeSelectAllCheckboxState(0, 5)).toBe('none');
	});

	it("returns 'none' when totalCount is 0", () => {
		expect(computeSelectAllCheckboxState(0, 0)).toBe('none');
	});

	it("returns 'all' when both counts are 1", () => {
		expect(computeSelectAllCheckboxState(1, 1)).toBe('all');
	});
});

describe('CARD_STATE_CLASSES', () => {
	it('has all expected state keys', () => {
		const expectedKeys = [
			'active',
			'hovered',
			'selectionHover',
			'selected',
			'dragging',
			'loading',
			'archived',
			'error',
			'disabled',
		];
		expect(Object.keys(CARD_STATE_CLASSES).sort()).toEqual(expectedKeys.sort());
	});

	it('has non-empty string values for every key', () => {
		for (const value of Object.values(CARD_STATE_CLASSES)) {
			expect(typeof value).toBe('string');
			expect(value.length).toBeGreaterThan(0);
		}
	});

	it('active class uses box-shadow CSS class referencing --ic', () => {
		expect(CARD_STATE_CLASSES.active).toBe('card-state-active-ic');
	});

	it('selected class uses box-shadow CSS class referencing --primary', () => {
		expect(CARD_STATE_CLASSES.selected).toBe('card-state-selected-primary');
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
