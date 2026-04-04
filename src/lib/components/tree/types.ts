import type { TreeStage, TreeVisualizationTree } from '$lib/types/tree_visualization';

// ─── Geometry ────────────────────────────────────────────────────────────

export interface Point2D {
	readonly x: number;
	readonly y: number;
}

export interface AttachmentPoints {
	readonly crown: Point2D;
	readonly trunkBase: Point2D;
	readonly roots: Point2D;
}

// ─── Color ───────────────────────────────────────────────────────────────

export interface OklchColor {
	readonly lightness: number;
	readonly chroma: number;
	readonly hue: number;
}

export interface AccentColors {
	readonly front: string;
	readonly shadow: string;
	readonly highlight: string;
}

// ─── Component Props ─────────────────────────────────────────────────────

export interface TreeComponentProps {
	readonly visualization: TreeVisualizationTree;
	readonly accentColor: string;
	readonly isDark: boolean;
}

// ─── Stage → Component Group Mapping ─────────────────────────────────────

export type TreeComponentGroup = 'seed-sprout' | 'sapling' | 'mature-tree' | 'dead-tree';

export const STAGE_TO_GROUP: Readonly<Record<TreeStage, TreeComponentGroup>> = {
	seed: 'seed-sprout',
	sprouting: 'seed-sprout',
	sapling: 'sapling',
	growing: 'sapling',
	leafy: 'mature-tree',
	fruiting: 'mature-tree',
	autumn: 'mature-tree',
	ready: 'mature-tree',
	bare: 'dead-tree',
	dead: 'dead-tree',
	stump: 'dead-tree',
};

// ─── ViewBox Constants ───────────────────────────────────────────────────

export const VIEWBOX_WIDTH = 100;
export const VIEWBOX_HEIGHT = 150;
export const CROWN_ZONE_END = 50;
export const TRUNK_ZONE_END = 110;
export const GROUND_ZONE_START = 110;
