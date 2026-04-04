import type { TreeStage } from '$lib/types/tree_visualization';
import type { AttachmentPoints } from './types';

/**
 * Computes overlay attachment points for each tree stage.
 * Points are in SVG coordinate space (viewBox 0 0 100 150).
 * Crown zone: y 0–50, Trunk zone: y 50–110, Ground zone: y 110–150.
 */
export function compute_attachment_points(stage: TreeStage): AttachmentPoints {
	switch (stage) {
		case 'seed':
			return {
				crown: { x: 50, y: 95 },
				trunkBase: { x: 50, y: 110 },
				roots: { x: 50, y: 120 },
			};
		case 'sprouting':
			return {
				crown: { x: 50, y: 80 },
				trunkBase: { x: 50, y: 110 },
				roots: { x: 50, y: 120 },
			};
		case 'sapling':
			return {
				crown: { x: 50, y: 35 },
				trunkBase: { x: 50, y: 108 },
				roots: { x: 50, y: 120 },
			};
		case 'growing':
			return {
				crown: { x: 50, y: 28 },
				trunkBase: { x: 50, y: 108 },
				roots: { x: 50, y: 120 },
			};
		case 'leafy':
			return {
				crown: { x: 50, y: 18 },
				trunkBase: { x: 50, y: 105 },
				roots: { x: 50, y: 118 },
			};
		case 'fruiting':
			return {
				crown: { x: 50, y: 15 },
				trunkBase: { x: 50, y: 105 },
				roots: { x: 50, y: 118 },
			};
		case 'autumn':
			return {
				crown: { x: 50, y: 18 },
				trunkBase: { x: 50, y: 105 },
				roots: { x: 50, y: 118 },
			};
		case 'ready':
			return {
				crown: { x: 50, y: 12 },
				trunkBase: { x: 50, y: 105 },
				roots: { x: 50, y: 118 },
			};
		case 'bare':
			return {
				crown: { x: 50, y: 20 },
				trunkBase: { x: 50, y: 108 },
				roots: { x: 50, y: 120 },
			};
		case 'dead':
			return {
				crown: { x: 50, y: 30 },
				trunkBase: { x: 50, y: 108 },
				roots: { x: 50, y: 120 },
			};
		case 'stump':
			return {
				crown: { x: 50, y: 90 },
				trunkBase: { x: 50, y: 110 },
				roots: { x: 50, y: 120 },
			};
	}
}
