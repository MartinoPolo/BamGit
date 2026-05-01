<script lang="ts">
	import {
		TREE_CONTEXT_MENU_ACTIONS,
		type TreeContextMenuAction,
	} from '$lib/modules/visualization';
	import { clickOutside } from '$lib/actions/click_outside.js';
	import GlobeIcon from '@lucide/svelte/icons/globe';
	import GitBranchIcon from '@lucide/svelte/icons/git-branch';
	import PlayIcon from '@lucide/svelte/icons/play';
	import ArchiveIcon from '@lucide/svelte/icons/archive';
	import PaletteIcon from '@lucide/svelte/icons/palette';

	interface Props {
		x: number;
		y: number;
		onaction: (action: TreeContextMenuAction) => void;
		ondismiss: () => void;
	}

	let { x, y, onaction, ondismiss }: Props = $props();

	interface MenuItem {
		readonly action: TreeContextMenuAction;
		readonly label: string;
		readonly icon: typeof GlobeIcon;
	}

	const menuItems: readonly MenuItem[] = [
		{ action: TREE_CONTEXT_MENU_ACTIONS.openGithub, label: 'Open GitHub', icon: GlobeIcon },
		{
			action: TREE_CONTEXT_MENU_ACTIONS.openWorktree,
			label: 'Open Worktree',
			icon: GitBranchIcon,
		},
		{ action: TREE_CONTEXT_MENU_ACTIONS.startSession, label: 'Start Session', icon: PlayIcon },
		{ action: TREE_CONTEXT_MENU_ACTIONS.archive, label: 'Archive', icon: ArchiveIcon },
		{ action: TREE_CONTEXT_MENU_ACTIONS.changeColor, label: 'Change Color', icon: PaletteIcon },
	];

	function handleItemClick(action: TreeContextMenuAction) {
		onaction(action);
		ondismiss();
	}
</script>

<div
	class="fixed z-50 min-w-[160px] rounded-md border border-border bg-popover p-1 shadow-md"
	style:left="{x}px"
	style:top="{y}px"
	use:clickOutside={ondismiss}
	role="menu"
>
	{#each menuItems as item (item.action)}
		<button
			type="button"
			class="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-popover-foreground transition-colors hover:bg-accent hover:text-accent-foreground disabled:pointer-events-none disabled:opacity-50"
			role="menuitem"
			disabled
			onclick={() => handleItemClick(item.action)}
		>
			<item.icon class="size-4" />
			{item.label}
		</button>
	{/each}
</div>
