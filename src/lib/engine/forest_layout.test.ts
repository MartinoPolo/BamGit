import { describe, it, expect } from 'vitest';
import {
	compute_forest_layout,
	type ForestLayoutItem,
	type ForestLayoutItemOak,
	type ForestLayoutItemTree,
	type ForestLayoutItemPottedPlant,
	type Viewport,
	type PositionedForestItem,
	MIN_SPACING_PX,
} from './forest_layout';

// ─── Factories ──────────────────────────────────────────────────────────

function create_viewport(overrides: Partial<Viewport> = {}): Viewport {
	return { width: 1200, height: 800, ...overrides };
}

function create_oak(
	overrides: Partial<Omit<ForestLayoutItemOak, 'kind'>> = {},
): ForestLayoutItemOak {
	return {
		id: 'oak-1',
		priority: null,
		sortOrder: 0,
		...overrides,
		kind: 'oak',
	};
}

function create_tree(
	id: string,
	overrides: Partial<Omit<ForestLayoutItemTree, 'kind' | 'id'>> = {},
): ForestLayoutItemTree {
	return {
		id,
		stage: 'leafy',
		priority: 'medium',
		sortOrder: 0,
		...overrides,
		kind: 'tree',
	};
}

function create_stump(
	id: string,
	overrides: Partial<Omit<ForestLayoutItemTree, 'kind' | 'id' | 'stage'>> = {},
): ForestLayoutItemTree {
	return {
		id,
		priority: null,
		sortOrder: 0,
		...overrides,
		kind: 'tree',
		stage: 'stump',
	};
}

function create_potted_plant(
	id: string,
	overrides: Partial<Omit<ForestLayoutItemPottedPlant, 'kind' | 'id'>> = {},
): ForestLayoutItemPottedPlant {
	return {
		id,
		stage: 'small-plant',
		priority: null,
		sortOrder: 0,
		...overrides,
		kind: 'potted-plant',
	};
}

function find_item(items: readonly PositionedForestItem[], id: string): PositionedForestItem {
	const found = items.find((item) => item.id === id);
	if (!found) {
		throw new Error(`Item ${id} not found in layout result`);
	}
	return found;
}

function euclidean_distance(a: PositionedForestItem, b: PositionedForestItem): number {
	return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}

// ─── Empty Input ────────────────────────────────────────────────────────

describe('compute_forest_layout — empty input', () => {
	it('returns empty result for no items', () => {
		const result = compute_forest_layout([], create_viewport());
		expect(result.items).toEqual([]);
		expect(result.oakPosition).toBeNull();
	});
});

// ─── Oak Placement ──────────────────────────────────────────────────────

describe('compute_forest_layout — oak placement', () => {
	it('positions oak at center-top of viewport', () => {
		const viewport = create_viewport({ width: 1200, height: 800 });
		const result = compute_forest_layout([create_oak()], viewport);

		expect(result.oakPosition).not.toBeNull();
		const oak = result.oakPosition!;
		expect(oak.x).toBeCloseTo(600, 0); // center x
		expect(oak.y).toBeLessThan(800 * 0.25); // top 25%
		expect(oak.scale).toBe(1.0);
		expect(oak.opacity).toBe(1.0);
	});

	it('returns null oakPosition when no oak provided', () => {
		const result = compute_forest_layout(
			[create_tree('t1'), create_tree('t2')],
			create_viewport(),
		);
		expect(result.oakPosition).toBeNull();
	});

	it('includes oak in items array', () => {
		const result = compute_forest_layout([create_oak()], create_viewport());
		expect(result.items).toHaveLength(1);
		expect(result.items[0].id).toBe('oak-1');
	});
});

// ─── Tree Semicircle Arrangement ────────────────────────────────────────

describe('compute_forest_layout — tree semicircle', () => {
	it('distributes trees with y below oak position', () => {
		const oak = create_oak();
		const trees = Array.from({ length: 5 }, (_, i) => create_tree(`t${i}`));
		const viewport = create_viewport();
		const result = compute_forest_layout([oak, ...trees], viewport);

		const oak_pos = result.oakPosition!;
		for (const tree of trees) {
			const pos = find_item(result.items, tree.id);
			expect(pos.y).toBeGreaterThan(oak_pos.y);
		}
	});

	it('distributes trees symmetrically around center x', () => {
		const trees = Array.from({ length: 4 }, (_, i) => create_tree(`t${i}`));
		const viewport = create_viewport({ width: 1000, height: 800 });
		const result = compute_forest_layout(trees, viewport);

		const center_x = 500;
		const positions = trees.map((t) => find_item(result.items, t.id));
		const left_count = positions.filter((p) => p.x < center_x).length;
		const right_count = positions.filter((p) => p.x > center_x).length;
		// Even count should split evenly
		expect(left_count).toBe(right_count);
	});

	it('places single tree centered in tree zone', () => {
		const viewport = create_viewport({ width: 1000, height: 800 });
		const result = compute_forest_layout([create_tree('solo')], viewport);

		const pos = find_item(result.items, 'solo');
		expect(pos.x).toBeCloseTo(500, 0);
	});

	it('orders trees by priority then sort_order — higher priority closer to center', () => {
		const items: ForestLayoutItem[] = [
			create_oak(),
			create_tree('low', { priority: 'low', sortOrder: 0 }),
			create_tree('top', { priority: 'top', sortOrder: 0 }),
			create_tree('med', { priority: 'medium', sortOrder: 0 }),
			create_tree('high', { priority: 'high', sortOrder: 0 }),
		];
		const viewport = create_viewport();
		const result = compute_forest_layout(items, viewport);

		const oak_pos = result.oakPosition!;
		const top_pos = find_item(result.items, 'top');
		const low_pos = find_item(result.items, 'low');

		// Higher-priority tree should be in inner ring (closer to oak center)
		const top_distance = euclidean_distance(top_pos, oak_pos);
		const low_distance = euclidean_distance(low_pos, oak_pos);
		expect(top_distance).toBeLessThan(low_distance);
	});
});

// ─── Stump Placement ───────────────────────────────────────────────────

describe('compute_forest_layout — stumps', () => {
	it('places stumps with reduced opacity', () => {
		const items = [create_oak(), create_stump('s1'), create_tree('t1')];
		const result = compute_forest_layout(items, create_viewport());

		const stump = find_item(result.items, 's1');
		expect(stump.opacity).toBeLessThanOrEqual(0.5);
	});

	it('places stumps at periphery — further from center than trees', () => {
		const items = [create_oak(), create_tree('t1'), create_tree('t2'), create_stump('s1')];
		const viewport = create_viewport();
		const result = compute_forest_layout(items, viewport);

		const oak_pos = result.oakPosition!;
		const tree_distances = ['t1', 't2'].map((id) =>
			euclidean_distance(find_item(result.items, id), oak_pos),
		);
		const stump_distance = euclidean_distance(find_item(result.items, 's1'), oak_pos);
		const max_tree_distance = Math.max(...tree_distances);
		expect(stump_distance).toBeGreaterThanOrEqual(max_tree_distance);
	});

	it('gives stumps reduced scale', () => {
		const result = compute_forest_layout([create_stump('s1')], create_viewport());
		const stump = find_item(result.items, 's1');
		expect(stump.scale).toBeLessThanOrEqual(0.6);
	});
});

// ─── Potted Plants Shelf ────────────────────────────────────────────────

describe('compute_forest_layout — potted plants', () => {
	it('positions potted plants on bottom shelf strip', () => {
		const viewport = create_viewport({ height: 800 });
		const plants = [create_potted_plant('p1'), create_potted_plant('p2')];
		const result = compute_forest_layout(plants, viewport);

		for (const plant of plants) {
			const pos = find_item(result.items, plant.id);
			expect(pos.y).toBeGreaterThanOrEqual(viewport.height * 0.8);
		}
	});

	it('distributes potted plants horizontally across shelf', () => {
		const viewport = create_viewport({ width: 1000 });
		const plants = Array.from({ length: 3 }, (_, i) => create_potted_plant(`p${i}`));
		const result = compute_forest_layout(plants, viewport);

		const positions = plants.map((p) => find_item(result.items, p.id));
		const x_values = positions.map((p) => p.x).sort((a, b) => a - b);

		// Should be spread out, not stacked
		for (let i = 1; i < x_values.length; i++) {
			expect(x_values[i] - x_values[i - 1]).toBeGreaterThan(0);
		}
	});

	it('exposes shelfY coordinate', () => {
		const viewport = create_viewport({ height: 800 });
		const result = compute_forest_layout([create_potted_plant('p1')], viewport);
		expect(result.shelfY).toBeGreaterThanOrEqual(viewport.height * 0.8);
	});
});

// ─── Minimum Spacing ────────────────────────────────────────────────────

describe('compute_forest_layout — minimum spacing', () => {
	it('enforces minimum spacing between all items', () => {
		const items: ForestLayoutItem[] = [
			create_oak(),
			...Array.from({ length: 15 }, (_, i) => create_tree(`t${i}`)),
		];
		const viewport = create_viewport({ width: 800, height: 600 });
		const result = compute_forest_layout(items, viewport);

		for (let i = 0; i < result.items.length; i++) {
			for (let j = i + 1; j < result.items.length; j++) {
				const distance = euclidean_distance(result.items[i], result.items[j]);
				expect(distance).toBeGreaterThanOrEqual(MIN_SPACING_PX * 0.9); // 10% tolerance
			}
		}
	});
});

// ─── Viewport Responsiveness ────────────────────────────────────────────

describe('compute_forest_layout — viewport responsiveness', () => {
	it('produces different positions for different viewport sizes', () => {
		const items = [create_oak(), create_tree('t1'), create_tree('t2')];
		const small = compute_forest_layout(items, create_viewport({ width: 600, height: 400 }));
		const large = compute_forest_layout(items, create_viewport({ width: 1600, height: 1000 }));

		const small_oak = small.oakPosition!;
		const large_oak = large.oakPosition!;
		expect(small_oak.x).not.toBeCloseTo(large_oak.x, 0);
	});

	it('scales positions proportionally to viewport', () => {
		const items = [create_oak(), create_tree('t1')];
		const v1 = create_viewport({ width: 1000, height: 800 });
		const v2 = create_viewport({ width: 2000, height: 1600 });

		const r1 = compute_forest_layout(items, v1);
		const r2 = compute_forest_layout(items, v2);

		// Positions should roughly double
		const oak1 = r1.oakPosition!;
		const oak2 = r2.oakPosition!;
		expect(oak2.x / oak1.x).toBeCloseTo(2.0, 0);
		expect(oak2.y / oak1.y).toBeCloseTo(2.0, 0);
	});
});

// ─── Many Trees Overflow ────────────────────────────────────────────────

describe('compute_forest_layout — large item counts', () => {
	it('handles 30+ trees without crashing', () => {
		const items: ForestLayoutItem[] = [
			create_oak(),
			...Array.from({ length: 35 }, (_, i) => create_tree(`t${i}`)),
		];
		const result = compute_forest_layout(items, create_viewport());
		expect(result.items).toHaveLength(36);
	});
});

// ─── Mixed Kinds ────────────────────────────────────────────────────────

describe('compute_forest_layout — mixed kinds', () => {
	it('correctly zones all kinds simultaneously', () => {
		const viewport = create_viewport({ width: 1200, height: 800 });
		const items: ForestLayoutItem[] = [
			create_oak(),
			create_tree('t1'),
			create_tree('t2'),
			create_stump('s1'),
			create_potted_plant('p1'),
			create_potted_plant('p2'),
		];
		const result = compute_forest_layout(items, viewport);

		expect(result.items).toHaveLength(6);
		expect(result.oakPosition).not.toBeNull();

		const oak = result.oakPosition!;
		const t1 = find_item(result.items, 't1');
		const s1 = find_item(result.items, 's1');
		const p1 = find_item(result.items, 'p1');

		// Oak at top
		expect(oak.y).toBeLessThan(t1.y);
		// Trees above shelf
		expect(t1.y).toBeLessThan(result.shelfY);
		// Potted plants at/below shelf
		expect(p1.y).toBeGreaterThanOrEqual(result.shelfY - 10); // small tolerance
		// Stump reduced opacity
		expect(s1.opacity).toBeLessThanOrEqual(0.5);
	});
});

// ─── zIndex Ordering ────────────────────────────────────────────────────

describe('compute_forest_layout — zIndex', () => {
	it('gives oak the highest zIndex', () => {
		const items = [create_oak(), create_tree('t1'), create_potted_plant('p1')];
		const result = compute_forest_layout(items, create_viewport());

		const oak = result.oakPosition!;
		for (const item of result.items) {
			if (item.id !== oak.id) {
				expect(oak.zIndex).toBeGreaterThanOrEqual(item.zIndex);
			}
		}
	});

	it('gives stumps the lowest zIndex', () => {
		const items = [create_tree('t1'), create_stump('s1'), create_potted_plant('p1')];
		const result = compute_forest_layout(items, create_viewport());

		const stump = find_item(result.items, 's1');
		const tree = find_item(result.items, 't1');
		expect(stump.zIndex).toBeLessThan(tree.zIndex);
	});
});
