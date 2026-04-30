import { describe, it, expect } from 'vitest';
import { filterItems, groupByCategory, flattenGrouped } from './search.js';
import type { CommandPaletteItem } from './types.js';

function makeItem(overrides: Partial<CommandPaletteItem> & { id: string }): CommandPaletteItem {
	return {
		category: 'actions',
		label: 'Test Action',
		onSelect: () => {},
		...overrides,
	};
}

describe('filterItems', () => {
	const items: CommandPaletteItem[] = [
		makeItem({ id: 'a1', label: 'Switch to forest view', category: 'navigation' }),
		makeItem({ id: 'a2', label: 'Create new issue', description: 'session running' }),
		makeItem({ id: 'a3', label: 'Open settings' }),
	];

	it('returns all items when query is empty string', () => {
		const result = filterItems(items, '');
		expect(result).toHaveLength(3);
		expect(result).toEqual(items);
	});

	it('matches substring in label (case-insensitive)', () => {
		const result = filterItems(items, 'for');
		expect(result).toHaveLength(1);
		expect(result[0].id).toBe('a1');
	});

	it('matches substring in description', () => {
		const result = filterItems(items, 'running');
		expect(result).toHaveLength(1);
		expect(result[0].id).toBe('a2');
	});

	it('returns empty array when nothing matches', () => {
		const result = filterItems(items, 'zzzznotfound');
		expect(result).toHaveLength(0);
	});

	it('returns all items when query is whitespace-only', () => {
		const result = filterItems(items, '   ');
		expect(result).toHaveLength(3);
		expect(result).toEqual(items);
	});
});

describe('groupByCategory', () => {
	it('groups items by their category field', () => {
		const items: CommandPaletteItem[] = [
			makeItem({ id: 'a1', category: 'actions' }),
			makeItem({ id: 'n1', category: 'navigation' }),
			makeItem({ id: 'a2', category: 'actions' }),
		];

		const grouped = groupByCategory(items);

		expect(grouped.get('actions')).toHaveLength(2);
		expect(grouped.get('navigation')).toHaveLength(1);
	});

	it('preserves display order: actions, navigation, issues', () => {
		const items: CommandPaletteItem[] = [
			makeItem({ id: 'i1', category: 'issues' }),
			makeItem({ id: 'n1', category: 'navigation' }),
			makeItem({ id: 'a1', category: 'actions' }),
		];

		const grouped = groupByCategory(items);
		const keys = [...grouped.keys()];

		expect(keys).toEqual(['actions', 'navigation', 'issues']);
	});

	it('omits categories with no items', () => {
		const items: CommandPaletteItem[] = [
			makeItem({ id: 'a1', category: 'actions' }),
			makeItem({ id: 'i1', category: 'issues' }),
		];

		const grouped = groupByCategory(items);

		expect(grouped.has('navigation')).toBe(false);
		expect(grouped.size).toBe(2);
	});
});

describe('flattenGrouped', () => {
	it('produces a flat array in category order', () => {
		const items: CommandPaletteItem[] = [
			makeItem({ id: 'i1', category: 'issues', label: 'Issue 1' }),
			makeItem({ id: 'a1', category: 'actions', label: 'Action 1' }),
			makeItem({ id: 'n1', category: 'navigation', label: 'Nav 1' }),
		];

		const grouped = groupByCategory(items);
		const flat = flattenGrouped(grouped);

		expect(flat.map((item) => item.id)).toEqual(['a1', 'n1', 'i1']);
	});

	it('returns empty array when given empty map', () => {
		const emptyMap = new Map();
		const result = flattenGrouped(emptyMap);

		expect(result).toEqual([]);
		expect(result).toHaveLength(0);
	});
});
