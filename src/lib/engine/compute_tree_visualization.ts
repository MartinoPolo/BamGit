import type {
	StateDimensions,
	TreeComputeContext,
	TreeVisualization,
	TreeStage,
	PottedPlantStage,
	TreeOverlay,
	FruitType,
} from '$lib/types/tree_visualization';

export const DEFAULT_COMPUTE_CONTEXT: TreeComputeContext = {
	isPrd: false,
	hasCompletedSession: false,
	hasCommitsOnBranch: false,
	sessionCount: 0,
	companionSaplings: [],
	activeTools: [],
};

const FRUIT_ROTATION: readonly FruitType[] = ['apple', 'pear', 'orange', 'cherry', 'plum'];

function compute_overlays(dimensions: StateDimensions): readonly TreeOverlay[] {
	const overlays: TreeOverlay[] = [];

	if (dimensions.worktreeState === 'failed' || dimensions.aggregateSessionState === 'errored') {
		overlays.push('error-damage');
	}
	if (dimensions.syncStatus.type === 'merge-conflict') {
		overlays.push('merge-conflict');
	}
	if (dimensions.syncStatus.type === 'behind-base') {
		overlays.push('behind-base');
	}
	if (dimensions.aggregateSessionState === 'needs-input') {
		overlays.push('needs-input');
	}
	if (dimensions.pullRequestState === 'changes-requested') {
		overlays.push('changes-requested');
	}
	if (dimensions.pullRequestState === 'approved') {
		overlays.push('approved');
	}

	return overlays;
}

function compute_fruit_types(session_count: number): readonly FruitType[] {
	return Array.from(
		{ length: session_count },
		(_, i) => FRUIT_ROTATION[i % FRUIT_ROTATION.length],
	);
}

function compute_tree_stage(dimensions: StateDimensions, context: TreeComputeContext): TreeStage {
	if (dimensions.worktreeState === 'removed' && dimensions.bamgitStatus === 'archived') {
		return 'stump';
	}
	if (dimensions.branchStatus === 'deleted') {
		return 'dead';
	}
	if (dimensions.pullRequestState === 'merged' && dimensions.githubIssueState === 'closed') {
		return 'bare';
	}
	if (dimensions.pullRequestState === 'ready-to-merge') {
		return 'ready';
	}
	if (
		dimensions.pullRequestState === 'review-requested' ||
		dimensions.pullRequestState === 'changes-requested' ||
		dimensions.pullRequestState === 'approved'
	) {
		return 'autumn';
	}
	if (dimensions.pullRequestState === 'draft' || dimensions.pullRequestState === 'open') {
		return 'fruiting';
	}
	if (dimensions.aggregateSessionState === 'finished' && context.hasCommitsOnBranch) {
		return 'leafy';
	}
	if (dimensions.aggregateSessionState === 'running' && !context.hasCompletedSession) {
		return 'growing';
	}
	if (
		dimensions.worktreeState === 'active' &&
		dimensions.branchStatus !== 'no-branch' &&
		dimensions.aggregateSessionState === 'no-session'
	) {
		return 'sapling';
	}
	if (
		dimensions.label === 'AFK' &&
		(dimensions.worktreeState === 'none' || dimensions.worktreeState === 'pending')
	) {
		return 'sprouting';
	}

	return 'seed';
}

function compute_potted_plant_stage(
	dimensions: StateDimensions,
	context: TreeComputeContext,
): PottedPlantStage {
	if (dimensions.githubIssueState === 'closed') {
		return 'dried';
	}
	if (dimensions.pullRequestState !== 'no-pr') {
		return 'flowering';
	}
	if (context.hasCompletedSession) {
		return 'small-plant';
	}
	if (dimensions.aggregateSessionState !== 'no-session') {
		return 'sprout';
	}

	return 'pot-with-soil';
}

export function compute_tree_visualization(
	dimensions: StateDimensions,
	context?: TreeComputeContext,
): TreeVisualization {
	const resolved_context = context ?? DEFAULT_COMPUTE_CONTEXT;
	const overlays = compute_overlays(dimensions);

	if (resolved_context.isPrd) {
		return { kind: 'oak', overlays };
	}

	if (dimensions.label === null) {
		return {
			kind: 'potted-plant',
			stage: compute_potted_plant_stage(dimensions, resolved_context),
			overlays,
		};
	}

	return {
		kind: 'tree',
		stage: compute_tree_stage(dimensions, resolved_context),
		overlays,
		companionSaplings: resolved_context.companionSaplings,
		activeTools: resolved_context.activeTools,
		fruitTypes: compute_fruit_types(resolved_context.sessionCount),
	};
}
