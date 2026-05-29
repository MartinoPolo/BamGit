import { describe, it, expect } from 'vitest';
import {
	isLockedAchievement,
	getLockedAchievementTooltip,
	LOCKED_ACHIEVEMENT_KINDS,
} from './locked_achievements.js';

describe('LOCKED_ACHIEVEMENT_KINDS', () => {
	it('contains forest-keeper and conflict-resolver', () => {
		expect(LOCKED_ACHIEVEMENT_KINDS.has('forest-keeper')).toBe(true);
		expect(LOCKED_ACHIEVEMENT_KINDS.has('conflict-resolver')).toBe(true);
	});

	it('does not contain other achievement kinds', () => {
		expect(LOCKED_ACHIEVEMENT_KINDS.has('first-seed')).toBe(false);
		expect(LOCKED_ACHIEVEMENT_KINDS.has('cache-master')).toBe(false);
	});
});

describe('isLockedAchievement', () => {
	it('returns true for forest-keeper', () => {
		expect(isLockedAchievement('forest-keeper')).toBe(true);
	});

	it('returns true for conflict-resolver', () => {
		expect(isLockedAchievement('conflict-resolver')).toBe(true);
	});

	it('returns false for regular achievement kinds', () => {
		expect(isLockedAchievement('first-seed')).toBe(false);
		expect(isLockedAchievement('one-shot-wonder')).toBe(false);
		expect(isLockedAchievement('big-spender')).toBe(false);
	});
});

describe('getLockedAchievementTooltip', () => {
	it('returns AFK/HITL tooltip for forest-keeper', () => {
		expect(getLockedAchievementTooltip('forest-keeper')).toBe('Requires AFK/HITL workflow');
	});

	it('returns conflict resolution tooltip for conflict-resolver', () => {
		expect(getLockedAchievementTooltip('conflict-resolver')).toBe(
			'Requires conflict resolution',
		);
	});

	it('returns empty string for non-locked achievement kinds', () => {
		expect(getLockedAchievementTooltip('first-seed')).toBe('');
	});
});
