/** @public */
export type SelectAllCheckboxState = 'all' | 'some' | 'none';

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

/**
 * Compute the select-all checkbox state based on selected vs total count.
 */
export function computeSelectAllCheckboxState(
	selectedCount: number,
	totalCount: number,
): SelectAllCheckboxState {
	if (totalCount === 0) {
		return 'none';
	}
	if (selectedCount === totalCount) {
		return 'all';
	}
	if (selectedCount > 0) {
		return 'some';
	}
	return 'none';
}

export const CARD_STATE_CLASSES = {
	active: 'ring-2 ring-ring shadow-[0_0_12px_color-mix(in_oklch,var(--ring)_25%,transparent)]',
	selected: 'ring-2 ring-primary bg-[color-mix(in_oklch,var(--primary)_4%,var(--surface))]',
	selectionReady:
		'ring-1 ring-[#c084fc] shadow-md bg-[color-mix(in_oklch,oklch(0.700_0.200_300)_4%,var(--surface))]',
	dragging: 'rotate-[-1.5deg] scale-[1.02] shadow-lg opacity-92',
	loading: 'pointer-events-none',
	archived: 'opacity-70 grayscale-[0.8]',
	error: 'border-l-[3px] border-l-destructive',
	disabled: 'opacity-42 pointer-events-none',
} as const;

export const BATCH_SELECTED_GLOW_COLOR = '#ec4899';
