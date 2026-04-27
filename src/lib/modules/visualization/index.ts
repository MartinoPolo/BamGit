import type {
	TreeShape,
	TreeStage,
	PottedPlantStage,
	FruitType,
	TreeConfig,
	ToolVisibility,
	OverlayConfig,
} from 'low-poly-2d-trees';
import type { Issue } from '$lib/modules/issues/index.svelte.js';
import type { GitStatusCache, ExecutionPhase, SessionState } from '$lib/types/generated';
import type { WorktreeState } from '$lib/modules/issues/index.svelte.js';

// ─── Re-exported Library Types (erased at runtime) ──────────────────────

/** @public */
export type { TreeStage, PottedPlantStage };

// ─── Library Constants (local mirrors — avoids barrel Svelte import in Node) ─

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

// ─── GitHub Label -> Tree Shape Mapping ─────────────────────────────────

/** @public */
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

// ─── Tool Visibility Factory ────────────────────────────────────────────

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
	};
}

// ─── Default Tree Config (subset needed by engine) ──────────────────────

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

// ─── R12 State Dimensions ───────────────────────────────────────────────

type ForestWorktreeState = WorktreeState;

/** @public */
export type AggregateSessionState = SessionState | 'no-session';

/** @public */
export type ForestBranchStatus = 'no-branch' | 'active' | 'local-only' | 'remote-gone' | 'deleted';

/** @public */
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

/** @public */
export type ForestSyncStatus =
	| { readonly type: 'up-to-date' }
	| { readonly type: 'behind-base'; readonly count: number }
	| { readonly type: 'merge-conflict' };

type ForestGitHubIssueState = 'open' | 'closed';
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

// ─── Visualization Result (library-typed output) ────────────────────────

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

// ─── Engine Context (supplemental data not in StateDimensions) ──────────

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

// ─── Session Mapping Input ──────────────────────────────────────────────

export interface SessionForMapping {
	readonly state: SessionState;
	readonly execution_phase: ExecutionPhase;
}

// ════════════════════════════════════════════════════════════════════════
// aggregateSessionState — priority-based session state reduction
// ════════════════════════════════════════════════════════════════════════

const SESSION_PRIORITY: readonly SessionState[] = [
	'needs-input',
	'errored',
	'needs-review',
	'running',
	'paused',
	'finished',
];

export function aggregateSessionState(sessions: readonly SessionState[]): AggregateSessionState {
	if (sessions.length === 0) {
		return 'no-session';
	}

	const stateSet = new Set(sessions);

	for (const state of SESSION_PRIORITY) {
		if (stateSet.has(state)) {
			return state;
		}
	}

	return 'no-session';
}

// ════════════════════════════════════════════════════════════════════════
// mapIssueToStateDimensions — maps raw inputs to StateDimensions
// ════════════════════════════════════════════════════════════════════════

const KNOWN_PR_STATES: ReadonlySet<ForestPullRequestState> = new Set([
	'draft',
	'open',
	'review-requested',
	'changes-requested',
	'approved',
	'ready-to-merge',
	'merged',
	'closed',
]);

const KNOWN_BRANCH_STATUSES: ReadonlySet<string> = new Set([
	'active',
	'local',
	'remote-gone',
	'deleted',
	'unknown',
]);

function mapBranchStatus(
	issueBranchName: string | null,
	raw: string | null | undefined,
): ForestBranchStatus {
	if (
		issueBranchName === null ||
		raw == null ||
		raw === 'unknown' ||
		!KNOWN_BRANCH_STATUSES.has(raw)
	) {
		return 'no-branch';
	}
	if (raw === 'local') {
		return 'local-only';
	}
	return raw as ForestBranchStatus;
}

function mapPrState(raw: string | null | undefined): ForestPullRequestState {
	if (raw == null) {
		return 'no-pr';
	}
	if (KNOWN_PR_STATES.has(raw as ForestPullRequestState)) {
		return raw as ForestPullRequestState;
	}
	return 'open';
}

function mapSyncStatus(gitStatus: GitStatusCache | undefined): ForestSyncStatus {
	if (gitStatus === undefined) {
		return { type: 'up-to-date' };
	}
	if (gitStatus.merge_conflict === true) {
		return { type: 'merge-conflict' };
	}
	const behind = gitStatus.behind_base_count ?? 0;
	if (behind > 0) {
		return { type: 'behind-base', count: behind };
	}
	return { type: 'up-to-date' };
}

function pickExecutionPhase(sessions: readonly SessionForMapping[]): ExecutionPhase {
	const running = sessions.find((session) => session.state === 'running');
	return running?.execution_phase ?? 'none';
}

export function mapIssueToStateDimensions(
	issue: Issue,
	gitStatus: GitStatusCache | undefined,
	sessions: readonly SessionForMapping[],
): StateDimensions {
	return {
		labels: issue.labels.map((label) => label.name),
		worktreeState: issue.worktree_state,
		aggregateSessionState: aggregateSessionState(sessions.map((session) => session.state)),
		executionPhase: pickExecutionPhase(sessions),
		branchStatus: mapBranchStatus(issue.branch_name, gitStatus?.branch_status),
		pullRequestState: mapPrState(gitStatus?.pr_state),
		githubIssueState: gitStatus?.github_issue_state === 'closed' ? 'closed' : 'open',
		syncStatus: mapSyncStatus(gitStatus),
		grovekeeperStatus: issue.status === 'archived' ? 'archived' : 'active',
	};
}

// ════════════════════════════════════════════════════════════════════════
// computeTreeVisualization — maps StateDimensions to TreeVisualization
// ════════════════════════════════════════════════════════════════════════

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

// ════════════════════════════════════════════════════════════════════════
// computeVisualization — unified pipeline entry point
// ════════════════════════════════════════════════════════════════════════

export function computeVisualization(
	issue: Issue,
	gitStatus: GitStatusCache | undefined,
	sessions: readonly SessionForMapping[],
	labelMappings?: readonly LabelShapeMappingEntry[],
	defaultShape?: TreeShape,
): TreeVisualization {
	const dimensions = mapIssueToStateDimensions(issue, gitStatus, sessions);
	return computeTreeVisualization(dimensions, undefined, labelMappings, defaultShape);
}

// ════════════════════════════════════════════════════════════════════════
// computeForestLayout — positions computed visualizations in a viewport
// ════════════════════════════════════════════════════════════════════════

type IssuePriority = 'low' | 'medium' | 'high' | 'top' | null;

// ─── Input Types ────────────────────────────────────────────────────────

export interface Viewport {
	readonly width: number;
	readonly height: number;
}

export interface ForestLayoutItemOak {
	readonly id: string;
	readonly kind: 'oak';
	readonly priority: IssuePriority;
	readonly sortOrder: number;
}

export interface ForestLayoutItemTree {
	readonly id: string;
	readonly kind: 'tree';
	readonly stage: TreeStage;
	readonly priority: IssuePriority;
	readonly sortOrder: number;
}

export interface ForestLayoutItemPottedPlant {
	readonly id: string;
	readonly kind: 'potted-plant';
	readonly stage: PottedPlantStage;
	readonly priority: IssuePriority;
	readonly sortOrder: number;
}

export type ForestLayoutItem =
	| ForestLayoutItemOak
	| ForestLayoutItemTree
	| ForestLayoutItemPottedPlant;

// ─── Output Types ───────────────────────────────────────────────────────

export interface PositionedForestItem {
	readonly id: string;
	readonly x: number;
	readonly y: number;
	readonly scale: number;
	readonly opacity: number;
	readonly zIndex: number;
}

interface ForestLayoutResult {
	readonly items: readonly PositionedForestItem[];
	readonly oakPosition: PositionedForestItem | null;
	readonly shelfY: number;
}

// ─── Constants ──────────────────────────────────────────────────────────

/** Minimum pixel distance between any two positioned items. */
export const MIN_SPACING_PX = 60;

/** Fraction of viewport height where the oak sits. */
const OAK_Y_FRACTION = 0.12;

/** Fraction of viewport height where the shelf strip begins. */
const SHELF_Y_FRACTION = 0.88;

/** Ring radius step as fraction of viewport width. */
const RING_RADIUS_STEP_FRACTION = 0.12;

/** Base ring radius as fraction of viewport width. */
const BASE_RING_RADIUS_FRACTION = 0.15;

/** Scale decay per ring for trees. */
const TREE_SCALE_PER_RING = [0.85, 0.75, 0.65, 0.55, 0.5];

/** Vertical flatten factor for the semicircle arc (1.0 = full circle, <1 = compressed). */
const SEMICIRCLE_VERTICAL_FLATTEN = 0.6;

/** Max iterative passes for collision relaxation. */
const MAX_RELAXATION_PASSES = 10;

/** Vertical offset of tree semicircle center below the oak, as fraction of viewport height. */
const TREE_CENTER_OFFSET_FRACTION = 0.18;

/** Fallback tree center position when oak absent, as fraction of viewport height. */
const TREE_CENTER_NO_OAK_FRACTION = 0.3;

/** Horizontal margin for the shelf strip, as fraction of viewport width. */
const SHELF_MARGIN_FRACTION = 0.1;

const STUMP_OPACITY = 0.4;
const STUMP_SCALE = 0.5;
const POTTED_PLANT_SCALE = 0.6;

// ─── zIndex Layers ──────────────────────────────────────────────────────

const Z_OAK = 100;
const Z_TREE_BASE = 50;
const Z_POTTED_PLANT = 30;
const Z_STUMP = 10;

// ─── Internal Layout Helpers ────────────────────────────────────────────

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

function isStump(item: ForestLayoutItem): boolean {
	return item.kind === 'tree' && item.stage === 'stump';
}

/** Capacity of ring at given index. Progressive: 3, 5, 7, 9, ... */
function ringCapacityAt(ringIndex: number): number {
	return 3 + ringIndex * 2;
}

/** Count rings required to hold `treeCount` items using the progressive capacity formula. */
function countTreeRings(treeCount: number): number {
	if (treeCount === 0) {
		return 0;
	}
	let ringIndex = 0;
	let remaining = treeCount;
	while (remaining > 0) {
		remaining -= ringCapacityAt(ringIndex);
		ringIndex++;
	}
	return ringIndex;
}

interface ClassifiedItems {
	readonly oak: ForestLayoutItem | null;
	readonly trees: readonly ForestLayoutItem[];
	readonly stumps: readonly ForestLayoutItem[];
	readonly pottedPlants: readonly ForestLayoutItem[];
}

function classifyItems(items: readonly ForestLayoutItem[]): ClassifiedItems {
	let oak: ForestLayoutItem | null = null;
	const trees: ForestLayoutItem[] = [];
	const stumps: ForestLayoutItem[] = [];
	const pottedPlants: ForestLayoutItem[] = [];

	for (const item of items) {
		if (item.kind === 'oak') {
			oak = item;
		} else if (item.kind === 'potted-plant') {
			pottedPlants.push(item);
		} else if (isStump(item)) {
			stumps.push(item);
		} else {
			trees.push(item);
		}
	}

	return { oak, trees: sortByPriorityThenOrder(trees), stumps, pottedPlants };
}

/**
 * Distribute `count` items evenly along a semicircle arc (PI radians, left to right).
 * Returns angles in radians from PI (left) to 0 (right).
 */
function semicircleAngles(count: number): number[] {
	if (count === 1) {
		return [Math.PI / 2]; // center
	}
	const angles: number[] = [];
	for (let i = 0; i < count; i++) {
		angles.push(Math.PI - (i * Math.PI) / (count - 1));
	}
	return angles;
}

/**
 * Place items on concentric semicircle rings below a center point.
 * Returns positioned items with scale/opacity/zIndex.
 */
function placeOnSemicircles(
	items: readonly ForestLayoutItem[],
	centerX: number,
	centerY: number,
	viewportWidth: number,
): PositionedForestItem[] {
	if (items.length === 0) {
		return [];
	}

	const baseRadius = viewportWidth * BASE_RING_RADIUS_FRACTION;
	const radiusStep = viewportWidth * RING_RADIUS_STEP_FRACTION;
	const result: PositionedForestItem[] = [];

	let itemIndex = 0;
	let ringIndex = 0;

	while (itemIndex < items.length) {
		const capacity = Math.min(ringCapacityAt(ringIndex), items.length - itemIndex);
		const ringItems = items.slice(itemIndex, itemIndex + capacity);
		const radius = baseRadius + ringIndex * radiusStep;
		const angles = semicircleAngles(ringItems.length);
		const scale = TREE_SCALE_PER_RING[Math.min(ringIndex, TREE_SCALE_PER_RING.length - 1)];

		for (let i = 0; i < ringItems.length; i++) {
			const angle = angles[i];
			result.push({
				id: ringItems[i].id,
				x: centerX + radius * Math.cos(angle),
				y: centerY + radius * Math.sin(angle) * SEMICIRCLE_VERTICAL_FLATTEN,
				scale,
				opacity: 1.0,
				zIndex: Z_TREE_BASE + (TREE_SCALE_PER_RING.length - ringIndex),
			});
		}

		itemIndex += capacity;
		ringIndex++;
	}

	return result;
}

/**
 * Ensure no two items are closer than MIN_SPACING_PX by nudging outward.
 * Iterative relaxation -- bounded by MAX_RELAXATION_PASSES.
 */
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
					// Coincident points -- nudge apart along direction from center
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

// ─── Section Placers ────────────────────────────────────────────────────

function placeOak(oak: ForestLayoutItem, centerX: number, oakY: number): PositionedForestItem {
	return {
		id: oak.id,
		x: centerX,
		y: oakY,
		scale: 1.0,
		opacity: 1.0,
		zIndex: Z_OAK,
	};
}

function placeStumps(
	stumps: readonly ForestLayoutItem[],
	treeCount: number,
	centerX: number,
	treeCenterY: number,
	viewportWidth: number,
): PositionedForestItem[] {
	if (stumps.length === 0) {
		return [];
	}

	const treeRingCount = countTreeRings(treeCount) || 1;
	const baseRadius = viewportWidth * BASE_RING_RADIUS_FRACTION;
	const radiusStep = viewportWidth * RING_RADIUS_STEP_FRACTION;
	const stumpRadius = baseRadius + (treeRingCount + 0.5) * radiusStep;
	const stumpAngles = semicircleAngles(stumps.length);

	return stumps.map((stump, i) => ({
		id: stump.id,
		x: centerX + stumpRadius * Math.cos(stumpAngles[i]),
		y: treeCenterY + stumpRadius * Math.sin(stumpAngles[i]) * SEMICIRCLE_VERTICAL_FLATTEN,
		scale: STUMP_SCALE,
		opacity: STUMP_OPACITY,
		zIndex: Z_STUMP,
	}));
}

function placePottedPlants(
	pottedPlants: readonly ForestLayoutItem[],
	centerX: number,
	shelfY: number,
	viewportWidth: number,
): PositionedForestItem[] {
	if (pottedPlants.length === 0) {
		return [];
	}

	const margin = viewportWidth * SHELF_MARGIN_FRACTION;
	const availableWidth = viewportWidth - 2 * margin;
	const spacing = pottedPlants.length > 1 ? availableWidth / (pottedPlants.length - 1) : 0;
	const startX = pottedPlants.length > 1 ? margin : centerX;

	return pottedPlants.map((plant, i) => ({
		id: plant.id,
		x: startX + i * spacing,
		y: shelfY,
		scale: POTTED_PLANT_SCALE,
		opacity: 1.0,
		zIndex: Z_POTTED_PLANT,
	}));
}

// ─── Layout Engine ──────────────────────────────────────────────────────

export function computeForestLayout(
	items: readonly ForestLayoutItem[],
	viewport: Viewport,
): ForestLayoutResult {
	if (items.length === 0) {
		return { items: [], oakPosition: null, shelfY: viewport.height * SHELF_Y_FRACTION };
	}

	const { oak, trees, stumps, pottedPlants } = classifyItems(items);
	const centerX = viewport.width / 2;
	const shelfY = viewport.height * SHELF_Y_FRACTION;
	const oakY = viewport.height * OAK_Y_FRACTION;

	const treeCenterY = oak
		? oakY + viewport.height * TREE_CENTER_OFFSET_FRACTION
		: viewport.height * TREE_CENTER_NO_OAK_FRACTION;

	const allPositioned: PositionedForestItem[] = [
		...(oak ? [placeOak(oak, centerX, oakY)] : []),
		...placeOnSemicircles(trees, centerX, treeCenterY, viewport.width),
		...placeStumps(stumps, trees.length, centerX, treeCenterY, viewport.width),
		...placePottedPlants(pottedPlants, centerX, shelfY, viewport.width),
	];

	const resolved = enforceMinimumSpacing(allPositioned, centerX, treeCenterY);
	const resolvedOak = oak ? (resolved.find((item) => item.id === oak.id) ?? null) : null;

	return {
		items: resolved,
		oakPosition: resolvedOak,
		shelfY,
	};
}
