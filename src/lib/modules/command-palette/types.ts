export const COMMAND_PALETTE_CATEGORIES = {
	actions: 'actions',
	navigation: 'navigation',
	issues: 'issues',
} as const;

export type CommandPaletteCategory =
	(typeof COMMAND_PALETTE_CATEGORIES)[keyof typeof COMMAND_PALETTE_CATEGORIES];

export const CATEGORY_DISPLAY_ORDER: CommandPaletteCategory[] = ['actions', 'navigation', 'issues'];

export interface CommandPaletteItem {
	id: string;
	category: CommandPaletteCategory;
	label: string;
	description?: string;
	shortcut?: string;
	onSelect: () => void;
}
