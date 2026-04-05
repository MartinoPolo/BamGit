import { describe, it, expect } from 'vitest';
import { compute_oak_canopy_layers, compute_oak_crown_peak_y } from './oak_fullness';

describe('compute_oak_canopy_layers', () => {
	it('returns minimum layers (2) at ratio 0', () => {
		expect(compute_oak_canopy_layers(0)).toBe(2);
	});

	it('returns maximum layers (6) at ratio 1', () => {
		expect(compute_oak_canopy_layers(1)).toBe(6);
	});

	it('returns intermediate value at ratio 0.5', () => {
		expect(compute_oak_canopy_layers(0.5)).toBe(4);
	});

	it('clamps ratio below 0 to minimum', () => {
		expect(compute_oak_canopy_layers(-0.5)).toBe(2);
	});

	it('clamps ratio above 1 to maximum', () => {
		expect(compute_oak_canopy_layers(1.5)).toBe(6);
	});

	it('rounds to nearest integer', () => {
		expect(Number.isInteger(compute_oak_canopy_layers(0.33))).toBe(true);
	});
});

describe('compute_oak_crown_peak_y', () => {
	it('returns high y (sparse) at ratio 0', () => {
		expect(compute_oak_crown_peak_y(0)).toBe(30);
	});

	it('returns low y (full) at ratio 1', () => {
		expect(compute_oak_crown_peak_y(1)).toBe(5);
	});

	it('returns intermediate y at ratio 0.5', () => {
		expect(compute_oak_crown_peak_y(0.5)).toBe(17.5);
	});

	it('clamps ratio below 0', () => {
		expect(compute_oak_crown_peak_y(-1)).toBe(30);
	});

	it('clamps ratio above 1', () => {
		expect(compute_oak_crown_peak_y(2)).toBe(5);
	});
});
