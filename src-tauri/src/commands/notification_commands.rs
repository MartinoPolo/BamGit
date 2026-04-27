use tauri::{AppHandle, Manager, State};

use crate::database::connection::DatabaseState;
use crate::models::notification::{
    row_to_notification_config, NotificationConfig, NotificationEventType,
    UpdateNotificationConfigRequest, NOTIFICATION_CONFIG_SELECT_COLUMNS,
};
use crate::notification::service::NotificationService;

#[tauri::command]
pub fn get_notification_configs(
    state: State<DatabaseState>,
) -> Result<Vec<NotificationConfig>, String> {
    let connection = state.read()?;

    let query = format!(
        "SELECT {NOTIFICATION_CONFIG_SELECT_COLUMNS} FROM notification_config ORDER BY event_type"
    );
    let mut statement = connection
        .prepare(&query)
        .map_err(|error| format!("Failed to prepare query: {error}"))?;

    let configs = statement
        .query_map([], |row| row_to_notification_config(row))
        .map_err(|error| format!("Failed to query configs: {error}"))?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|error| format!("Failed to read config row: {error}"))?;

    Ok(configs)
}

#[tauri::command]
pub fn update_notification_config(
    state: State<DatabaseState>,
    request: UpdateNotificationConfigRequest,
) -> Result<NotificationConfig, String> {
    let connection = state.write()?;

    let select_query = format!(
        "SELECT {NOTIFICATION_CONFIG_SELECT_COLUMNS} FROM notification_config WHERE event_type = ?1"
    );

    let existing = connection
        .query_row(&select_query, rusqlite::params![request.event_type], |row| {
            row_to_notification_config(row)
        })
        .map_err(|error| format!("Notification config not found: {error}"))?;

    let sound_enabled = request.sound_enabled.unwrap_or(existing.sound_enabled);
    let sound_file = match request.sound_file {
        Some(new_value) => new_value,
        None => existing.sound_file,
    };
    let toast_enabled = request.toast_enabled.unwrap_or(existing.toast_enabled);
    let window_flash_enabled = request
        .window_flash_enabled
        .unwrap_or(existing.window_flash_enabled);

    connection
        .execute(
            "UPDATE notification_config SET sound_enabled = ?1, sound_file = ?2, \
             toast_enabled = ?3, window_flash_enabled = ?4 WHERE event_type = ?5",
            rusqlite::params![
                sound_enabled,
                sound_file,
                toast_enabled,
                window_flash_enabled,
                request.event_type
            ],
        )
        .map_err(|error| format!("Failed to update notification config: {error}"))?;

    connection
        .query_row(&select_query, rusqlite::params![request.event_type], |row| {
            row_to_notification_config(row)
        })
        .map_err(|error| format!("Failed to read updated config: {error}"))
}

#[tauri::command]
pub fn test_notification_sound(
    app_handle: AppHandle,
    event_type: NotificationEventType,
    state: State<DatabaseState>,
) -> Result<(), String> {
    let connection = state.read()?;

    let sound_file: Option<String> = connection
        .query_row(
            "SELECT sound_file FROM notification_config WHERE event_type = ?1",
            rusqlite::params![event_type],
            |row| row.get(0),
        )
        .map_err(|error| format!("Config not found: {error}"))?;

    let sound_file = sound_file.ok_or("No sound file configured for this event type")?;

    let service = app_handle
        .try_state::<NotificationService>()
        .ok_or("NotificationService not available")?;

    let resource_directory = service.resource_directory().clone();
    drop(connection);

    let resolved_path =
        crate::notification::sound::resolve_sound_path(&sound_file, &resource_directory)
            .ok_or(format!("Sound file not found: {sound_file}"))?;

    std::thread::spawn(move || {
        if let Err(error) = crate::notification::sound::play_sound_blocking(&resolved_path) {
            log::error!("Test sound playback failed: {error}");
        }
    });

    Ok(())
}
