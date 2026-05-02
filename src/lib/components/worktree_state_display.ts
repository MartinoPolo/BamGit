import type { WorktreeState } from '$lib/modules/issues';

interface WorktreeStateDisplayEntry {
	readonly iconName: string;
	readonly colorClass: string;
	readonly animate: boolean;
}

export const WORKTREE_STATE_DISPLAY = {
	active: { iconName: 'circle-check', colorClass: 'text-green-500', animate: false },
	failed: { iconName: 'circle-x', colorClass: 'text-red-500', animate: false },
	pending: { iconName: 'loader-circle', colorClass: 'text-orange-400', animate: true },
	none: { iconName: 'circle', colorClass: 'text-muted-foreground', animate: false },
	removing: { iconName: 'circle', colorClass: 'text-muted-foreground', animate: false },
	removed: { iconName: 'circle', colorClass: 'text-muted-foreground', animate: false },
} as const satisfies Record<WorktreeState, WorktreeStateDisplayEntry>;
