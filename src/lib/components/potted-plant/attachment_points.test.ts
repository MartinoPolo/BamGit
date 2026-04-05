import { describe, it, expect } from 'vitest';
import { compute_potted_plant_attachment_points } from './attachment_points';
import type { PottedPlantStage } from '$lib/types/tree_visualization';
import {
	POTTED_VIEWBOX_WIDTH,
	POTTED_VIEWBOX_HEIGHT,
	POTTED_GROUND_ZONE_START,
	POTTED_PLANT_ZONE_END,
} from './types';

const ALL_STAGES: PottedPlantStage[] = [
	'pot-with-soil',
	'sprout',
	'small-plant',
	'flowering',
	'dried',
];

describe('compute_potted_plant_attachment_points', () => {
	it('returns valid points for all 5 stages', () => {
		for (const stage of ALL_STAGES) {
			const points = compute_potted_plant_attachment_points(stage);
			expect(points.crown).toBeDefined();
			expect(points.trunkBase).toBeDefined();
			expect(points.roots).toBeDefined();
		}
	});

	it('all points x are within viewBox width', () => {
		for (const stage of ALL_STAGES) {
			const points = compute_potted_plant_attachment_points(stage);
			expect(points.crown.x).toBeGreaterThanOrEqual(0);
			expect(points.crown.x).toBeLessThanOrEqual(POTTED_VIEWBOX_WIDTH);
			expect(points.trunkBase.x).toBeGreaterThanOrEqual(0);
			expect(points.trunkBase.x).toBeLessThanOrEqual(POTTED_VIEWBOX_WIDTH);
			expect(points.roots.x).toBeGreaterThanOrEqual(0);
			expect(points.roots.x).toBeLessThanOrEqual(POTTED_VIEWBOX_WIDTH);
		}
	});

	it('all points y are within viewBox height', () => {
		for (const stage of ALL_STAGES) {
			const points = compute_potted_plant_attachment_points(stage);
			expect(points.crown.y).toBeGreaterThanOrEqual(0);
			expect(points.crown.y).toBeLessThanOrEqual(POTTED_VIEWBOX_HEIGHT);
			expect(points.trunkBase.y).toBeGreaterThanOrEqual(0);
			expect(points.trunkBase.y).toBeLessThanOrEqual(POTTED_VIEWBOX_HEIGHT);
			expect(points.roots.y).toBeGreaterThanOrEqual(0);
			expect(points.roots.y).toBeLessThanOrEqual(POTTED_VIEWBOX_HEIGHT);
		}
	});

	it('points x are centered near viewBox midpoint', () => {
		const midX = POTTED_VIEWBOX_WIDTH / 2;
		for (const stage of ALL_STAGES) {
			const points = compute_potted_plant_attachment_points(stage);
			expect(points.crown.x).toBe(midX);
			expect(points.trunkBase.x).toBe(midX);
			expect(points.roots.x).toBe(midX);
		}
	});

	it('crown y rises as plant grows (flowering < small-plant < sprout < pot-with-soil)', () => {
		const soil = compute_potted_plant_attachment_points('pot-with-soil');
		const sprout = compute_potted_plant_attachment_points('sprout');
		const small = compute_potted_plant_attachment_points('small-plant');
		const flowering = compute_potted_plant_attachment_points('flowering');

		// Lower y = higher in SVG coordinate space
		expect(soil.crown.y).toBeGreaterThan(sprout.crown.y);
		expect(sprout.crown.y).toBeGreaterThan(small.crown.y);
		expect(small.crown.y).toBeGreaterThan(flowering.crown.y);
	});

	it('flowering crown is within plant zone (y <= plant zone end)', () => {
		const flowering = compute_potted_plant_attachment_points('flowering');
		expect(flowering.crown.y).toBeLessThanOrEqual(POTTED_PLANT_ZONE_END);
	});

	it('trunkBase is near pot zone for all stages', () => {
		for (const stage of ALL_STAGES) {
			const points = compute_potted_plant_attachment_points(stage);
			expect(points.trunkBase.y).toBeGreaterThanOrEqual(POTTED_GROUND_ZONE_START - 15);
			expect(points.trunkBase.y).toBeLessThanOrEqual(POTTED_GROUND_ZONE_START + 10);
		}
	});

	it('roots are in ground zone (y >= ground zone start)', () => {
		for (const stage of ALL_STAGES) {
			const points = compute_potted_plant_attachment_points(stage);
			expect(points.roots.y).toBeGreaterThanOrEqual(POTTED_GROUND_ZONE_START);
		}
	});

	it('dried crown is higher than pot-with-soil (still has structure)', () => {
		const soil = compute_potted_plant_attachment_points('pot-with-soil');
		const dried = compute_potted_plant_attachment_points('dried');
		expect(dried.crown.y).toBeLessThan(soil.crown.y);
	});
});
