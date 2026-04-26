import type { ExecutionPhase, SessionState } from '$lib/types/generated';
import type { WorktreeState } from './worktree';

// ─── Library Types (erased at runtime — no barrel import) ────────────────

export type { TreeStage, PottedPlantStage } from 'low-poly-2d-trees';

// ─── Library Constants (local mirrors — avoids barrel Svelte import in Node) ─

import type { TreeShape, TreeStage, PottedPlantStage, FruitType } from 'low-poly-2d-trees';

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

export const POTTED_PLANT_STAGES = {
	potWithSoil: 'pot-with-soil',
	sprout: 'sprout',
	smallPlant: 'small-plant',
	flowering: 'flowering',
	dried: 'dried',
} as const satisfies Record<string, PottedPlantStage>;

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
} as const;

export const OVERLAY_DEFAULTS = {
	glow: { enabled: false, color: '#ffd700', intensity: 3, pulse: false },
} as const;

export const SHAPE_FRUIT_MAP: Readonly<Record<Exclude<TreeShape, 'custom'>, FruitType>> = {
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

// ─── GitHub Label → Tree Shape Mapping ───────────────────────────────────

export interface LabelShapeMappingEntry {
	readonly labelName: string;
	readonly treeShape: TreeShape;
}

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

export function resolveTreeShape(
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

// ─── Tool Visibility Factory ─────────────────────────────────────────────

import type { ToolVisibility } from 'low-poly-2d-trees';

export function createDefaultToolVisibility(): ToolVisibility {
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
	};
}

// ─── Default Tree Config (subset needed by engine) ───────────────────────

import type { TreeConfig } from 'low-poly-2d-trees';

export const DEFAULT_TREE_CONFIG: TreeConfig = {
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

// ─── R12 State Dimensions ─────────────────────────────────────────────────

type ForestWorktreeState = WorktreeState;

export type AggregateSessionState = SessionState | 'no-session';

export type ForestBranchStatus = 'no-branch' | 'active' | 'local-only' | 'remote-gone' | 'deleted';

export type ForestPullRequestState =
	| 'no-pr'
	| 'draft'
	| 'open'
	| 'review-requested'
	| 'changes-requested'
	| 'approved'
	| 'ready-to-merge'
	| 'merged'
	| 'closed';

type ForestGitHubIssueState = 'open' | 'closed';

export type ForestSyncStatus =
	| { readonly type: 'up-to-date' }
	| { readonly type: 'behind-base'; readonly count: number }
	| { readonly type: 'merge-conflict' };

type ForestGrovekeeperStatus = 'active' | 'archived';

export interface StateDimensions {
	readonly labels: readonly string[];
	readonly worktreeState: ForestWorktreeState;
	readonly aggregateSessionState: AggregateSessionState;
	readonly executionPhase: ExecutionPhase;
	readonly branchStatus: ForestBranchStatus;
	readonly pullRequestState: ForestPullRequestState;
	readonly githubIssueState: ForestGitHubIssueState;
	readonly syncStatus: ForestSyncStatus;
	readonly grovekeeperStatus: ForestGrovekeeperStatus;
}

// ─── Visualization Result (library-typed output) ─────────────────────────

import type { OverlayConfig } from 'low-poly-2d-trees';

export interface TreeVisualizationTree {
	readonly kind: 'tree';
	readonly config: TreeConfig;
	readonly toolVisibility: ToolVisibility;
	readonly overlayConfig: OverlayConfig;
}

export interface TreeVisualizationPottedPlant {
	readonly kind: 'potted-plant';
	readonly stage: PottedPlantStage;
	readonly seed: number;
}

export interface TreeVisualizationOak {
	readonly kind: 'oak';
	readonly title: string;
	readonly completionRatio: number;
	readonly issueCount: number;
	readonly seed: number;
}

export type TreeVisualization =
	| TreeVisualizationTree
	| TreeVisualizationPottedPlant
	| TreeVisualizationOak;

// ─── Engine Context (supplemental data not in StateDimensions) ────────────

export interface TreeComputeContext {
	readonly isPrd: boolean;
	readonly prdTitle: string;
	readonly subIssueCompletionRatio: number;
	readonly subIssueCount: number;
	readonly hasCompletedSession: boolean;
	readonly hasCommitsOnBranch: boolean;
	readonly sessionCount: number;
	readonly issueId: string;
}
