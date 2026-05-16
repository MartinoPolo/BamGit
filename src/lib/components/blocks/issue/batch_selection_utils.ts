/**
 * Compute the range of issue IDs between anchor and target in a flat visual order.
 * Always returns IDs in forward (array) order regardless of anchor/target positions.
 * Falls back to [targetId] if either ID is missing from the order array.
 */
export function computeRangeSelection(
	anchorId: string,
	targetId: string,
	flatOrder: readonly string[],
): string[] {
	const anchorIndex = flatOrder.indexOf(anchorId);
	const targetIndex = flatOrder.indexOf(targetId);

	if (anchorIndex === -1 || targetIndex === -1) {
		return [targetId];
	}

	const startIndex = Math.min(anchorIndex, targetIndex);
	const endIndex = Math.max(anchorIndex, targetIndex);

	return flatOrder.slice(startIndex, endIndex + 1);
}

export const CARD_STATE_CLASSES = {
	active: 'card-state-active-ic',
	hovered: 'card-state-hovered-ic',
	selectionHover: 'card-state-selection-hover',
	selected: 'card-state-selected-primary',
	loading: 'pointer-events-none',
	archived: 'opacity-70 grayscale-[0.8]',
	error: 'border-l-0.75 border-l-destructive',
	disabled: 'opacity-42 pointer-events-none',
} as const;

export const BATCH_SELECTED_GLOW_COLOR = 'var(--primary)';

/**
 * Compute the merged batch selection combining individually-selected IDs (Ctrl+click)
 * with a range selection (Shift+click). Implements the Windows Explorer shift-deselect pattern:
 * the range is always recomputed from anchor to target, and merged with the individual set.
 */
export function computeMergedBatchSelection(
	individuallySelectedIds: ReadonlySet<string>,
	anchorId: string | null,
	targetId: string,
	flatOrder: readonly string[],
): { mergedIds: Set<string>; rangeIds: Set<string> } {
	if (anchorId === null) {
		const mergedIds = new Set(individuallySelectedIds);
		mergedIds.add(targetId);
		return { mergedIds, rangeIds: new Set([targetId]) };
	}

	const rangeIds = new Set(computeRangeSelection(anchorId, targetId, flatOrder));

	const mergedIds = new Set(individuallySelectedIds);
	for (const id of rangeIds) {
		mergedIds.add(id);
	}

	return { mergedIds, rangeIds };
}
