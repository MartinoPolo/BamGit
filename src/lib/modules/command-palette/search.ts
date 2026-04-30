import { CATEGORY_DISPLAY_ORDER } from './types.js';
import type { CommandPaletteCategory, CommandPaletteItem } from './types.js';

export function filterItems(
	items: readonly CommandPaletteItem[],
	query: string,
): CommandPaletteItem[] {
	const trimmedQuery = query.trim().toLowerCase();

	if (trimmedQuery === '') {
		return [...items];
	}

	return items.filter((item) => {
		const labelMatch = item.label.toLowerCase().includes(trimmedQuery);
		const descriptionMatch = item.description?.toLowerCase().includes(trimmedQuery) ?? false;
		return labelMatch || descriptionMatch;
	});
}

export function groupByCategory(
	items: readonly CommandPaletteItem[],
): Map<CommandPaletteCategory, CommandPaletteItem[]> {
	const categoryItemsLookup = new Map<CommandPaletteCategory, CommandPaletteItem[]>();

	for (const item of items) {
		const existing = categoryItemsLookup.get(item.category);
		if (existing) {
			existing.push(item);
		} else {
			categoryItemsLookup.set(item.category, [item]);
		}
	}

	const orderedResult = new Map<CommandPaletteCategory, CommandPaletteItem[]>();

	for (const category of CATEGORY_DISPLAY_ORDER) {
		const categoryItems = categoryItemsLookup.get(category);
		if (categoryItems) {
			orderedResult.set(category, categoryItems);
		}
	}

	return orderedResult;
}

export function flattenGrouped(
	grouped: Map<CommandPaletteCategory, CommandPaletteItem[]>,
): CommandPaletteItem[] {
	const result: CommandPaletteItem[] = [];

	for (const items of grouped.values()) {
		result.push(...items);
	}

	return result;
}
