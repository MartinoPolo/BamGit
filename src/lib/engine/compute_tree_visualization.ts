import type { TreeStage, PottedPlantStage, TreeConfig, ToolVisibility } from 'low-poly-2d-trees';
import {
	TREE_STAGES,
	DEFAULT_TREE_CONFIG,
	POTTED_PLANT_STAGES,
	TOOL_TYPES,
	createDefaultToolVisibility,
	OVERLAY_DEFAULTS,
	SHAPE_FRUIT_MAP,
	resolve_tree_shape,
} from '$lib/types/tree_visualization';
import type {
	StateDimensions,
	TreeComputeContext,
	TreeVisualization,
} from '$lib/types/tree_visualization';

export const DEFAULT_COMPUTE_CONTEXT: TreeComputeContext = {
	isPrd: false,
	prdTitle: '',
	subIssueCompletionRatio: 0,
	subIssueCount: 0,
	hasCompletedSession: false,
	hasCommitsOnBranch: false,
	sessionCount: 0,
	issueId: '',
};

function compute_tool_visibility(dimensions: StateDimensions): ToolVisibility {
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

function compute_tree_stage(dimensions: StateDimensions, context: TreeComputeContext): TreeStage {
	if (dimensions.worktreeState === 'removed' && dimensions.grovekeeperStatus === 'archived') {
		return TREE_STAGES.stump;
	}
	if (dimensions.branchStatus === 'deleted') {
		return TREE_STAGES.dead;
	}
	if (dimensions.pullRequestState === 'merged' && dimensions.githubIssueState === 'closed') {
		return TREE_STAGES.bare;
	}
	if (dimensions.pullRequestState === 'approved') {
		return TREE_STAGES.flowering;
	}
	if (
		dimensions.pullRequestState === 'ready-to-merge' ||
		dimensions.pullRequestState === 'review-requested' ||
		dimensions.pullRequestState === 'changes-requested'
	) {
		return TREE_STAGES.seasonal;
	}
	if (dimensions.pullRequestState === 'draft' || dimensions.pullRequestState === 'open') {
		return TREE_STAGES.fruiting;
	}
	if (dimensions.aggregateSessionState === 'finished' && context.hasCommitsOnBranch) {
		return TREE_STAGES.leafy;
	}
	if (dimensions.aggregateSessionState === 'running') {
		return TREE_STAGES.growing;
	}
	if (
		dimensions.worktreeState === 'active' &&
		dimensions.branchStatus !== 'no-branch' &&
		dimensions.aggregateSessionState === 'no-session'
	) {
		return TREE_STAGES.sapling;
	}
	if (dimensions.worktreeState === 'pending') {
		return TREE_STAGES.sprouting;
	}

	return TREE_STAGES.seed;
}

function compute_potted_plant_stage(
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

export function compute_tree_visualization(
	dimensions: StateDimensions,
	context?: TreeComputeContext,
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
			stage: compute_potted_plant_stage(dimensions, resolvedContext),
			seed,
		};
	}

	const stage = compute_tree_stage(dimensions, resolvedContext);
	const shape = resolve_tree_shape(dimensions.labels);
	const toolVisibility = compute_tool_visibility(dimensions);

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
