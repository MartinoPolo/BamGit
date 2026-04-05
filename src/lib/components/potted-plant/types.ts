import type { PottedPlantStage, TreeVisualizationPottedPlant } from '$lib/types/tree_visualization';

// ─── Component Props ─────────────────────────────────────────────────────

export interface PottedPlantComponentProps {
	readonly visualization: TreeVisualizationPottedPlant;
	readonly accent_color: string;
	readonly is_dark: boolean;
}

// ─── Stage → Component Group Mapping ─────────────────────────────────────

export type PottedPlantComponentGroup = 'soil-sprout' | 'plant' | 'dried';

export const POTTED_STAGE_TO_GROUP: Readonly<Record<PottedPlantStage, PottedPlantComponentGroup>> =
	{
		'pot-with-soil': 'soil-sprout',
		sprout: 'soil-sprout',
		'small-plant': 'plant',
		flowering: 'plant',
		dried: 'dried',
	};

// ─── ViewBox Constants ───────────────────────────────────────────────────

export const POTTED_VIEWBOX_WIDTH = 80;
export const POTTED_VIEWBOX_HEIGHT = 120;

/** Plant canopy zone: y 0–55 */
export const POTTED_PLANT_ZONE_END = 55;
/** Ground zone: y 95–120 (pot body occupies y 55–95) */
export const POTTED_GROUND_ZONE_START = 95;
