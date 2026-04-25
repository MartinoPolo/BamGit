import { invoke } from '@tauri-apps/api/core';
import type { NotificationConfig, UpdateNotificationConfigRequest } from '$lib/types/notification';

export async function getNotificationConfigs(): Promise<NotificationConfig[]> {
	return invoke('get_notification_configs');
}

export async function updateNotificationConfig(
	request: UpdateNotificationConfigRequest,
): Promise<NotificationConfig> {
	return invoke('update_notification_config', { request });
}

export async function testNotificationSound(eventType: string): Promise<void> {
	return invoke('test_notification_sound', { eventType });
}
