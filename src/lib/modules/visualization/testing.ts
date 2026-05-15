/**
 * Test-only re-exports from the visualization module.
 *
 * Production code should use `computeVisualization` and `computeForestLayout`
 * from `$lib/modules/visualization`. These internal symbols are exposed here
 * solely for unit-test assertions.
 */
export {
	TREE_STAGES,
	POTTED_PLANT_STAGES,
	TOOL_TYPES,
	GLOW_COLORS,
	SPEECH_BUBBLE_COLORS,
} from './constants.js';

export { aggregateSessionState, mapIssueToStateDimensions } from './state_mapping.js';

export { computeTreeVisualization, deriveCanopyColors } from './tree_computation.js';

export type { StateDimensions } from './types.js';
