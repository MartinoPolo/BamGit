import type { AchievementKind } from '$lib/types/generated/index.js';

export const LOCKED_ACHIEVEMENT_KINDS = new Set<AchievementKind>([
	'forest-keeper',
	'conflict-resolver',
]);

const LOCKED_TOOLTIPS: Partial<Record<AchievementKind, string>> = {
	'forest-keeper': 'Requires AFK/HITL workflow',
	'conflict-resolver': 'Requires conflict resolution',
};

export function isLockedAchievement(kind: AchievementKind): boolean {
	return LOCKED_ACHIEVEMENT_KINDS.has(kind);
}

export function getLockedAchievementTooltip(kind: AchievementKind): string {
	return LOCKED_TOOLTIPS[kind] ?? '';
}
