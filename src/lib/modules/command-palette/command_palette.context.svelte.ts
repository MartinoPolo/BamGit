import { createContext } from 'svelte';
import { SvelteMap } from 'svelte/reactivity';
import { goto } from '$app/navigation';
import { resolve } from '$app/paths';
import { StateRaw } from '$lib/reactivity/state.svelte.js';
import { useBoard } from '$lib/modules/board/index.js';
import { useActions } from '$lib/modules/actions/index.js';
import { useIssues } from '$lib/modules/issues/index.js';
import { useKeyboardShortcuts } from '$lib/modules/keyboard-shortcuts/index.js';
import { filterItems, groupByCategory, flattenGrouped } from './search.js';
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
	const actionsCtx = useActions();
	const issuesCtx = useIssues();
	const shortcutsCtx = useKeyboardShortcuts();

	const open = new StateRaw(false);
	const query = new StateRaw('');
	const selectedIndex = new StateRaw(0);

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
			onSelect: () => void goto(resolve('/settings')),
		},
	];

	// ── Built-in utility items ─────────────────────────────────────────────

	const utilityItems: CommandPaletteItem[] = [
		{
			id: 'util-toggle-theme',
			category: COMMAND_PALETTE_CATEGORIES.actions,
			label: 'Toggle Theme',
			get description() {
				return `Current: ${boardStore.theme.mode}`;
			},
			onSelect: () => {
				const currentIndex = themeCycleOrder.indexOf(boardStore.theme.mode);
				const nextIndex = (currentIndex + 1) % themeCycleOrder.length;
				boardStore.theme.mode = themeCycleOrder[nextIndex];
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
	const filteredItems = $derived(filterItems(allItems, query.current));
	const groupedResults = $derived(groupByCategory(filteredItems));
	const flatResults = $derived(flattenGrouped(groupedResults));
	const resultCount = $derived(flatResults.length);

	const flatIndexByItemId = $derived.by(() => {
		const map = new SvelteMap<string, number>();
		for (let index = 0; index < flatResults.length; index++) {
			map.set(flatResults[index].id, index);
		}
		return map;
	});

	// ── Methods ────────────────────────────────────────────────────────────

	function resetState() {
		query.current = '';
		selectedIndex.current = 0;
	}

	function toggle() {
		if (open.current) {
			close();
		} else {
			open.current = true;
			resetState();
		}
	}

	function close() {
		open.current = false;
		resetState();
	}

	function selectNext() {
		if (resultCount === 0) {
			return;
		}
		selectedIndex.current = (selectedIndex.current + 1) % resultCount;
	}

	function selectPrevious() {
		if (resultCount === 0) {
			return;
		}
		selectedIndex.current = (selectedIndex.current - 1 + resultCount) % resultCount;
	}

	function executeSelected() {
		if (resultCount === 0) {
			return;
		}
		const item = flatResults[selectedIndex.current];
		if (item !== undefined) {
			item.onSelect();
			close();
		}
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
			if (!value) {
				resetState();
			}
		},
		get query() {
			return query.current;
		},
		set query(value: string) {
			query.current = value;
			selectedIndex.current = 0;
		},
		get selectedIndex() {
			return selectedIndex.current;
		},
		set selectedIndex(value: number) {
			selectedIndex.current = value;
		},
		get groupedResults(): Map<CommandPaletteCategory, CommandPaletteItem[]> {
			return groupedResults;
		},
		get flatResults(): CommandPaletteItem[] {
			return flatResults;
		},
		get resultCount() {
			return resultCount;
		},
		get flatIndexByItemId(): Map<string, number> {
			return flatIndexByItemId;
		},

		toggle,
		close,
		selectNext,
		selectPrevious,
		executeSelected,
		executeItem,
	};
}
