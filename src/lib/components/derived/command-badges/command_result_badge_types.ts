import type { BadgeStyle } from '$lib/components/shadcn/badge/index.js';

export const COMMAND_RESULT_STATES = ['running', 'passed', 'failed', 'timeout', 'stopped'] as const;
/** @public */
export type CommandResultState = (typeof COMMAND_RESULT_STATES)[number];

/** @public */
export interface CommandResultBadgeProps {
	state: CommandResultState;
	commandName: string;
	isStale?: boolean;
	badgeStyle?: BadgeStyle;
	restartCount?: number;
	maxRestarts?: number;
}
