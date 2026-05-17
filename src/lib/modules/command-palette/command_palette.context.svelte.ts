import { createContext } from 'svelte';
import { goto } from '$app/navigation';
import { resolve } from '$app/paths';
import { StateRaw } from '$lib/reactivity/state.svelte.js';
import { useBoard } from '$lib/modules/board/index.js';
import { useSettings } from '$lib/modules/settings/index.js';
import { useActions } from '$lib/modules/actions/index.js';
import { useIssues } from '$lib/modules/issues/index.js';
import { useKeyboardShortcuts } from '$lib/modules/keyboard-shortcuts/index.js';
import { groupByCategory } from './search.js';
import { COMMAND_PALETTE_CATEGORIES } from './types.js';
import type { CommandPaletteCategory, CommandPaletteItem } from './types.js';
import type { ThemeMode } from '$lib/modules/board/index.js';

// ─── Context ──────────────────────────────────────────────────────────────────

type CommandPaletteContext = ReturnType<typeof createCommandPaletteContext>;

const [useCommandPalette, setCommandPaletteInternal] = createContext<CommandPaletteContext>();
export { useCommandPalette };

export function setCommandPaletteContext() {
	const ctx = createCommandPaletteContext();
	setCommandPaletteInternal(ctx);
	return ctx;
}

// ─── Factory ──────────────────────────────────────────────────────────────────

function createCommandPaletteContext() {
	const themeCycleOrder: ThemeMode[] = ['light', 'dark', 'system'];

	const boardStore = useBoard();
	const settingsCtx = useSettings();
	const actionsCtx = useActions();
	const issuesCtx = useIssues();
	const shortcutsCtx = useKeyboardShortcuts();

	const open = new StateRaw(false);

	// ── Built-in navigation items ──────────────────────────────────────────

	const navigationItems: CommandPaletteItem[] = [
		{
			id: 'nav-dashboard',
			category: COMMAND_PALETTE_CATEGORIES.navigation,
			label: 'Go to Dashboard',
			onSelect: () => void goto(resolve('/')),
		},
		{
			id: 'nav-sessions',
			category: COMMAND_PALETTE_CATEGORIES.navigation,
			label: 'Go to Sessions',
			onSelect: () => void goto(resolve('/sessions')),
		},
		{
			id: 'nav-settings',
			category: COMMAND_PALETTE_CATEGORIES.navigation,
			label: 'Go to Settings',
			shortcut: shortcutsCtx.getBindingForDisplay('open-settings'),
			onSelect: () => void goto(resolve('/settings/general')),
		},
	];

	// ── Built-in utility items ─────────────────────────────────────────────

	const utilityItems: CommandPaletteItem[] = [
		{
			id: 'util-toggle-theme',
			category: COMMAND_PALETTE_CATEGORIES.actions,
			label: 'Toggle Theme',
			get description() {
				return `Current: ${settingsCtx.getThemeMode()}`;
			},
			onSelect: () => {
				const currentIndex = themeCycleOrder.indexOf(
					settingsCtx.getThemeMode() as ThemeMode,
				);
				const nextIndex = (currentIndex + 1) % themeCycleOrder.length;
				void settingsCtx.set('themeMode', themeCycleOrder[nextIndex]);
			},
		},
		{
			id: 'util-toggle-sidebar',
			category: COMMAND_PALETTE_CATEGORIES.actions,
			label: 'Toggle Sidebar',
			shortcut: shortcutsCtx.getBindingForDisplay('toggle-sidebar'),
			onSelect: () => boardStore.toggleSidebar(),
		},
	];

	// ── Derived items ──────────────────────────────────────────────────────

	const actionItems = $derived(
		actionsCtx.visibleActions.map(
			(action): CommandPaletteItem => ({
				id: `action-${action.id}`,
				category: COMMAND_PALETTE_CATEGORIES.actions,
				label: action.name,
				onSelect: () => {},
			}),
		),
	);

	const issueItems = $derived(
		issuesCtx.activeIssues.map(
			(issue): CommandPaletteItem => ({
				id: `issue-${issue.id}`,
				category: COMMAND_PALETTE_CATEGORIES.issues,
				label:
					issue.github_issue_number !== null
						? `#${issue.github_issue_number} ${issue.name}`
						: issue.name,
				description: issue.status,
				onSelect: () => {},
			}),
		),
	);

	const allItems = $derived([...utilityItems, ...actionItems, ...navigationItems, ...issueItems]);
	const groupedResults = $derived(groupByCategory(allItems));

	// ── Methods ────────────────────────────────────────────────────────────

	function toggle() {
		if (open.current) {
			close();
		} else {
			open.current = true;
		}
	}

	function close() {
		open.current = false;
	}

	function executeItem(item: CommandPaletteItem) {
		item.onSelect();
		close();
	}

	return {
		get open() {
			return open.current;
		},
		set open(value: boolean) {
			open.current = value;
		},
		get groupedResults(): Map<CommandPaletteCategory, CommandPaletteItem[]> {
			return groupedResults;
		},

		toggle,
		close,
		executeItem,
	};
}
