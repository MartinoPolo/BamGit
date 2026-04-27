import { createContext } from 'svelte';
import { SvelteMap } from 'svelte/reactivity';
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
	let pendingNotifications = $state(new SvelteMap<string, NotificationEventType>());
	let loading = $state(false);
	let error = $state<string | null>(null);

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
		get error() {
			return error;
		},

		async loadConfigs() {
			try {
				loading = true;
				error = null;
				configs = (await invoke<GeneratedNotificationConfig[]>(
					'get_notification_configs',
				)) as NotificationConfig[];
			} catch (err) {
				error = String(err);
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
			pendingNotifications.set(sessionId, eventType);
		},

		clearPending(sessionId: string) {
			pendingNotifications.delete(sessionId);
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
