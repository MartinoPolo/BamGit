import type {
	TreeShape,
	TreeStage,
	PottedPlantStage,
	FruitType,
	TreeConfig,
	ToolVisibility,
	GlowConfig,
	OverlayConfig,
} from 'low-poly-2d-trees';
import type { Issue } from '$lib/modules/issues/index.js';
import type { GitStatusCache, ExecutionPhase } from '$lib/types/generated';
import type { ToolType } from 'low-poly-2d-trees';
import type {
	LabelShapeMappingEntry,
	StateDimensions,
	TreeVisualizationTree,
	TreeVisualizationPottedPlant,
	TreeVisualizationOak,
	TreeVisualization,
	TreeComputeContext,
	SessionForMapping,
} from './types.js';
import {
	TREE_STAGES,
	POTTED_PLANT_STAGES,
	TOOL_TYPES,
	GLOW_COLORS,
	SPEECH_BUBBLE_COLORS,
	SPECIAL_LABELS,
} from './constants.js';
import { mapIssueToStateDimensions } from './state_mapping.js';

// ─── Library Constants (local mirrors — avoids barrel Svelte import in Node) ─

const TREE_SHAPES = {
	oak: 'oak',
	pine: 'pine',
	birch: 'birch',
	fir: 'fir',
	maple: 'maple',
	willow: 'willow',
	cypress: 'cypress',
	apple: 'apple',
	cherry: 'cherry',
	bush: 'bush',
	baobab: 'baobab',
	acacia: 'acacia',
	custom: 'custom',
} as const satisfies Record<string, TreeShape>;

const OVERLAY_DEFAULTS: OverlayConfig = {
	glow: { enabled: false, color: GLOW_COLORS.yellow, intensity: 3, pulse: false },
} as const;

const SHAPE_FRUIT_MAP: Readonly<Record<Exclude<TreeShape, 'custom'>, FruitType>> = {
	oak: 'acorn',
	birch: 'catkin_birch',
	maple: 'samara',
	pine: 'pine_cone',
	fir: 'fir_cone',
	willow: 'catkin_willow',
	cypress: 'small_cone',
	apple: 'apple',
	cherry: 'cherry_pair',
	bush: 'berry',
	baobab: 'baobab_fruit',
	acacia: 'seed_pod',
} as const;

// ─── GitHub Label -> Tree Shape Mapping ─────────────────────────────────────

const DEFAULT_LABEL_MAPPINGS: readonly LabelShapeMappingEntry[] = [
	{ labelName: 'prd', treeShape: TREE_SHAPES.apple },
	{ labelName: 'epic', treeShape: TREE_SHAPES.baobab },
	{ labelName: 'bug', treeShape: TREE_SHAPES.maple },
	{ labelName: 'feature', treeShape: TREE_SHAPES.oak },
	{ labelName: 'task', treeShape: TREE_SHAPES.pine },
	{ labelName: 'documentation', treeShape: TREE_SHAPES.willow },
	{ labelName: 'refactor', treeShape: TREE_SHAPES.birch },
	{ labelName: 'infrastructure', treeShape: TREE_SHAPES.cypress },
	{ labelName: 'ci', treeShape: TREE_SHAPES.cypress },
];

const DEFAULT_TREE_SHAPE: TreeShape = TREE_SHAPES.cherry;

function resolveTreeShape(
	labels: readonly string[],
	mappings: readonly LabelShapeMappingEntry[] = DEFAULT_LABEL_MAPPINGS,
	defaultShape: TreeShape = DEFAULT_TREE_SHAPE,
): TreeShape {
	for (const mapping of mappings) {
		if (labels.some((label) => label.toLowerCase() === mapping.labelName.toLowerCase())) {
			return mapping.treeShape;
		}
	}
	return defaultShape;
}

// ─── Tool Visibility Factory ─────────────────────────────────────────────────

function createDefaultToolVisibility(): ToolVisibility {
	return {
		[TOOL_TYPES.shovel]: { visible: false, size: 1 },
		[TOOL_TYPES.wateringCan]: { visible: false, size: 1 },
		[TOOL_TYPES.ladder]: { visible: false, size: 1 },
		[TOOL_TYPES.axe]: { visible: false, size: 1 },
		[TOOL_TYPES.rake]: { visible: false, size: 1 },
		[TOOL_TYPES.woodpecker]: { visible: false, size: 1 },
		[TOOL_TYPES.grill]: { visible: false, size: 1 },
		[TOOL_TYPES.speechBubble]: { visible: false, size: 1, text: '' },
		[TOOL_TYPES.stormCloud]: { visible: false, size: 1 },
		[TOOL_TYPES.lantern]: { visible: false, size: 1 },
		[TOOL_TYPES.pruningShears]: { visible: false, size: 1 },
		[TOOL_TYPES.mushrooms]: { visible: false, size: 1 },
	};
}

// ─── Execution Phase -> Tool Mapping ────────────────────────────────────────

type MappedExecutionPhase = Exclude<ExecutionPhase, 'none' | 'reviewing'>;

const EXECUTION_PHASE_TOOL_MAP = {
	analyzing: TOOL_TYPES.lantern,
	tdd: TOOL_TYPES.shovel,
	verifying: TOOL_TYPES.pruningShears,
	committing: TOOL_TYPES.rake,
} as const satisfies Record<MappedExecutionPhase, ToolType>;

// ─── Default Tree Config (subset needed by engine) ───────────────────────────

const DEFAULT_TREE_CONFIG: TreeConfig = {
	stage: TREE_STAGES.leafy,
	shape: TREE_SHAPES.oak,
	seed: 42,
	polygonsPerBlob: 12,
	canopyLightColor: '#a8d84e',
	canopyDarkColor: '#1a472a',
	trunkHue: 25,
	trunkSaturation: 50,
	trunkLightness: 25,
	lightAngle: 130,
	blobCount: 5,
	depthVariance: 1.0,
	blobSizeVariance: 2.0,
	blobCloseness: 50,
	trunkThickness: 100,
	branchThickness: 100,
	canopySize: 100,
	trunkHeight: 100,
	trunkLean: 0,
	trunkSegments: 3,
	trunkCrookedness: 10,
	crookednessMode: 'alternating',
	branchLength: 100,
	branchLengthVariance: 50,
	branchDepth: 2,
	branchesLevel1Range: [1, 3],
	branchesLevel2Range: [1, 2],
	branchesLevel3Range: [0, 1],
	branchSegments: 1,
	branchCrookedness: 0,
	branchAngle: 50,
	branchMirroring: 'allowed',
	trunkFork: false,
	trunkTwist: 25,
	trunkStripCount: 3,
	branchWidthVariance: 25,
	fruitType: 'none',
	fruitCount: 3,
} as const;

// ─── Canopy Color Derivation ────────────────────────────────────────────────

function hexToHsl(hex: string): { h: number; s: number; l: number } {
	const r = parseInt(hex.slice(1, 3), 16) / 255;
	const g = parseInt(hex.slice(3, 5), 16) / 255;
	const b = parseInt(hex.slice(5, 7), 16) / 255;

	const max = Math.max(r, g, b);
	const min = Math.min(r, g, b);
	const l = (max + min) / 2;

	if (max === min) {
		return { h: 0, s: 0, l: l * 100 };
	}

	const d = max - min;
	const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

	let h: number;
	if (max === r) {
		h = ((g - b) / d + (g < b ? 6 : 0)) * 60;
	} else if (max === g) {
		h = ((b - r) / d + 2) * 60;
	} else {
		h = ((r - g) / d + 4) * 60;
	}

	return { h, s: s * 100, l: l * 100 };
}

function hslToHex(h: number, s: number, l: number): string {
	const sNorm = s / 100;
	const lNorm = l / 100;

	const c = (1 - Math.abs(2 * lNorm - 1)) * sNorm;
	const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
	const m = lNorm - c / 2;

	let r: number, g: number, b: number;
	if (h < 60) {
		r = c;
		g = x;
		b = 0;
	} else if (h < 120) {
		r = x;
		g = c;
		b = 0;
	} else if (h < 180) {
		r = 0;
		g = c;
		b = x;
	} else if (h < 240) {
		r = 0;
		g = x;
		b = c;
	} else if (h < 300) {
		r = x;
		g = 0;
		b = c;
	} else {
		r = c;
		g = 0;
		b = x;
	}

	const toHex = (v: number) =>
		Math.round((v + m) * 255)
			.toString(16)
			.padStart(2, '0');
	return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

export function deriveCanopyColors(
	hex: string,
): { canopyLightColor: string; canopyDarkColor: string } | null {
	const { h, s } = hexToHsl(hex);
	if (s < 5) {
		return null;
	}
	const adaptedHue = h + (120 - h) * 0.5;
	const canopyLightColor = hslToHex(adaptedHue, 60, 60);
	const canopyDarkColor = hslToHex(adaptedHue, 45, 20);
	return { canopyLightColor, canopyDarkColor };
}

// ─── computeTreeVisualization — maps StateDimensions to TreeVisualization ────

const DEFAULT_COMPUTE_CONTEXT: TreeComputeContext = {
	isPrd: false,
	prdTitle: '',
	subIssueCompletionRatio: 0,
	subIssueCount: 0,
	hasCompletedSession: false,
	hasCommitsOnBranch: false,
	sessionCount: 0,
	issueId: '',
};

// ─── Tool Visibility Computation ────────────────────────────────────────────

// fallow-ignore-next-line complexity
function computeToolVisibility(dimensions: StateDimensions): ToolVisibility {
	const tools = createDefaultToolVisibility();

	// ── trunkBase tool (mutually exclusive, highest priority wins) ──
	if (
		dimensions.aggregateSessionState === 'running' &&
		dimensions.executionPhase !== 'none' &&
		dimensions.executionPhase !== 'reviewing'
	) {
		const toolType = EXECUTION_PHASE_TOOL_MAP[dimensions.executionPhase];
		tools[toolType] = { visible: true, size: 1 };
	} else if (dimensions.aggregateSessionState === 'paused') {
		tools[TOOL_TYPES.ladder] = { visible: true, size: 1 };
	} else if (dimensions.labels.some((label) => label === SPECIAL_LABELS.hitl)) {
		tools[TOOL_TYPES.grill] = { visible: true, size: 1 };
	} else if (dimensions.worktreeState === 'pending') {
		tools[TOOL_TYPES.wateringCan] = { visible: true, size: 1 };
	}

	// ── Independent accessories (not trunkBase) ──
	if (dimensions.aggregateSessionState === 'errored') {
		tools[TOOL_TYPES.speechBubble] = {
			visible: true,
			size: 1,
			text: 'Error',
			color: SPEECH_BUBBLE_COLORS.red,
		};
	}
	if (dimensions.aggregateSessionState === 'needs-input') {
		tools[TOOL_TYPES.speechBubble] = {
			visible: true,
			size: 1,
			text: 'Needs input',
			color: SPEECH_BUBBLE_COLORS.orange,
		};
	}
	if (dimensions.syncStatus.type === 'merge-conflict' || dimensions.worktreeState === 'failed') {
		tools[TOOL_TYPES.stormCloud] = { visible: true, size: 1 };
	}
	if (dimensions.syncStatus.type === 'behind-base') {
		tools[TOOL_TYPES.mushrooms] = { visible: true, size: 1 };
	}

	return tools;
}

// ─── Tree Stage Rules (priority-ordered cascade, first match wins) ──────────

interface TreeStageRule {
	readonly condition: (dimensions: StateDimensions, context: TreeComputeContext) => boolean;
	readonly stage: TreeStage;
}

const TREE_STAGE_RULES: readonly TreeStageRule[] = [
	{
		condition: (d) => d.worktreeState === 'removed' && d.grovekeeperStatus === 'archived',
		stage: TREE_STAGES.stump,
	},
	{
		condition: (d) => d.branchStatus === 'deleted',
		stage: TREE_STAGES.dead,
	},
	{
		condition: (d) => d.branchStatus === 'remote-gone' && d.pullRequestState !== 'merged',
		stage: TREE_STAGES.dead,
	},
	{
		condition: (d) => d.pullRequestState === 'merged',
		stage: TREE_STAGES.bare,
	},
	{
		condition: (d) => d.pullRequestState === 'closed',
		stage: TREE_STAGES.wilting,
	},
	{
		condition: (d) => d.pullRequestState === 'ready-to-merge',
		stage: TREE_STAGES.fruiting,
	},
	{
		condition: (d) => d.pullRequestState === 'approved',
		stage: TREE_STAGES.fruiting,
	},
	{
		condition: (d) => d.pullRequestState === 'changes-requested',
		stage: TREE_STAGES.seasonal,
	},
	{
		condition: (d) =>
			d.pullRequestState === 'review-requested' || d.pullRequestState === 'open',
		stage: TREE_STAGES.flowering,
	},
	{
		condition: (d) => d.pullRequestState === 'draft',
		stage: TREE_STAGES.leafy,
	},
	{
		condition: (d) =>
			['running', 'needs-input', 'needs-review', 'paused', 'errored'].includes(
				d.aggregateSessionState,
			),
		stage: TREE_STAGES.growing,
	},
	{
		condition: (d, c) => c.hasCommitsOnBranch && d.pullRequestState === 'no-pr',
		stage: TREE_STAGES.leafy,
	},
	{
		condition: (d) =>
			d.worktreeState === 'active' &&
			(d.branchStatus === 'active' || d.branchStatus === 'local-only'),
		stage: TREE_STAGES.sapling,
	},
	{
		condition: (d) => d.worktreeState === 'pending' || d.worktreeState === 'failed',
		stage: TREE_STAGES.sprouting,
	},
];

function computeTreeStage(dimensions: StateDimensions, context: TreeComputeContext): TreeStage {
	for (const rule of TREE_STAGE_RULES) {
		if (rule.condition(dimensions, context)) {
			return rule.stage;
		}
	}
	return TREE_STAGES.seed;
}

// ─── Potted Plant Stage ─────────────────────────────────────────────────────

function computePottedPlantStage(
	dimensions: StateDimensions,
	context: TreeComputeContext,
): PottedPlantStage {
	if (dimensions.githubIssueState === 'closed') {
		return POTTED_PLANT_STAGES.dried;
	}
	if (dimensions.pullRequestState !== 'no-pr') {
		return POTTED_PLANT_STAGES.flowering;
	}
	if (context.hasCompletedSession) {
		return POTTED_PLANT_STAGES.smallPlant;
	}
	if (dimensions.aggregateSessionState !== 'no-session') {
		return POTTED_PLANT_STAGES.sprout;
	}

	return POTTED_PLANT_STAGES.potWithSoil;
}

// ─── Glow Overlay (priority-ordered, highest wins) ──────────────────────────

interface GlowRule {
	readonly condition: (dimensions: StateDimensions) => boolean;
	readonly glow: GlowConfig;
}

const GLOW_RULES: readonly GlowRule[] = [
	{
		condition: (d) => d.aggregateSessionState === 'errored',
		glow: { enabled: true, color: GLOW_COLORS.red, intensity: 4, pulse: true },
	},
	{
		condition: (d) => d.aggregateSessionState === 'needs-input',
		glow: { enabled: true, color: GLOW_COLORS.orange, intensity: 3, pulse: true },
	},
	{
		condition: (d) => d.pullRequestState === 'ready-to-merge',
		glow: { enabled: true, color: GLOW_COLORS.green, intensity: 5, pulse: false },
	},
	{
		condition: (d) => d.pullRequestState === 'approved',
		glow: { enabled: true, color: GLOW_COLORS.green, intensity: 2, pulse: false },
	},
];

function computeOverlayConfig(dimensions: StateDimensions): OverlayConfig {
	for (const rule of GLOW_RULES) {
		if (rule.condition(dimensions)) {
			return { glow: rule.glow };
		}
	}
	return OVERLAY_DEFAULTS;
}

// ─── Seed Computation ───────────────────────────────────────────────────────

function issueIdToSeed(issueId: string): number {
	let hash = 0;
	for (let i = 0; i < issueId.length; i++) {
		hash = (hash * 31 + issueId.charCodeAt(i)) | 0;
	}
	return Math.abs(hash);
}

// ─── Fruit Computation ─────────────────────────────────────────────────────

function computeFruit(
	stage: TreeStage,
	shape: TreeShape,
	seed: number,
): { fruitType: FruitType; fruitCount: number } {
	const isFruiting = stage === TREE_STAGES.fruiting;
	const fruitType = isFruiting
		? shape in SHAPE_FRUIT_MAP
			? SHAPE_FRUIT_MAP[shape as keyof typeof SHAPE_FRUIT_MAP]
			: 'none'
		: 'none';
	const fruitCount = isFruiting ? 3 + (seed % 3) : 0;
	return { fruitType, fruitCount };
}

// ─── computeTreeVisualization ───────────────────────────────────────────────

/** @internal Exported for testing only — use `computeVisualization` for production code. */
export function computeTreeVisualization(
	dimensions: StateDimensions,
	context?: TreeComputeContext,
	labelMappings?: readonly LabelShapeMappingEntry[],
	defaultShape?: TreeShape,
	issueColor?: string | null,
): TreeVisualization {
	const resolvedContext = context ?? DEFAULT_COMPUTE_CONTEXT;
	const seed = issueIdToSeed(resolvedContext.issueId);

	if (resolvedContext.isPrd) {
		return {
			kind: 'oak',
			title: resolvedContext.prdTitle,
			completionRatio: resolvedContext.subIssueCompletionRatio,
			issueCount: resolvedContext.subIssueCount,
			seed,
		} satisfies TreeVisualizationOak;
	}

	if (dimensions.labels.length === 0) {
		return {
			kind: 'potted-plant',
			stage: computePottedPlantStage(dimensions, resolvedContext),
			seed,
		} satisfies TreeVisualizationPottedPlant;
	}

	const stage = computeTreeStage(dimensions, resolvedContext);
	const shape = resolveTreeShape(dimensions.labels, labelMappings, defaultShape);
	const toolVisibility = computeToolVisibility(dimensions);
	const overlayConfig = computeOverlayConfig(dimensions);

	const { fruitType, fruitCount } = computeFruit(stage, shape, seed);

	const canopyColors =
		issueColor != null && issueColor.length > 0 ? deriveCanopyColors(issueColor) : null;

	const isRunning = dimensions.aggregateSessionState === 'running';

	const config: TreeConfig = {
		...DEFAULT_TREE_CONFIG,
		stage,
		shape,
		seed,
		fruitType,
		fruitCount,
		...(canopyColors != null ? canopyColors : undefined),
	};

	return {
		kind: 'tree',
		config,
		toolVisibility,
		overlayConfig,
		animateCanopySway: isRunning,
		animateGrowth: isRunning,
		animateTools: isRunning,
	} satisfies TreeVisualizationTree;
}

// ─── computeVisualization — unified pipeline entry point ─────────────────────

export function computeVisualization(
	issue: Issue,
	gitStatus: GitStatusCache | undefined,
	sessions: readonly SessionForMapping[],
	context?: TreeComputeContext,
	labelMappings?: readonly LabelShapeMappingEntry[],
	defaultShape?: TreeShape,
): TreeVisualization {
	const dimensions = mapIssueToStateDimensions(issue, gitStatus, sessions);
	return computeTreeVisualization(dimensions, context, labelMappings, defaultShape, issue.color);
}
