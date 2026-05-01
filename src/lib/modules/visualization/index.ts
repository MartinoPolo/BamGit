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
	MIN_SPACING_PX,
	MAX_DEPTH_ROWS,
	TREE_SPACING_FRACTION,
	ROW_SPACING_Y_FRACTION,
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
