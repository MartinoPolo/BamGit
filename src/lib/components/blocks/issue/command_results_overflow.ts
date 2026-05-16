const MAX_VISIBLE_COMMAND_RESULTS = 3;

export function computeCommandResultsOverflow(resultCount: number): {
	visibleCount: number;
	overflowCount: number;
} {
	const visibleCount = Math.min(resultCount, MAX_VISIBLE_COMMAND_RESULTS);
	const overflowCount = Math.max(0, resultCount - MAX_VISIBLE_COMMAND_RESULTS);
	return { visibleCount, overflowCount };
}
