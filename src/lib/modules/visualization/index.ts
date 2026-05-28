export type {
	LabelShapeMappingEntry,
	AggregateSessionState,
	ForestBranchStatus,
	ForestPullRequestState,
	ForestSyncStatus,
	StateDimensions,
	TreeVisualizationTree,
	TreeVisualizationPottedPlant,
	TreeVisualizationOak,
	TreeVisualization,
	TreeComputeContext,
	SessionForMapping,
	Viewport,
	ForestLayoutItemOak,
	ForestLayoutItemTree,
	ForestLayoutItemPottedPlant,
	ForestLayoutItem,
	PositionedForestItem,
	ForestLayoutResult,
} from './types.js';

export {
	TREE_STAGES,
	POTTED_PLANT_STAGES,
	TOOL_TYPES,
	SPECIAL_LABELS,
	MIN_SPACING_PX,
	MAX_DEPTH_ROWS,
	MAX_LAYOUT_WIDTH_PX,
	TREE_SPACING_FRACTION,
	BASE_ROW_GAP_FRACTION,
	ROW_GAP_PERSPECTIVE_FACTOR,
	ROW_SCALE_FACTOR,
	ROW_OPACITY_FACTOR,
	ROW_X_OFFSET_FRACTION,
	GROUND_Y_FRACTION,
	GROUND_STRIP_HEIGHT_FRACTION,
} from './constants.js';

export { computeVisualization, computeTreeVisualization } from './tree_computation.js';
export { computeForestLayout } from './forest_layout.js';

export { aggregateSessionState, mapIssueToStateDimensions } from './state_mapping.js';
export { computeDepthRows } from './depth_rows.js';

export type { TreeContextMenuAction } from './types.js';
export { TREE_CONTEXT_MENU_ACTIONS } from './types.js';
export { resolveGlowOverlay } from './forest_interaction.js';
export type { ResolveGlowOverlayParams } from './forest_interaction.js';
