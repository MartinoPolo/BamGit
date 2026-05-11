export const DIALOG_TONE_OPTIONS = ['standard', 'destructive'] as const;

export type DialogTone = (typeof DIALOG_TONE_OPTIONS)[number];

export const dialogEyebrowColors = {
	standard: 'text-foreground-subtle',
	destructive: 'text-status-danger',
} as const satisfies Record<DialogTone, string>;
