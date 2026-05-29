import type {
	ForestLayoutItem,
	ForestLayoutItemOak,
	PositionedForestItem,
	Viewport,
	ForestLayoutResult,
} from './types.js';
import {
	MIN_SPACING_PX,
	MAX_DEPTH_ROWS,
	MAX_LAYOUT_WIDTH_PX,
	TREE_SPACING_FRACTION,
	BASE_ROW_GAP_FRACTION,
	ROW_GAP_PERSPECTIVE_FACTOR,
	ROW_SCALE_FACTOR,
	ROW_OPACITY_FACTOR,
	ROW_X_OFFSET_FRACTION,
	GROUND_Y_FRACTION,
} from './constants.js';
import { priorityRank } from '$lib/modules/issues/priority.js';

// ─── Constants ──────────────────────────────────────────────────────────────

const Z_OAK = 100;
const Z_ROW_BASE = 50;
const Z_ROW_STEP = 5;
const MAX_RELAXATION_PASSES = 10;

function sortByPriorityThenOrder(items: readonly ForestLayoutItem[]): ForestLayoutItem[] {
	return [...items].sort((a, b) => {
		const priorityDiff = priorityRank(a.priority) - priorityRank(b.priority);
		if (priorityDiff !== 0) {
			return priorityDiff;
		}
		return a.sortOrder - b.sortOrder;
	});
}

// ─── Classification ─────────────────────────────────────────────────────────

function isOak(item: ForestLayoutItem): item is ForestLayoutItemOak {
	return item.kind === 'oak';
}

function getDepthRow(item: ForestLayoutItem): number {
	if (item.kind === 'oak') {
		return 0;
	}
	return Math.min(item.depthRow, MAX_DEPTH_ROWS - 1);
}

// ─── Row Placement ──────────────────────────────────────────────────────────

function computeEffectiveWidth(viewportWidth: number): number {
	return Math.min(viewportWidth, MAX_LAYOUT_WIDTH_PX);
}

function computeLayoutOffsetX(viewportWidth: number): number {
	return (viewportWidth - computeEffectiveWidth(viewportWidth)) / 2;
}

function computeRowY(depthRow: number, groundY: number, viewportHeight: number): number {
	if (depthRow === 0) {
		return groundY;
	}
	const baseGap = viewportHeight * BASE_ROW_GAP_FRACTION;
	const cumulativeGap =
		(baseGap * (1 - ROW_GAP_PERSPECTIVE_FACTOR ** depthRow)) / (1 - ROW_GAP_PERSPECTIVE_FACTOR);
	return groundY - cumulativeGap;
}

function computeEquidistantX(
	itemIndex: number,
	itemCount: number,
	effectiveWidth: number,
	layoutOffsetX: number,
	rowOffsetX: number,
): number {
	return layoutOffsetX + rowOffsetX + (effectiveWidth * (itemIndex + 1)) / (itemCount + 1);
}

function placeRowItems(
	items: readonly ForestLayoutItem[],
	depthRow: number,
	groundY: number,
	viewportWidth: number,
	viewportHeight: number,
): PositionedForestItem[] {
	const effectiveWidth = computeEffectiveWidth(viewportWidth);
	const layoutOffsetX = computeLayoutOffsetX(viewportWidth);
	const rowOffsetX = depthRow * effectiveWidth * TREE_SPACING_FRACTION * ROW_X_OFFSET_FRACTION;
	const rowY = computeRowY(depthRow, groundY, viewportHeight);
	const scale = ROW_SCALE_FACTOR ** depthRow;
	const opacity = ROW_OPACITY_FACTOR ** depthRow;
	const zIndex = Z_ROW_BASE - depthRow * Z_ROW_STEP;

	return items.map((item, index) => ({
		id: item.id,
		x: computeEquidistantX(index, items.length, effectiveWidth, layoutOffsetX, rowOffsetX),
		y: rowY,
		scale,
		opacity,
		zIndex,
		rowIndex: depthRow,
	}));
}

// ─── Collision Avoidance ────────────────────────────────────────────────────

function enforceMinimumSpacing(items: PositionedForestItem[]): PositionedForestItem[] {
	const positions = items.map((item) => ({ ...item }));

	for (let pass = 0; pass < MAX_RELAXATION_PASSES; pass++) {
		let adjusted = false;
		for (let i = 0; i < positions.length; i++) {
			for (let j = i + 1; j < positions.length; j++) {
				const dx = positions[j].x - positions[i].x;
				const absDx = Math.abs(dx);

				if (absDx < MIN_SPACING_PX) {
					const xOverlap = absDx > 0 ? (MIN_SPACING_PX - absDx) / 2 : MIN_SPACING_PX / 2;
					const direction = dx >= 0 ? 1 : -1;
					positions[i] = { ...positions[i], x: positions[i].x - direction * xOverlap };
					positions[j] = { ...positions[j], x: positions[j].x + direction * xOverlap };
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

// ─── Layout Engine ──────────────────────────────────────────────────────────

// fallow-ignore-next-line complexity
export function computeForestLayout(
	items: readonly ForestLayoutItem[],
	viewport: Viewport,
): ForestLayoutResult {
	const groundY = viewport.height * GROUND_Y_FRACTION;

	if (items.length === 0) {
		return { items: [], oakPosition: null, groundY };
	}

	const centerX = viewport.width / 2;

	// Separate oak from the rest
	let oak: ForestLayoutItemOak | null = null;
	const nonOakItems: ForestLayoutItem[] = [];

	for (const item of items) {
		if (isOak(item)) {
			oak = item;
		} else {
			nonOakItems.push(item);
		}
	}

	// Place oak
	let oakPositioned: PositionedForestItem | null = null;
	if (oak) {
		oakPositioned = {
			id: oak.id,
			x: centerX,
			y: groundY,
			scale: 1.0,
			opacity: 1.0,
			zIndex: Z_OAK,
			rowIndex: 0,
		};
	}

	// Group non-oak items by depthRow (clamped)
	const rowGroups = new Map<number, ForestLayoutItem[]>();
	for (const item of nonOakItems) {
		const row = getDepthRow(item);
		const group = rowGroups.get(row);
		if (group) {
			group.push(item);
		} else {
			rowGroups.set(row, [item]);
		}
	}

	// Sort each row by priority then sortOrder
	for (const [row, group] of rowGroups) {
		rowGroups.set(row, sortByPriorityThenOrder(group));
	}

	// Place items row by row
	const allPositioned: PositionedForestItem[] = [];

	if (oakPositioned) {
		allPositioned.push(oakPositioned);
	}

	// Sort row keys for deterministic processing
	const sortedRows = [...rowGroups.keys()].sort((a, b) => a - b);

	for (const depthRow of sortedRows) {
		const rowItems = rowGroups.get(depthRow)!;
		const positioned = placeRowItems(
			rowItems,
			depthRow,
			groundY,
			viewport.width,
			viewport.height,
		);
		allPositioned.push(...positioned);
	}

	// Apply collision avoidance
	const resolved = enforceMinimumSpacing(allPositioned);

	// Find oak in resolved results
	const resolvedOak = oak ? (resolved.find((item) => item.id === oak!.id) ?? null) : null;

	return {
		items: resolved,
		oakPosition: resolvedOak,
		groundY,
	};
}
