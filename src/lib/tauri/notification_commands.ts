import { invoke } from '@tauri-apps/api/core';
import type { NotificationConfig, UpdateNotificationConfigRequest } from '$lib/types/notification';

export async function get_notification_configs(): Promise<NotificationConfig[]> {
	return invoke('get_notification_configs');
}

export async function update_notification_config(
	request: UpdateNotificationConfigRequest,
): Promise<NotificationConfig> {
	return invoke('update_notification_config', { request });
}

export async function test_notification_sound(event_type: string): Promise<void> {
	return invoke('test_notification_sound', { eventType: event_type });
}
