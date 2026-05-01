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
	TREE_SPACING_FRACTION,
	ROW_SPACING_Y_FRACTION,
	ROW_SCALE_FACTOR,
	ROW_OPACITY_FACTOR,
	ROW_X_OFFSET_FRACTION,
	GROUND_Y_FRACTION,
} from './constants.js';

// ─── Constants ──────────────────────────────────────────────────────────────

const Z_OAK = 100;
const Z_ROW_BASE = 50;
const Z_ROW_STEP = 5;
const MAX_RELAXATION_PASSES = 10;

// ─── Internal Types ─────────────────────────────────────────────────────────

type IssuePriority = ForestLayoutItem['priority'];

// ─── Priority Sorting ───────────────────────────────────────────────────────

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

/**
 * Compute the x-position for an item using left-right alternation from a row center.
 * Index 0 -> left (1 unit), index 1 -> right (1 unit),
 * index 2 -> left (2 units), index 3 -> right (2 units), etc.
 */
function computeAlternatingX(itemIndex: number, rowCenterX: number, treeSpacing: number): number {
	const spacingUnits = Math.ceil((itemIndex + 1) / 2);
	const isLeft = itemIndex % 2 === 0;
	if (isLeft) {
		return rowCenterX - spacingUnits * treeSpacing;
	}
	return rowCenterX + spacingUnits * treeSpacing;
}

function placeRowItems(
	items: readonly ForestLayoutItem[],
	depthRow: number,
	viewportCenterX: number,
	groundY: number,
	treeSpacing: number,
	viewportHeight: number,
): PositionedForestItem[] {
	const rowCenterX = viewportCenterX + depthRow * treeSpacing * ROW_X_OFFSET_FRACTION;
	const rowY = groundY - depthRow * viewportHeight * ROW_SPACING_Y_FRACTION;
	const scale = ROW_SCALE_FACTOR ** depthRow;
	const opacity = ROW_OPACITY_FACTOR ** depthRow;
	const zIndex = Z_ROW_BASE - depthRow * Z_ROW_STEP;

	return items.map((item, index) => ({
		id: item.id,
		x: computeAlternatingX(index, rowCenterX, treeSpacing),
		y: rowY,
		scale,
		opacity,
		zIndex,
		rowIndex: depthRow,
	}));
}

// ─── Collision Avoidance ────────────────────────────────────────────────────

// fallow-ignore-next-line complexity
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
	const treeSpacing = viewport.width * TREE_SPACING_FRACTION;

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
			centerX,
			groundY,
			treeSpacing,
			viewport.height,
		);
		allPositioned.push(...positioned);
	}

	// Apply collision avoidance
	const resolved = enforceMinimumSpacing(allPositioned, centerX, groundY);

	// Find oak in resolved results
	const resolvedOak = oak ? (resolved.find((item) => item.id === oak!.id) ?? null) : null;

	return {
		items: resolved,
		oakPosition: resolvedOak,
		groundY,
	};
}
