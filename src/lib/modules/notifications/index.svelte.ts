import { createContext } from 'svelte';
import { invoke } from '@tauri-apps/api/core';
import type {
	NotificationConfig as GeneratedNotificationConfig,
	NotificationEventType,
} from '$lib/types/generated';

// ─── Narrowed types ──────────────────────────────────────────���────────────

/** NotificationConfig with event_type narrowed from string to NotificationEventType. */
// fallow-ignore-next-line unused-types
export interface NotificationConfig extends Omit<GeneratedNotificationConfig, 'event_type'> {
	event_type: NotificationEventType;
}

// ─── Frontend-only request types ──────────────────────────────────────────

// fallow-ignore-next-line unused-types
export interface UpdateNotificationConfigRequest {
	event_type: NotificationEventType;
	sound_enabled?: boolean;
	sound_file?: string | null;
	toast_enabled?: boolean;
	window_flash_enabled?: boolean;
}

// ─── Constants ────────────────────────────────────────────────────────────

/** Tailwind color classes for notification indicator dots. null = no dot shown. */
export const NOTIFICATION_DOT_COLORS: Record<NotificationEventType, string | null> = {
	'needs-input': 'bg-amber-400',
	'needs-review': 'bg-blue-400',
	errored: 'bg-red-400',
	finished: null,
	'pr-ready': null,
};

// ─── Context ──────────────────────────────────────────────────────────────

type NotificationsContext = ReturnType<typeof createNotificationsContext>;

const [useNotifications, setNotificationsInternal] = createContext<NotificationsContext>();
export { useNotifications };

export function setNotificationsContext() {
	const ctx = createNotificationsContext();
	setNotificationsInternal(ctx);
	return ctx;
}

// ─── Factory ──────────────────────────────────────────────────────────────

function createNotificationsContext() {
	let configs = $state<NotificationConfig[]>([]);
	let pendingNotifications = $state<Map<string, NotificationEventType>>(new Map());
	let loading = $state(false);

	return {
		get configs() {
			return configs;
		},
		get pendingNotifications() {
			return pendingNotifications;
		},
		get loading() {
			return loading;
		},

		async loadConfigs() {
			try {
				loading = true;
				configs = (await invoke<GeneratedNotificationConfig[]>(
					'get_notification_configs',
				)) as NotificationConfig[];
			} catch (err) {
				console.error('Failed to load notification configs:', err);
			} finally {
				loading = false;
			}
		},

		updateConfig(updated: NotificationConfig) {
			configs = configs.map((config) =>
				config.event_type === updated.event_type ? updated : config,
			);
		},

		addPending(sessionId: string, eventType: NotificationEventType) {
			const next = new Map(pendingNotifications);
			next.set(sessionId, eventType);
			pendingNotifications = next;
		},

		clearPending(sessionId: string) {
			if (!pendingNotifications.has(sessionId)) {
				return;
			}
			const next = new Map(pendingNotifications);
			next.delete(sessionId);
			pendingNotifications = next;
		},

		hasPending(sessionId: string): boolean {
			return pendingNotifications.has(sessionId);
		},

		getPendingType(sessionId: string): NotificationEventType | undefined {
			return pendingNotifications.get(sessionId);
		},

		// Notification commands (inlined)
		async updateNotificationConfig(
			request: UpdateNotificationConfigRequest,
		): Promise<NotificationConfig> {
			return invoke('update_notification_config', {
				request,
			}) as Promise<NotificationConfig>;
		},

		async testNotificationSound(eventType: string): Promise<void> {
			return invoke('test_notification_sound', { eventType });
		},
	};
}
