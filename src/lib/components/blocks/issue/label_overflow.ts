const MAX_VISIBLE_LABELS = 3;

export function computeLabelOverflow(labelCount: number): {
	visibleCount: number;
	overflowCount: number;
} {
	const visibleCount = Math.min(labelCount, MAX_VISIBLE_LABELS);
	const overflowCount = Math.max(0, labelCount - MAX_VISIBLE_LABELS);
	return { visibleCount, overflowCount };
}
