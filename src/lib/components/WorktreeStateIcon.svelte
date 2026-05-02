<script lang="ts">
	import type { WorktreeState } from '$lib/modules/issues';
	import { WORKTREE_STATE_DISPLAY } from './worktree_state_display.js';
	import CircleCheckIcon from '@lucide/svelte/icons/circle-check';
	import CircleXIcon from '@lucide/svelte/icons/circle-x';
	import LoaderCircleIcon from '@lucide/svelte/icons/loader-circle';
	import CircleIcon from '@lucide/svelte/icons/circle';

	interface Props {
		worktreeState: WorktreeState;
		class?: string;
	}

	let { worktreeState, class: className = '' }: Props = $props();

	const ICON_MAP = {
		'circle-check': CircleCheckIcon,
		'circle-x': CircleXIcon,
		'loader-circle': LoaderCircleIcon,
		circle: CircleIcon,
	} as const;

	const display = $derived(WORKTREE_STATE_DISPLAY[worktreeState]);
	const IconComponent = $derived(ICON_MAP[display.iconName]);
</script>

<IconComponent
	class="{display.colorClass} {display.animate ? 'animate-spin' : ''} {className}"
	size={14}
/>
