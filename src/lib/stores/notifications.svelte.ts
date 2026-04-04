import type { NotificationConfig, NotificationEventType } from '$lib/types/notification';
import { get_notification_configs } from '$lib/tauri/notification_commands';

let configs = $state<NotificationConfig[]>([]);
let pending_notifications = $state<Map<string, NotificationEventType>>(new Map());
let loading = $state(false);

export function get_notification_store() {
	return {
		get configs() {
			return configs;
		},
		get pending_notifications() {
			return pending_notifications;
		},
		get loading() {
			return loading;
		},

		async load_configs() {
			try {
				loading = true;
				configs = await get_notification_configs();
			} catch (error) {
				console.error('Failed to load notification configs:', error);
			} finally {
				loading = false;
			}
		},

		update_config(updated: NotificationConfig) {
			configs = configs.map((config) =>
				config.event_type === updated.event_type ? updated : config,
			);
		},

		/** Mark a session as having a pending notification. */
		add_pending(session_id: string, event_type: NotificationEventType) {
			const next = new Map(pending_notifications);
			next.set(session_id, event_type);
			pending_notifications = next;
		},

		/** Clear pending notification for a session (user acknowledged it). */
		clear_pending(session_id: string) {
			if (!pending_notifications.has(session_id)) {
				return;
			}
			const next = new Map(pending_notifications);
			next.delete(session_id);
			pending_notifications = next;
		},

		/** Check if a session has a pending notification. */
		has_pending(session_id: string): boolean {
			return pending_notifications.has(session_id);
		},

		/** Get the notification event type for a session. */
		get_pending_type(session_id: string): NotificationEventType | undefined {
			return pending_notifications.get(session_id);
		},
	};
}
