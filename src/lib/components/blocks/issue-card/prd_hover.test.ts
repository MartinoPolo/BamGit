import { describe, it, expect } from 'vitest';
import { getHoveredPrdNumber, setHoveredPrdNumber } from './prd_hover_store.svelte.js';

describe('prd_hover_store', () => {
	it('returns null initially', () => {
		setHoveredPrdNumber(null);
		expect(getHoveredPrdNumber()).toBeNull();
	});

	it('returns the set PRD number after setHoveredPrdNumber', () => {
		setHoveredPrdNumber(42);
		expect(getHoveredPrdNumber()).toBe(42);
	});

	it('clears hovered PRD when set to null', () => {
		setHoveredPrdNumber(42);
		setHoveredPrdNumber(null);
		expect(getHoveredPrdNumber()).toBeNull();
	});

	it('overwrites previous PRD number with new value', () => {
		setHoveredPrdNumber(10);
		setHoveredPrdNumber(20);
		expect(getHoveredPrdNumber()).toBe(20);
	});
});
