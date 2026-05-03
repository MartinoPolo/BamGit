<script lang="ts">
	import * as m from '$lib/paraglide/messages.js';
	import {
		TREE_CONTEXT_MENU_ACTIONS,
		type TreeContextMenuAction,
	} from '$lib/modules/visualization';
	import { isContextMenuActionEnabled } from './forest_context_menu_utils.js';
	import { clickOutside } from '$lib/actions/click_outside.js';
	import GlobeIcon from '@lucide/svelte/icons/globe';
	import GitBranchIcon from '@lucide/svelte/icons/git-branch';
	import PlayIcon from '@lucide/svelte/icons/play';
	import ArchiveIcon from '@lucide/svelte/icons/archive';
	import PaletteIcon from '@lucide/svelte/icons/palette';
	import ScissorsIcon from '@lucide/svelte/icons/scissors';

	interface Props {
		x: number;
		y: number;
		onaction: (action: TreeContextMenuAction) => void;
		ondismiss: () => void;
	}

	let { x, y, onaction, ondismiss }: Props = $props();

	interface MenuItem {
		readonly action: TreeContextMenuAction;
		readonly label: () => string;
		readonly icon: typeof GlobeIcon;
	}

	const menuItems: readonly MenuItem[] = [
		{
			action: TREE_CONTEXT_MENU_ACTIONS.openGithub,
			label: () => m.forest_menu_open_github(),
			icon: GlobeIcon,
		},
		{
			action: TREE_CONTEXT_MENU_ACTIONS.openWorktree,
			label: () => m.forest_menu_open_worktree(),
			icon: GitBranchIcon,
		},
		{
			action: TREE_CONTEXT_MENU_ACTIONS.startSession,
			label: () => m.forest_menu_start_session(),
			icon: PlayIcon,
		},
		{
			action: TREE_CONTEXT_MENU_ACTIONS.archive,
			label: () => m.forest_menu_archive(),
			icon: ArchiveIcon,
		},
		{
			action: TREE_CONTEXT_MENU_ACTIONS.changeColor,
			label: () => m.forest_menu_change_color(),
			icon: PaletteIcon,
		},
		{
			action: TREE_CONTEXT_MENU_ACTIONS.pruneWorktree,
			label: () => m.forest_menu_prune_worktree(),
			icon: ScissorsIcon,
		},
	];

	let focusedIndex = $state(0);
	let containerElement: HTMLDivElement | undefined = $state();

	function findNextEnabledIndex(currentIndex: number, direction: 1 | -1): number {
		const count = menuItems.length;
		let index = currentIndex;
		for (let i = 0; i < count; i++) {
			index = (index + direction + count) % count;
			if (isContextMenuActionEnabled(menuItems[index].action)) {
				return index;
			}
		}
		return currentIndex;
	}

	function handleKeydown(event: KeyboardEvent) {
		switch (event.key) {
			case 'ArrowDown':
				event.preventDefault();
				focusedIndex = findNextEnabledIndex(focusedIndex, 1);
				break;
			case 'ArrowUp':
				event.preventDefault();
				focusedIndex = findNextEnabledIndex(focusedIndex, -1);
				break;
			case 'Enter':
				event.preventDefault();
				if (isContextMenuActionEnabled(menuItems[focusedIndex].action)) {
					handleItemClick(menuItems[focusedIndex].action);
				}
				break;
			case 'Escape':
				event.preventDefault();
				ondismiss();
				break;
		}
	}

	function handleItemClick(action: TreeContextMenuAction) {
		onaction(action);
		ondismiss();
	}

	$effect(() => {
		containerElement?.focus();
	});
</script>

<div
	class="fixed z-50 min-w-[160px] rounded-md border border-border bg-popover p-1 shadow-md"
	style:left="{x}px"
	style:top="{y}px"
	use:clickOutside={ondismiss}
	role="menu"
	tabindex="-1"
	bind:this={containerElement}
	onkeydown={handleKeydown}
>
	{#each menuItems as item, i (item.action)}
		<button
			type="button"
			class="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-popover-foreground transition-colors hover:bg-accent hover:text-accent-foreground disabled:pointer-events-none disabled:opacity-50 data-[focused]:bg-accent data-[focused]:text-accent-foreground"
			role="menuitem"
			disabled={!isContextMenuActionEnabled(item.action)}
			onclick={() => handleItemClick(item.action)}
			onmouseenter={() => (focusedIndex = i)}
			data-focused={focusedIndex === i ? '' : undefined}
		>
			<item.icon class="size-4" />
			{item.label()}
		</button>
	{/each}
</div>
