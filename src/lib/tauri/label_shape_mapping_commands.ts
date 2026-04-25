import { invoke } from '@tauri-apps/api/core';
import type { LabelShapeMapping } from '$lib/types/label_shape_mapping';

export async function getLabelShapeMappings(dashboardId: string): Promise<LabelShapeMapping[]> {
	return invoke('get_label_shape_mappings', { dashboardId });
}

export async function upsertLabelShapeMapping(
	dashboardId: string,
	labelName: string,
	treeShape: string,
	color: string | null,
	priorityOrder: number,
): Promise<LabelShapeMapping> {
	return invoke('upsert_label_shape_mapping', {
		dashboardId,
		labelName,
		treeShape,
		color,
		priorityOrder,
	});
}
