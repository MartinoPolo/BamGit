import { describe, it, expect } from 'vitest';
import { groupByCategory } from './search.js';
import type { CommandPaletteItem } from './types.js';

function makeItem(overrides: Partial<CommandPaletteItem> & { id: string }): CommandPaletteItem {
	return {
		category: 'actions',
		label: 'Test Action',
		onSelect: () => {},
		...overrides,
	};
}

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
