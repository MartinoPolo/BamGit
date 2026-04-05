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

function priority_rank(priority: IssuePriority): number {
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

function sort_by_priority_then_order(items: readonly ForestLayoutItem[]): ForestLayoutItem[] {
	return [...items].sort((a, b) => {
		const priority_diff = priority_rank(a.priority) - priority_rank(b.priority);
		if (priority_diff !== 0) {
			return priority_diff;
		}
		return a.sortOrder - b.sortOrder;
	});
}

function is_stump(item: ForestLayoutItem): boolean {
	return item.kind === 'tree' && item.stage === 'stump';
}

/** Capacity of ring at given index. Progressive: 3, 5, 7, 9, ... */
function ring_capacity_at(ring_index: number): number {
	return 3 + ring_index * 2;
}

/** Count rings required to hold `tree_count` items using the progressive capacity formula. */
function count_tree_rings(tree_count: number): number {
	if (tree_count === 0) {
		return 0;
	}
	let ring_index = 0;
	let remaining = tree_count;
	while (remaining > 0) {
		remaining -= ring_capacity_at(ring_index);
		ring_index++;
	}
	return ring_index;
}

interface ClassifiedItems {
	readonly oak: ForestLayoutItem | null;
	readonly trees: readonly ForestLayoutItem[];
	readonly stumps: readonly ForestLayoutItem[];
	readonly potted_plants: readonly ForestLayoutItem[];
}

function classify_items(items: readonly ForestLayoutItem[]): ClassifiedItems {
	let oak: ForestLayoutItem | null = null;
	const trees: ForestLayoutItem[] = [];
	const stumps: ForestLayoutItem[] = [];
	const potted_plants: ForestLayoutItem[] = [];

	for (const item of items) {
		if (item.kind === 'oak') {
			oak = item;
		} else if (item.kind === 'potted-plant') {
			potted_plants.push(item);
		} else if (is_stump(item)) {
			stumps.push(item);
		} else {
			trees.push(item);
		}
	}

	return { oak, trees: sort_by_priority_then_order(trees), stumps, potted_plants };
}

/**
 * Distribute `count` items evenly along a semicircle arc (PI radians, left to right).
 * Returns angles in radians from PI (left) to 0 (right).
 */
function semicircle_angles(count: number): number[] {
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
function place_on_semicircles(
	items: readonly ForestLayoutItem[],
	center_x: number,
	center_y: number,
	viewport_width: number,
): PositionedForestItem[] {
	if (items.length === 0) {
		return [];
	}

	const base_radius = viewport_width * BASE_RING_RADIUS_FRACTION;
	const radius_step = viewport_width * RING_RADIUS_STEP_FRACTION;
	const result: PositionedForestItem[] = [];

	let item_index = 0;
	let ring_index = 0;

	while (item_index < items.length) {
		const capacity = Math.min(ring_capacity_at(ring_index), items.length - item_index);
		const ring_items = items.slice(item_index, item_index + capacity);
		const radius = base_radius + ring_index * radius_step;
		const angles = semicircle_angles(ring_items.length);
		const scale = TREE_SCALE_PER_RING[Math.min(ring_index, TREE_SCALE_PER_RING.length - 1)];

		for (let i = 0; i < ring_items.length; i++) {
			const angle = angles[i];
			result.push({
				id: ring_items[i].id,
				x: center_x + radius * Math.cos(angle),
				y: center_y + radius * Math.sin(angle) * SEMICIRCLE_VERTICAL_FLATTEN,
				scale,
				opacity: 1.0,
				zIndex: Z_TREE_BASE + (TREE_SCALE_PER_RING.length - ring_index),
			});
		}

		item_index += capacity;
		ring_index++;
	}

	return result;
}

/**
 * Ensure no two items are closer than MIN_SPACING_PX by nudging outward.
 * Iterative relaxation — bounded by MAX_RELAXATION_PASSES.
 */
function enforce_minimum_spacing(
	items: PositionedForestItem[],
	center_x: number,
	center_y: number,
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
					const angle_from_center = Math.atan2(
						positions[i].y - center_y,
						positions[i].x - center_x,
					);
					const nudge = MIN_SPACING_PX / 2;
					positions[i] = {
						...positions[i],
						x: positions[i].x - Math.cos(angle_from_center) * nudge,
						y: positions[i].y - Math.sin(angle_from_center) * nudge,
					};
					positions[j] = {
						...positions[j],
						x: positions[j].x + Math.cos(angle_from_center) * nudge,
						y: positions[j].y + Math.sin(angle_from_center) * nudge,
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

export function compute_forest_layout(
	items: readonly ForestLayoutItem[],
	viewport: Viewport,
): ForestLayoutResult {
	if (items.length === 0) {
		return { items: [], oakPosition: null, shelfY: viewport.height * SHELF_Y_FRACTION };
	}

	const { oak, trees, stumps, potted_plants } = classify_items(items);
	const center_x = viewport.width / 2;
	const shelf_y = viewport.height * SHELF_Y_FRACTION;
	const all_positioned: PositionedForestItem[] = [];

	// ── Oak ──────────────────────────────────────────────────────────────
	const oak_y = viewport.height * OAK_Y_FRACTION;
	if (oak) {
		all_positioned.push({
			id: oak.id,
			x: center_x,
			y: oak_y,
			scale: 1.0,
			opacity: 1.0,
			zIndex: Z_OAK,
		});
	}

	// ── Trees (semicircle rings) ────────────────────────────────────────
	const tree_center_y = oak
		? oak_y + viewport.height * TREE_CENTER_OFFSET_FRACTION
		: viewport.height * TREE_CENTER_NO_OAK_FRACTION;
	const tree_positions = place_on_semicircles(trees, center_x, tree_center_y, viewport.width);
	all_positioned.push(...tree_positions);

	// ── Stumps (periphery beyond last tree ring) ────────────────────────
	if (stumps.length > 0) {
		const tree_ring_count = count_tree_rings(trees.length) || 1;
		const base_radius = viewport.width * BASE_RING_RADIUS_FRACTION;
		const radius_step = viewport.width * RING_RADIUS_STEP_FRACTION;
		const stump_radius = base_radius + (tree_ring_count + 0.5) * radius_step;
		const stump_angles = semicircle_angles(stumps.length);

		for (let i = 0; i < stumps.length; i++) {
			all_positioned.push({
				id: stumps[i].id,
				x: center_x + stump_radius * Math.cos(stump_angles[i]),
				y:
					tree_center_y +
					stump_radius * Math.sin(stump_angles[i]) * SEMICIRCLE_VERTICAL_FLATTEN,
				scale: STUMP_SCALE,
				opacity: STUMP_OPACITY,
				zIndex: Z_STUMP,
			});
		}
	}

	// ── Potted Plants (shelf strip) ─────────────────────────────────────
	if (potted_plants.length > 0) {
		const margin = viewport.width * SHELF_MARGIN_FRACTION;
		const available_width = viewport.width - 2 * margin;
		const spacing = potted_plants.length > 1 ? available_width / (potted_plants.length - 1) : 0;
		const start_x = potted_plants.length > 1 ? margin : center_x;

		for (let i = 0; i < potted_plants.length; i++) {
			all_positioned.push({
				id: potted_plants[i].id,
				x: start_x + i * spacing,
				y: shelf_y,
				scale: POTTED_PLANT_SCALE,
				opacity: 1.0,
				zIndex: Z_POTTED_PLANT,
			});
		}
	}

	// ── Collision resolution ────────────────────────────────────────────
	const resolved = enforce_minimum_spacing(all_positioned, center_x, tree_center_y);
	const resolved_oak = oak ? (resolved.find((item) => item.id === oak.id) ?? null) : null;

	return {
		items: resolved,
		oakPosition: resolved_oak,
		shelfY: shelf_y,
	};
}
