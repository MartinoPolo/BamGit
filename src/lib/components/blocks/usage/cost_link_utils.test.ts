import { describe, it, expect } from 'vitest';
import { getCostMagnitude, formatCostDisplay } from './cost_link_utils.js';

describe('getCostMagnitude', () => {
	it('returns low for costUsd < 1', () => {
		expect(getCostMagnitude(0.5)).toBe('low');
	});

	it('returns medium for costUsd >= 1 and < 20', () => {
		expect(getCostMagnitude(1)).toBe('medium');
		expect(getCostMagnitude(10)).toBe('medium');
		expect(getCostMagnitude(19.99)).toBe('medium');
	});

	it('returns high for costUsd >= 20', () => {
		expect(getCostMagnitude(20)).toBe('high');
		expect(getCostMagnitude(100)).toBe('high');
	});

	it('returns low for costUsd === 0', () => {
		expect(getCostMagnitude(0)).toBe('low');
	});

	it('returns low for negative values', () => {
		expect(getCostMagnitude(-5)).toBe('low');
		expect(getCostMagnitude(-0.01)).toBe('low');
	});
});

describe('formatCostDisplay', () => {
	it('formats 0 as $0.00', () => {
		expect(formatCostDisplay(0)).toBe('$0.00');
	});

	it('formats 0.1 as $0.10', () => {
		expect(formatCostDisplay(0.1)).toBe('$0.10');
	});

	it('formats 4.5 as $4.50', () => {
		expect(formatCostDisplay(4.5)).toBe('$4.50');
	});

	it('rounds 28.759 to $28.76', () => {
		expect(formatCostDisplay(28.759)).toBe('$28.76');
	});

	it('formats 1234.5 as $1234.50', () => {
		expect(formatCostDisplay(1234.5)).toBe('$1234.50');
	});
});
