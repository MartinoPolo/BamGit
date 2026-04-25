import { createContext } from 'svelte';
import type { NotificationConfig, NotificationEventType } from '$lib/types/notification';
import { getNotificationConfigs } from '$lib/tauri/notification_commands';

type NotificationsContext = ReturnType<typeof createNotificationsContext>;

const [useNotifications, setNotificationsInternal] = createContext<NotificationsContext>();
export { useNotifications };

export function setNotificationsContext() {
	const ctx = createNotificationsContext();
	setNotificationsInternal(ctx);
	return ctx;
}

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
				configs = await getNotificationConfigs();
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
	};
}
