import type { BadgeStyleOption, IssueCardAppearanceSettings } from './issue_card_settings.js';

/** Returns the alternate badge style: solid → outlined, anything else → solid. */
export function getComparisonBadgeStyle(current: BadgeStyleOption): BadgeStyleOption {
	return current === 'solid' ? 'outlined' : 'solid';
}

export function applyComparisonOverride(
	settings: IssueCardAppearanceSettings,
	comparisonEnabled: boolean,
): IssueCardAppearanceSettings {
	if (!comparisonEnabled) {
		return settings;
	}
	return {
		...settings,
		badgeStyle: getComparisonBadgeStyle(settings.badgeStyle),
	};
}
