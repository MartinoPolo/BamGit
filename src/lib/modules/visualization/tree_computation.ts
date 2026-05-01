import type {
	TreeShape,
	TreeStage,
	PottedPlantStage,
	FruitType,
	TreeConfig,
	ToolVisibility,
} from 'low-poly-2d-trees';
import type { Issue } from '$lib/modules/issues/index.js';
import type { GitStatusCache } from '$lib/types/generated';
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
import { TREE_STAGES, POTTED_PLANT_STAGES, TOOL_TYPES } from './constants.js';
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

const OVERLAY_DEFAULTS = {
	glow: { enabled: false, color: '#ffd700', intensity: 3, pulse: false },
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

// fallow-ignore-next-line complexity
function computeToolVisibility(dimensions: StateDimensions): ToolVisibility {
	const tools = createDefaultToolVisibility();

	if (dimensions.worktreeState === 'failed' || dimensions.aggregateSessionState === 'errored') {
		tools[TOOL_TYPES.stormCloud] = { visible: true, size: 1 };
	}
	if (dimensions.aggregateSessionState === 'needs-input') {
		tools[TOOL_TYPES.speechBubble] = { visible: true, size: 1, text: 'Needs input' };
	}
	if (
		dimensions.aggregateSessionState === 'running' ||
		dimensions.aggregateSessionState === 'paused'
	) {
		tools[TOOL_TYPES.wateringCan] = { visible: true, size: 1 };
	}
	if (
		dimensions.pullRequestState === 'review-requested' ||
		dimensions.pullRequestState === 'changes-requested'
	) {
		tools[TOOL_TYPES.woodpecker] = { visible: true, size: 1 };
	}

	return tools;
}

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
		condition: (d) => d.pullRequestState === 'merged' && d.githubIssueState === 'closed',
		stage: TREE_STAGES.bare,
	},
	{
		condition: (d) => d.pullRequestState === 'approved',
		stage: TREE_STAGES.flowering,
	},
	{
		condition: (d) =>
			d.pullRequestState === 'ready-to-merge' ||
			d.pullRequestState === 'review-requested' ||
			d.pullRequestState === 'changes-requested',
		stage: TREE_STAGES.seasonal,
	},
	{
		condition: (d) => d.pullRequestState === 'draft' || d.pullRequestState === 'open',
		stage: TREE_STAGES.fruiting,
	},
	{
		condition: (d, c) => d.aggregateSessionState === 'finished' && c.hasCommitsOnBranch,
		stage: TREE_STAGES.leafy,
	},
	{
		condition: (d) => d.aggregateSessionState === 'running',
		stage: TREE_STAGES.growing,
	},
	{
		condition: (d) =>
			d.worktreeState === 'active' &&
			d.branchStatus !== 'no-branch' &&
			d.aggregateSessionState === 'no-session',
		stage: TREE_STAGES.sapling,
	},
	{
		condition: (d) => d.worktreeState === 'pending',
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

function issueIdToSeed(issueId: string): number {
	let hash = 0;
	for (let i = 0; i < issueId.length; i++) {
		hash = (hash * 31 + issueId.charCodeAt(i)) | 0;
	}
	return Math.abs(hash);
}

/** @internal Exported for testing only — use `computeVisualization` for production code. */
export function computeTreeVisualization(
	dimensions: StateDimensions,
	context?: TreeComputeContext,
	labelMappings?: readonly LabelShapeMappingEntry[],
	defaultShape?: TreeShape,
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

	const fruitType =
		shape in SHAPE_FRUIT_MAP
			? SHAPE_FRUIT_MAP[shape as keyof typeof SHAPE_FRUIT_MAP]
			: DEFAULT_TREE_CONFIG.fruitType;

	const config: TreeConfig = {
		...DEFAULT_TREE_CONFIG,
		stage,
		shape,
		seed,
		fruitType,
		fruitCount: Math.min(resolvedContext.sessionCount, 7),
	};

	const glowEnabled =
		dimensions.pullRequestState === 'approved' ||
		dimensions.pullRequestState === 'ready-to-merge';

	const overlayConfig = glowEnabled
		? { glow: { enabled: true, color: '#ffd700', intensity: 3, pulse: false } }
		: OVERLAY_DEFAULTS;

	return {
		kind: 'tree',
		config,
		toolVisibility,
		overlayConfig,
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
	return computeTreeVisualization(dimensions, context, labelMappings, defaultShape);
}
