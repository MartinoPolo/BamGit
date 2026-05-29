export const BADGE_STYLE_OPTIONS = ['solid', 'subtle', 'outlined'] as const;
export type BadgeStyleOption = (typeof BADGE_STYLE_OPTIONS)[number];
