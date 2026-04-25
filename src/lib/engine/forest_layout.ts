import type { TreeStage, PottedPlantStage } from '$lib/types/tree_visualization';

type IssuePriority = 'low' | 'medium' | 'high' | 'top' | null;

// ─── Input Types ────────────────────────────────────────────────────────

export interface Viewport {
	readonly width: number;
	readonly height: number;
}

export interface ForestLayoutItemOak {
	readonly id: string;
	readonly kind: 'oak';
	readonly priority: IssuePriority;
	readonly sortOrder: number;
}

export interface ForestLayoutItemTree {
	readonly id: string;
	readonly kind: 'tree';
	readonly stage: TreeStage;
	readonly priority: IssuePriority;
	readonly sortOrder: number;
}

export interface ForestLayoutItemPottedPlant {
	readonly id: string;
	readonly kind: 'potted-plant';
	readonly stage: PottedPlantStage;
	readonly priority: IssuePriority;
	readonly sortOrder: number;
}

export type ForestLayoutItem =
	| ForestLayoutItemOak
	| ForestLayoutItemTree
	| ForestLayoutItemPottedPlant;

// ─── Output Types ───────────────────────────────────────────────────────

export interface PositionedForestItem {
	readonly id: string;
	readonly x: number;
	readonly y: number;
	readonly scale: number;
	readonly opacity: number;
	readonly zIndex: number;
}

export interface ForestLayoutResult {
	readonly items: readonly PositionedForestItem[];
	readonly oakPosition: PositionedForestItem | null;
	readonly shelfY: number;
}

// ─── Constants ──────────────────────────────────────────────────────────

/** Minimum pixel distance between any two positioned items. */
export const MIN_SPACING_PX = 60;

/** Fraction of viewport height where the oak sits. */
const OAK_Y_FRACTION = 0.12;

/** Fraction of viewport height where the shelf strip begins. */
const SHELF_Y_FRACTION = 0.88;

/** Ring radius step as fraction of viewport width. */
const RING_RADIUS_STEP_FRACTION = 0.12;

/** Base ring radius as fraction of viewport width. */
const BASE_RING_RADIUS_FRACTION = 0.15;

/** Scale decay per ring for trees. */
const TREE_SCALE_PER_RING = [0.85, 0.75, 0.65, 0.55, 0.5];

/** Vertical flatten factor for the semicircle arc (1.0 = full circle, <1 = compressed). */
const SEMICIRCLE_VERTICAL_FLATTEN = 0.6;

/** Max iterative passes for collision relaxation. */
const MAX_RELAXATION_PASSES = 10;

/** Vertical offset of tree semicircle center below the oak, as fraction of viewport height. */
const TREE_CENTER_OFFSET_FRACTION = 0.18;

/** Fallback tree center position when oak absent, as fraction of viewport height. */
const TREE_CENTER_NO_OAK_FRACTION = 0.3;

/** Horizontal margin for the shelf strip, as fraction of viewport width. */
const SHELF_MARGIN_FRACTION = 0.1;

const STUMP_OPACITY = 0.4;
const STUMP_SCALE = 0.5;
const POTTED_PLANT_SCALE = 0.6;

// ─── zIndex Layers ──────────────────────────────────────────────────────

const Z_OAK = 100;
const Z_TREE_BASE = 50;
const Z_POTTED_PLANT = 30;
const Z_STUMP = 10;

// ─── Internal Helpers ───────────────────────────────────────────────────

function priorityRank(priority: IssuePriority): number {
	switch (priority) {
		case 'top':
			return 0;
		case 'high':
			return 1;
		case 'medium':
			return 2;
		case 'low':
			return 3;
		case null:
			return 4;
	}
}

function sortByPriorityThenOrder(items: readonly ForestLayoutItem[]): ForestLayoutItem[] {
	return [...items].sort((a, b) => {
		const priorityDiff = priorityRank(a.priority) - priorityRank(b.priority);
		if (priorityDiff !== 0) {
			return priorityDiff;
		}
		return a.sortOrder - b.sortOrder;
	});
}

function isStump(item: ForestLayoutItem): boolean {
	return item.kind === 'tree' && item.stage === 'stump';
}

/** Capacity of ring at given index. Progressive: 3, 5, 7, 9, ... */
function ringCapacityAt(ringIndex: number): number {
	return 3 + ringIndex * 2;
}

/** Count rings required to hold `treeCount` items using the progressive capacity formula. */
function countTreeRings(treeCount: number): number {
	if (treeCount === 0) {
		return 0;
	}
	let ringIndex = 0;
	let remaining = treeCount;
	while (remaining > 0) {
		remaining -= ringCapacityAt(ringIndex);
		ringIndex++;
	}
	return ringIndex;
}

interface ClassifiedItems {
	readonly oak: ForestLayoutItem | null;
	readonly trees: readonly ForestLayoutItem[];
	readonly stumps: readonly ForestLayoutItem[];
	readonly pottedPlants: readonly ForestLayoutItem[];
}

function classifyItems(items: readonly ForestLayoutItem[]): ClassifiedItems {
	let oak: ForestLayoutItem | null = null;
	const trees: ForestLayoutItem[] = [];
	const stumps: ForestLayoutItem[] = [];
	const pottedPlants: ForestLayoutItem[] = [];

	for (const item of items) {
		if (item.kind === 'oak') {
			oak = item;
		} else if (item.kind === 'potted-plant') {
			pottedPlants.push(item);
		} else if (isStump(item)) {
			stumps.push(item);
		} else {
			trees.push(item);
		}
	}

	return { oak, trees: sortByPriorityThenOrder(trees), stumps, pottedPlants };
}

/**
 * Distribute `count` items evenly along a semicircle arc (PI radians, left to right).
 * Returns angles in radians from PI (left) to 0 (right).
 */
function semicircleAngles(count: number): number[] {
	if (count === 1) {
		return [Math.PI / 2]; // center
	}
	const angles: number[] = [];
	for (let i = 0; i < count; i++) {
		angles.push(Math.PI - (i * Math.PI) / (count - 1));
	}
	return angles;
}

/**
 * Place items on concentric semicircle rings below a center point.
 * Returns positioned items with scale/opacity/zIndex.
 */
function placeOnSemicircles(
	items: readonly ForestLayoutItem[],
	centerX: number,
	centerY: number,
	viewportWidth: number,
): PositionedForestItem[] {
	if (items.length === 0) {
		return [];
	}

	const baseRadius = viewportWidth * BASE_RING_RADIUS_FRACTION;
	const radiusStep = viewportWidth * RING_RADIUS_STEP_FRACTION;
	const result: PositionedForestItem[] = [];

	let itemIndex = 0;
	let ringIndex = 0;

	while (itemIndex < items.length) {
		const capacity = Math.min(ringCapacityAt(ringIndex), items.length - itemIndex);
		const ringItems = items.slice(itemIndex, itemIndex + capacity);
		const radius = baseRadius + ringIndex * radiusStep;
		const angles = semicircleAngles(ringItems.length);
		const scale = TREE_SCALE_PER_RING[Math.min(ringIndex, TREE_SCALE_PER_RING.length - 1)];

		for (let i = 0; i < ringItems.length; i++) {
			const angle = angles[i];
			result.push({
				id: ringItems[i].id,
				x: centerX + radius * Math.cos(angle),
				y: centerY + radius * Math.sin(angle) * SEMICIRCLE_VERTICAL_FLATTEN,
				scale,
				opacity: 1.0,
				zIndex: Z_TREE_BASE + (TREE_SCALE_PER_RING.length - ringIndex),
			});
		}

		itemIndex += capacity;
		ringIndex++;
	}

	return result;
}

/**
 * Ensure no two items are closer than MIN_SPACING_PX by nudging outward.
 * Iterative relaxation — bounded by MAX_RELAXATION_PASSES.
 */
function enforceMinimumSpacing(
	items: PositionedForestItem[],
	centerX: number,
	centerY: number,
): PositionedForestItem[] {
	const positions = items.map((item) => ({ ...item }));

	for (let pass = 0; pass < MAX_RELAXATION_PASSES; pass++) {
		let adjusted = false;
		for (let i = 0; i < positions.length; i++) {
			for (let j = i + 1; j < positions.length; j++) {
				const dx = positions[j].x - positions[i].x;
				const dy = positions[j].y - positions[i].y;
				const dist = Math.sqrt(dx * dx + dy * dy);

				if (dist < MIN_SPACING_PX && dist > 0) {
					const overlap = (MIN_SPACING_PX - dist) / 2;
					const nx = dx / dist;
					const ny = dy / dist;

					positions[i] = {
						...positions[i],
						x: positions[i].x - nx * overlap,
						y: positions[i].y - ny * overlap,
					};
					positions[j] = {
						...positions[j],
						x: positions[j].x + nx * overlap,
						y: positions[j].y + ny * overlap,
					};
					adjusted = true;
				} else if (dist === 0) {
					// Coincident points — nudge apart along direction from center
					const angleFromCenter = Math.atan2(
						positions[i].y - centerY,
						positions[i].x - centerX,
					);
					const nudge = MIN_SPACING_PX / 2;
					positions[i] = {
						...positions[i],
						x: positions[i].x - Math.cos(angleFromCenter) * nudge,
						y: positions[i].y - Math.sin(angleFromCenter) * nudge,
					};
					positions[j] = {
						...positions[j],
						x: positions[j].x + Math.cos(angleFromCenter) * nudge,
						y: positions[j].y + Math.sin(angleFromCenter) * nudge,
					};
					adjusted = true;
				}
			}
		}
		if (!adjusted) {
			break;
		}
	}

	return positions;
}

// ─── Layout Engine ──────────────────────────────────────────────────────

export function computeForestLayout(
	items: readonly ForestLayoutItem[],
	viewport: Viewport,
): ForestLayoutResult {
	if (items.length === 0) {
		return { items: [], oakPosition: null, shelfY: viewport.height * SHELF_Y_FRACTION };
	}

	const { oak, trees, stumps, pottedPlants } = classifyItems(items);
	const centerX = viewport.width / 2;
	const shelfY = viewport.height * SHELF_Y_FRACTION;
	const allPositioned: PositionedForestItem[] = [];

	// ── Oak ──────────────────────────────────────────────────────────────
	const oakY = viewport.height * OAK_Y_FRACTION;
	if (oak) {
		allPositioned.push({
			id: oak.id,
			x: centerX,
			y: oakY,
			scale: 1.0,
			opacity: 1.0,
			zIndex: Z_OAK,
		});
	}

	// ── Trees (semicircle rings) ────────────────────────────────────────
	const treeCenterY = oak
		? oakY + viewport.height * TREE_CENTER_OFFSET_FRACTION
		: viewport.height * TREE_CENTER_NO_OAK_FRACTION;
	const treePositions = placeOnSemicircles(trees, centerX, treeCenterY, viewport.width);
	allPositioned.push(...treePositions);

	// ── Stumps (periphery beyond last tree ring) ────────────────────────
	if (stumps.length > 0) {
		const treeRingCount = countTreeRings(trees.length) || 1;
		const baseRadius = viewport.width * BASE_RING_RADIUS_FRACTION;
		const radiusStep = viewport.width * RING_RADIUS_STEP_FRACTION;
		const stumpRadius = baseRadius + (treeRingCount + 0.5) * radiusStep;
		const stumpAngles = semicircleAngles(stumps.length);

		for (let i = 0; i < stumps.length; i++) {
			allPositioned.push({
				id: stumps[i].id,
				x: centerX + stumpRadius * Math.cos(stumpAngles[i]),
				y:
					treeCenterY +
					stumpRadius * Math.sin(stumpAngles[i]) * SEMICIRCLE_VERTICAL_FLATTEN,
				scale: STUMP_SCALE,
				opacity: STUMP_OPACITY,
				zIndex: Z_STUMP,
			});
		}
	}

	// ── Potted Plants (shelf strip) ─────────────────────────────────────
	if (pottedPlants.length > 0) {
		const margin = viewport.width * SHELF_MARGIN_FRACTION;
		const availableWidth = viewport.width - 2 * margin;
		const spacing = pottedPlants.length > 1 ? availableWidth / (pottedPlants.length - 1) : 0;
		const startX = pottedPlants.length > 1 ? margin : centerX;

		for (let i = 0; i < pottedPlants.length; i++) {
			allPositioned.push({
				id: pottedPlants[i].id,
				x: startX + i * spacing,
				y: shelfY,
				scale: POTTED_PLANT_SCALE,
				opacity: 1.0,
				zIndex: Z_POTTED_PLANT,
			});
		}
	}

	// ── Collision resolution ────────────────────────────────────────────
	const resolved = enforceMinimumSpacing(allPositioned, centerX, treeCenterY);
	const resolvedOak = oak ? (resolved.find((item) => item.id === oak.id) ?? null) : null;

	return {
		items: resolved,
		oakPosition: resolvedOak,
		shelfY,
	};
}
