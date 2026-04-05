import type { PottedPlantStage } from '$lib/types/tree_visualization';
import type { AttachmentPoints } from '../tree/types';

/**
 * Computes overlay attachment points for each potted plant stage.
 * Points are in SVG coordinate space (viewBox 0 0 80 120).
 * Plant zone: y 0–55, Pot zone: y 55–95, Ground zone: y 95–120.
 */
export function compute_potted_plant_attachment_points(stage: PottedPlantStage): AttachmentPoints {
	switch (stage) {
		case 'pot-with-soil':
			return {
				crown: { x: 40, y: 58 },
				trunkBase: { x: 40, y: 88 },
				roots: { x: 40, y: 100 },
			};
		case 'sprout':
			return {
				crown: { x: 40, y: 48 },
				trunkBase: { x: 40, y: 88 },
				roots: { x: 40, y: 100 },
			};
		case 'small-plant':
			return {
				crown: { x: 40, y: 30 },
				trunkBase: { x: 40, y: 85 },
				roots: { x: 40, y: 100 },
			};
		case 'flowering':
			return {
				crown: { x: 40, y: 18 },
				trunkBase: { x: 40, y: 85 },
				roots: { x: 40, y: 100 },
			};
		case 'dried':
			return {
				crown: { x: 40, y: 40 },
				trunkBase: { x: 40, y: 88 },
				roots: { x: 40, y: 100 },
			};
	}
}
