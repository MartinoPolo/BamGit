export type NotificationEventType =
	| 'needs-input'
	| 'needs-review'
	| 'finished'
	| 'errored'
	| 'pr-ready';

export interface NotificationConfig {
	event_type: NotificationEventType;
	sound_enabled: boolean;
	sound_file: string | null;
	toast_enabled: boolean;
	window_flash_enabled: boolean;
}

export interface UpdateNotificationConfigRequest {
	event_type: NotificationEventType;
	sound_enabled?: boolean;
	sound_file?: string | null;
	toast_enabled?: boolean;
	window_flash_enabled?: boolean;
}

/** Tailwind color classes for notification indicator dots. null = no dot shown. */
export const NOTIFICATION_DOT_COLORS: Record<NotificationEventType, string | null> = {
	'needs-input': 'bg-amber-400',
	'needs-review': 'bg-blue-400',
	errored: 'bg-red-400',
	finished: null,
	'pr-ready': null,
};
