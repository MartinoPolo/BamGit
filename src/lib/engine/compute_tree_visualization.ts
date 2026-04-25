import type {
	TreeShape,
	TreeStage,
	PottedPlantStage,
	TreeConfig,
	ToolVisibility,
} from 'low-poly-2d-trees';
import {
	TREE_STAGES,
	DEFAULT_TREE_CONFIG,
	POTTED_PLANT_STAGES,
	TOOL_TYPES,
	createDefaultToolVisibility,
	OVERLAY_DEFAULTS,
	SHAPE_FRUIT_MAP,
	resolveTreeShape,
} from '$lib/types/tree_visualization';
import type {
	LabelShapeMappingEntry,
	StateDimensions,
	TreeComputeContext,
	TreeVisualization,
} from '$lib/types/tree_visualization';

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
		};
	}

	if (dimensions.labels.length === 0) {
		return {
			kind: 'potted-plant',
			stage: computePottedPlantStage(dimensions, resolvedContext),
			seed,
		};
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
	};
}
