import type { TreeStage, PottedPlantStage } from 'low-poly-2d-trees';

/** @internal Exported for testing only — use `computeVisualization` for production code. */
export const TREE_STAGES = {
	seed: 'seed',
	sprouting: 'sprouting',
	sapling: 'sapling',
	growing: 'growing',
	leafy: 'leafy',
	flowering: 'flowering',
	fruiting: 'fruiting',
	seasonal: 'seasonal',
	wilting: 'wilting',
	bare: 'bare',
	dead: 'dead',
	stump: 'stump',
} as const satisfies Record<string, TreeStage>;

/** @internal Exported for testing only — use `computeVisualization` for production code. */
export const POTTED_PLANT_STAGES = {
	potWithSoil: 'pot-with-soil',
	sprout: 'sprout',
	smallPlant: 'small-plant',
	flowering: 'flowering',
	dried: 'dried',
} as const satisfies Record<string, PottedPlantStage>;

/** @internal Exported for testing only — use `computeVisualization` for production code. */
export const TOOL_TYPES = {
	shovel: 'shovel',
	wateringCan: 'wateringCan',
	ladder: 'ladder',
	axe: 'axe',
	rake: 'rake',
	woodpecker: 'woodpecker',
	grill: 'grill',
	speechBubble: 'speechBubble',
	stormCloud: 'stormCloud',
	lantern: 'lantern',
	pruningShears: 'pruningShears',
	mushrooms: 'mushrooms',
} as const;

/** @internal Exported for testing only. */
export const GLOW_COLORS = {
	red: '#ff4444',
	orange: '#ff8c00',
	green: '#22c55e',
	yellow: '#ffd700',
	blue: '#4a9eff',
} as const;

/** @internal Exported for testing only. */
export const SPEECH_BUBBLE_COLORS = {
	red: '#ff4444',
	orange: '#ff8c00',
} as const;

/** Sub-agent category to bird type mapping (REQ-6). Rendering deferred to library enhancement. */
export const BIRD_TYPE_MAP = {
	analysis: 'owl',
	executor: 'robin',
	checker: 'sparrow',
	reviewer: 'cardinal',
	utility: 'hummingbird',
	research: 'parrot',
} as const;

/** Minimum pixel distance between any two positioned items. */
export const MIN_SPACING_PX = 60;

// ─── Row-Based Layout Constants ─────────────────────────────────────────────

/** Maximum number of depth rows rendered. Items deeper than this are clamped. */
export const MAX_DEPTH_ROWS = 10;

/** Horizontal spacing between trees in the same row, as fraction of viewport width. */
export const TREE_SPACING_FRACTION = 0.08;

/** Y-offset per depth row (moving up toward horizon), as fraction of viewport height. */
export const ROW_SPACING_Y_FRACTION = 0.08;

/** Scale multiplier applied per depth row (cumulative). Row 0 = 1.0, row 1 = 0.78, etc. */
export const ROW_SCALE_FACTOR = 0.78;

/** Opacity multiplier applied per depth row (cumulative). Row 0 = 1.0, row 1 = 0.7, etc. */
export const ROW_OPACITY_FACTOR = 0.7;

/** X-offset per depth row so back-row trees aren't hidden behind front row, as fraction of tree spacing. */
export const ROW_X_OFFSET_FRACTION = 0.35;

/** Fraction of viewport height where the ground line sits (front row base). */
export const GROUND_Y_FRACTION = 0.82;

/** Fraction of viewport height for the ground strip height. */
export const GROUND_STRIP_HEIGHT_FRACTION = 0.08;
