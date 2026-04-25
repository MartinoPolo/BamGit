import type { NotificationConfig, NotificationEventType } from '$lib/types/notification';
import { getNotificationConfigs } from '$lib/tauri/notification_commands';

let configs = $state<NotificationConfig[]>([]);
let pendingNotifications = $state<Map<string, NotificationEventType>>(new Map());
let loading = $state(false);

export function getNotificationStore() {
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
				configs = await getNotificationConfigs();
			} catch (error) {
				console.error('Failed to load notification configs:', error);
			} finally {
				loading = false;
			}
		},

		updateConfig(updated: NotificationConfig) {
			configs = configs.map((config) =>
				config.event_type === updated.event_type ? updated : config,
			);
		},

		/** Mark a session as having a pending notification. */
		addPending(sessionId: string, eventType: NotificationEventType) {
			const next = new Map(pendingNotifications);
			next.set(sessionId, eventType);
			pendingNotifications = next;
		},

		/** Clear pending notification for a session (user acknowledged it). */
		clearPending(sessionId: string) {
			if (!pendingNotifications.has(sessionId)) {
				return;
			}
			const next = new Map(pendingNotifications);
			next.delete(sessionId);
			pendingNotifications = next;
		},

		/** Check if a session has a pending notification. */
		hasPending(sessionId: string): boolean {
			return pendingNotifications.has(sessionId);
		},

		/** Get the notification event type for a session. */
		getPendingType(sessionId: string): NotificationEventType | undefined {
			return pendingNotifications.get(sessionId);
		},
	};
}
