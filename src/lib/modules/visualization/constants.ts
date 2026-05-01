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
