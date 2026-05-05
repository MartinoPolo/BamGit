import { describe, it, expect } from 'vitest';
import {
	computeRangeSelection,
	computeSelectAllCheckboxState,
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
			'selected',
			'selectionReady',
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
});

describe('BATCH_SELECTED_GLOW_COLOR', () => {
	it('is a hex color string', () => {
		expect(BATCH_SELECTED_GLOW_COLOR).toMatch(/^#[0-9a-fA-F]{6}$/);
	});

	it('equals #ec4899', () => {
		expect(BATCH_SELECTED_GLOW_COLOR).toBe('#ec4899');
	});
});
