import { describe, it, expect } from 'vitest';
import { compute_attachment_points } from './attachment_points';
import type { TreeStage } from '$lib/types/tree_visualization';
import { CROWN_ZONE_END, GROUND_ZONE_START, VIEWBOX_WIDTH } from './types';

const ALL_STAGES: TreeStage[] = [
	'seed',
	'sprouting',
	'sapling',
	'growing',
	'leafy',
	'fruiting',
	'autumn',
	'ready',
	'bare',
	'dead',
	'stump',
];

describe('compute_attachment_points', () => {
	it('returns valid points for all 11 stages', () => {
		for (const stage of ALL_STAGES) {
			const points = compute_attachment_points(stage);
			expect(points.crown).toBeDefined();
			expect(points.trunkBase).toBeDefined();
			expect(points.roots).toBeDefined();
		}
	});

	it('crown point x is within viewBox width', () => {
		for (const stage of ALL_STAGES) {
			const points = compute_attachment_points(stage);
			expect(points.crown.x).toBeGreaterThanOrEqual(0);
			expect(points.crown.x).toBeLessThanOrEqual(VIEWBOX_WIDTH);
		}
	});

	it('crown point y is within crown zone (y <= 50) for full-sized trees', () => {
		const full_tree_stages: TreeStage[] = [
			'sapling',
			'growing',
			'leafy',
			'fruiting',
			'autumn',
			'ready',
			'bare',
		];
		for (const stage of full_tree_stages) {
			const points = compute_attachment_points(stage);
			expect(points.crown.y).toBeLessThanOrEqual(CROWN_ZONE_END);
		}
	});

	it('trunkBase point y is near trunk-ground boundary (~110)', () => {
		for (const stage of ALL_STAGES) {
			const points = compute_attachment_points(stage);
			expect(points.trunkBase.y).toBeGreaterThanOrEqual(GROUND_ZONE_START - 10);
			expect(points.trunkBase.y).toBeLessThanOrEqual(GROUND_ZONE_START + 20);
		}
	});

	it('roots point y is in ground zone (y >= 110)', () => {
		for (const stage of ALL_STAGES) {
			const points = compute_attachment_points(stage);
			expect(points.roots.y).toBeGreaterThanOrEqual(GROUND_ZONE_START);
		}
	});

	it('seed/stump crown y is higher than ground (not at top)', () => {
		const low_stages: TreeStage[] = ['seed', 'stump'];
		for (const stage of low_stages) {
			const points = compute_attachment_points(stage);
			// These are low trees, crown should be below the full crown zone
			expect(points.crown.y).toBeGreaterThan(CROWN_ZONE_END);
		}
	});
});
