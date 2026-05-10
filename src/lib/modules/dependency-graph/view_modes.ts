export const VIEW_MODE = {
	global: 'global',
	prds: 'prds',
	singlePrd: 'single-prd',
} as const;

export type ViewMode = (typeof VIEW_MODE)[keyof typeof VIEW_MODE];
