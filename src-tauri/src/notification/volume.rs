use rusqlite::Connection;

use crate::models::notification::NotificationEventType;

use super::{DEFAULT_NOTIFICATION_VOLUME, DEFAULT_SOUND_VOLUME_OVERRIDE};

pub fn load_global_volume(connection: &Connection) -> f64 {
    connection
        .query_row(
            "SELECT value FROM app_settings WHERE key = 'notification_volume'",
            [],
            |row| row.get::<_, String>(0),
        )
        .ok()
        .and_then(|value| value.parse::<f64>().ok())
        .unwrap_or(DEFAULT_NOTIFICATION_VOLUME)
}

pub fn load_sound_volume_override(
    connection: &Connection,
    event_type: NotificationEventType,
    sound_file: &str,
) -> f64 {
    connection
        .query_row(
            "SELECT volume FROM sound_volume_overrides WHERE event_type = ?1 AND sound_file = ?2",
            rusqlite::params![event_type, sound_file],
            |row| row.get::<_, f64>(0),
        )
        .unwrap_or(DEFAULT_SOUND_VOLUME_OVERRIDE)
}

pub fn compute_effective_volume(
    connection: &Connection,
    event_type: NotificationEventType,
    sound_file: &str,
) -> f64 {
    load_global_volume(connection) * load_sound_volume_override(connection, event_type, sound_file)
}
