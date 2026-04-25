import { describe, it, expect } from 'vitest';
import {
	computeForestLayout,
	type ForestLayoutItem,
	type ForestLayoutItemOak,
	type ForestLayoutItemTree,
	type ForestLayoutItemPottedPlant,
	type Viewport,
	type PositionedForestItem,
	MIN_SPACING_PX,
} from './forest_layout';

// ─── Factories ──────────────────────────────────────────────────────────

function createViewport(overrides: Partial<Viewport> = {}): Viewport {
	return { width: 1200, height: 800, ...overrides };
}

function createOak(
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

function createTree(
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

function createStump(
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

function createPottedPlant(
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

function findItem(items: readonly PositionedForestItem[], id: string): PositionedForestItem {
	const found = items.find((item) => item.id === id);
	if (!found) {
		throw new Error(`Item ${id} not found in layout result`);
	}
	return found;
}

function euclideanDistance(a: PositionedForestItem, b: PositionedForestItem): number {
	return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}

// ─── Empty Input ────────────────────────────────────────────────────────

describe('computeForestLayout — empty input', () => {
	it('returns empty result for no items', () => {
		const result = computeForestLayout([], createViewport());
		expect(result.items).toEqual([]);
		expect(result.oakPosition).toBeNull();
	});
});

// ─── Oak Placement ──────────────────────────────────────────────────────

describe('computeForestLayout — oak placement', () => {
	it('positions oak at center-top of viewport', () => {
		const viewport = createViewport({ width: 1200, height: 800 });
		const result = computeForestLayout([createOak()], viewport);

		expect(result.oakPosition).not.toBeNull();
		const oak = result.oakPosition!;
		expect(oak.x).toBeCloseTo(600, 0); // center x
		expect(oak.y).toBeLessThan(800 * 0.25); // top 25%
		expect(oak.scale).toBe(1.0);
		expect(oak.opacity).toBe(1.0);
	});

	it('returns null oakPosition when no oak provided', () => {
		const result = computeForestLayout([createTree('t1'), createTree('t2')], createViewport());
		expect(result.oakPosition).toBeNull();
	});

	it('includes oak in items array', () => {
		const result = computeForestLayout([createOak()], createViewport());
		expect(result.items).toHaveLength(1);
		expect(result.items[0].id).toBe('oak-1');
	});
});

// ─── Tree Semicircle Arrangement ────────────────────────────────────────

describe('computeForestLayout — tree semicircle', () => {
	it('distributes trees with y below oak position', () => {
		const oak = createOak();
		const trees = Array.from({ length: 5 }, (_, i) => createTree(`t${i}`));
		const viewport = createViewport();
		const result = computeForestLayout([oak, ...trees], viewport);

		const oakPos = result.oakPosition!;
		for (const tree of trees) {
			const pos = findItem(result.items, tree.id);
			expect(pos.y).toBeGreaterThan(oakPos.y);
		}
	});

	it('distributes trees symmetrically around center x', () => {
		const trees = Array.from({ length: 4 }, (_, i) => createTree(`t${i}`));
		const viewport = createViewport({ width: 1000, height: 800 });
		const result = computeForestLayout(trees, viewport);

		const centerX = 500;
		const positions = trees.map((t) => findItem(result.items, t.id));
		const leftCount = positions.filter((p) => p.x < centerX).length;
		const rightCount = positions.filter((p) => p.x > centerX).length;
		// Even count should split evenly
		expect(leftCount).toBe(rightCount);
	});

	it('places single tree centered in tree zone', () => {
		const viewport = createViewport({ width: 1000, height: 800 });
		const result = computeForestLayout([createTree('solo')], viewport);

		const pos = findItem(result.items, 'solo');
		expect(pos.x).toBeCloseTo(500, 0);
	});

	it('orders trees by priority then sort_order — higher priority closer to center', () => {
		const items: ForestLayoutItem[] = [
			createOak(),
			createTree('low', { priority: 'low', sortOrder: 0 }),
			createTree('top', { priority: 'top', sortOrder: 0 }),
			createTree('med', { priority: 'medium', sortOrder: 0 }),
			createTree('high', { priority: 'high', sortOrder: 0 }),
		];
		const viewport = createViewport();
		const result = computeForestLayout(items, viewport);

		const oakPos = result.oakPosition!;
		const topPos = findItem(result.items, 'top');
		const lowPos = findItem(result.items, 'low');

		// Higher-priority tree should be in inner ring (closer to oak center)
		const topDistance = euclideanDistance(topPos, oakPos);
		const lowDistance = euclideanDistance(lowPos, oakPos);
		expect(topDistance).toBeLessThan(lowDistance);
	});
});

// ─── Stump Placement ───────────────────────────────────────────────────

describe('computeForestLayout — stumps', () => {
	it('places stumps with reduced opacity', () => {
		const items = [createOak(), createStump('s1'), createTree('t1')];
		const result = computeForestLayout(items, createViewport());

		const stump = findItem(result.items, 's1');
		expect(stump.opacity).toBeLessThanOrEqual(0.5);
	});

	it('places stumps at periphery — further from center than trees', () => {
		const items = [createOak(), createTree('t1'), createTree('t2'), createStump('s1')];
		const viewport = createViewport();
		const result = computeForestLayout(items, viewport);

		const oakPos = result.oakPosition!;
		const treeDistances = ['t1', 't2'].map((id) =>
			euclideanDistance(findItem(result.items, id), oakPos),
		);
		const stumpDistance = euclideanDistance(findItem(result.items, 's1'), oakPos);
		const maxTreeDistance = Math.max(...treeDistances);
		expect(stumpDistance).toBeGreaterThanOrEqual(maxTreeDistance);
	});

	it('gives stumps reduced scale', () => {
		const result = computeForestLayout([createStump('s1')], createViewport());
		const stump = findItem(result.items, 's1');
		expect(stump.scale).toBeLessThanOrEqual(0.6);
	});
});

// ─── Potted Plants Shelf ────────────────────────────────────────────────

describe('computeForestLayout — potted plants', () => {
	it('positions potted plants on bottom shelf strip', () => {
		const viewport = createViewport({ height: 800 });
		const plants = [createPottedPlant('p1'), createPottedPlant('p2')];
		const result = computeForestLayout(plants, viewport);

		for (const plant of plants) {
			const pos = findItem(result.items, plant.id);
			expect(pos.y).toBeGreaterThanOrEqual(viewport.height * 0.8);
		}
	});

	it('distributes potted plants horizontally across shelf', () => {
		const viewport = createViewport({ width: 1000 });
		const plants = Array.from({ length: 3 }, (_, i) => createPottedPlant(`p${i}`));
		const result = computeForestLayout(plants, viewport);

		const positions = plants.map((p) => findItem(result.items, p.id));
		const xValues = positions.map((p) => p.x).sort((a, b) => a - b);

		// Should be spread out, not stacked
		for (let i = 1; i < xValues.length; i++) {
			expect(xValues[i] - xValues[i - 1]).toBeGreaterThan(0);
		}
	});

	it('exposes shelfY coordinate', () => {
		const viewport = createViewport({ height: 800 });
		const result = computeForestLayout([createPottedPlant('p1')], viewport);
		expect(result.shelfY).toBeGreaterThanOrEqual(viewport.height * 0.8);
	});
});

// ─── Minimum Spacing ────────────────────────────────────────────────────

describe('computeForestLayout — minimum spacing', () => {
	it('enforces minimum spacing between all items', () => {
		const items: ForestLayoutItem[] = [
			createOak(),
			...Array.from({ length: 15 }, (_, i) => createTree(`t${i}`)),
		];
		const viewport = createViewport({ width: 800, height: 600 });
		const result = computeForestLayout(items, viewport);

		for (let i = 0; i < result.items.length; i++) {
			for (let j = i + 1; j < result.items.length; j++) {
				const distance = euclideanDistance(result.items[i], result.items[j]);
				expect(distance).toBeGreaterThanOrEqual(MIN_SPACING_PX * 0.9); // 10% tolerance
			}
		}
	});
});

// ─── Viewport Responsiveness ────────────────────────────────────────────

describe('computeForestLayout — viewport responsiveness', () => {
	it('produces different positions for different viewport sizes', () => {
		const items = [createOak(), createTree('t1'), createTree('t2')];
		const small = computeForestLayout(items, createViewport({ width: 600, height: 400 }));
		const large = computeForestLayout(items, createViewport({ width: 1600, height: 1000 }));

		const smallOak = small.oakPosition!;
		const largeOak = large.oakPosition!;
		expect(smallOak.x).not.toBeCloseTo(largeOak.x, 0);
	});

	it('scales positions proportionally to viewport', () => {
		const items = [createOak(), createTree('t1')];
		const v1 = createViewport({ width: 1000, height: 800 });
		const v2 = createViewport({ width: 2000, height: 1600 });

		const r1 = computeForestLayout(items, v1);
		const r2 = computeForestLayout(items, v2);

		// Positions should roughly double
		const oak1 = r1.oakPosition!;
		const oak2 = r2.oakPosition!;
		expect(oak2.x / oak1.x).toBeCloseTo(2.0, 0);
		expect(oak2.y / oak1.y).toBeCloseTo(2.0, 0);
	});
});

// ─── Many Trees Overflow ────────────────────────────────────────────────

describe('computeForestLayout — large item counts', () => {
	it('handles 30+ trees without crashing', () => {
		const items: ForestLayoutItem[] = [
			createOak(),
			...Array.from({ length: 35 }, (_, i) => createTree(`t${i}`)),
		];
		const result = computeForestLayout(items, createViewport());
		expect(result.items).toHaveLength(36);
	});
});

// ─── Mixed Kinds ────────────────────────────────────────────────────────

describe('computeForestLayout — mixed kinds', () => {
	it('correctly zones all kinds simultaneously', () => {
		const viewport = createViewport({ width: 1200, height: 800 });
		const items: ForestLayoutItem[] = [
			createOak(),
			createTree('t1'),
			createTree('t2'),
			createStump('s1'),
			createPottedPlant('p1'),
			createPottedPlant('p2'),
		];
		const result = computeForestLayout(items, viewport);

		expect(result.items).toHaveLength(6);
		expect(result.oakPosition).not.toBeNull();

		const oak = result.oakPosition!;
		const t1 = findItem(result.items, 't1');
		const s1 = findItem(result.items, 's1');
		const p1 = findItem(result.items, 'p1');

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

describe('computeForestLayout — zIndex', () => {
	it('gives oak the highest zIndex', () => {
		const items = [createOak(), createTree('t1'), createPottedPlant('p1')];
		const result = computeForestLayout(items, createViewport());

		const oak = result.oakPosition!;
		for (const item of result.items) {
			if (item.id !== oak.id) {
				expect(oak.zIndex).toBeGreaterThanOrEqual(item.zIndex);
			}
		}
	});

	it('gives stumps the lowest zIndex', () => {
		const items = [createTree('t1'), createStump('s1'), createPottedPlant('p1')];
		const result = computeForestLayout(items, createViewport());

		const stump = findItem(result.items, 's1');
		const tree = findItem(result.items, 't1');
		expect(stump.zIndex).toBeLessThan(tree.zIndex);
	});
});
