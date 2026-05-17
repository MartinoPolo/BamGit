use tauri::{AppHandle, Manager, State};

use crate::database::connection::DatabaseState;
use crate::models::notification::{
    row_to_notification_config, NotificationConfig, NotificationEventType, SoundVolumeOverride,
    UpdateNotificationConfigRequest, NOTIFICATION_CONFIG_SELECT_COLUMNS,
};
use crate::notification::service::NotificationService;
use crate::notification::sound_pack::{self, SoundPackInfo};

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
pub async fn test_notification_sound(
    app_handle: AppHandle,
    event_type: NotificationEventType,
    state: State<'_, DatabaseState>,
) -> Result<(), String> {
    let connection = state.read()?;

    let sound_file: Option<String> = connection
        .query_row(
            "SELECT sound_file FROM notification_config WHERE event_type = ?1",
            rusqlite::params![event_type],
            |row| row.get(0),
        )
        .map_err(|error| format!("Config not found: {error}"))?;

    let sound_file = sound_file.ok_or("ERR_NO_SOUND_FILE")?;

    let service = app_handle
        .try_state::<NotificationService>()
        .ok_or("ERR_NOTIFICATION_SERVICE_UNAVAILABLE")?;

    let resource_directory = service.resource_directory().clone();
    let app_data_directory = service.app_data_directory().clone();

    let volume =
        crate::notification::volume::compute_effective_volume(&connection, event_type, &sound_file)
            as f32;
    drop(connection);

    let resolved_path = crate::notification::sound::resolve_sound_path(
        &sound_file,
        &resource_directory,
        &app_data_directory,
    )
    .ok_or(format!("Sound file not found: {sound_file}"))?;

    tokio::task::spawn_blocking(move || {
        crate::notification::sound::play_sound_blocking(&resolved_path, volume)
    })
    .await
    .map_err(|error| format!("Playback task failed: {error}"))?
}

// ─── Volume commands ─────────────────────────────────────────────────────────

#[tauri::command]
pub fn get_notification_volume(state: State<DatabaseState>) -> Result<f64, String> {
    let connection = state.read()?;
    let volume: String = connection
        .query_row(
            "SELECT value FROM user_settings WHERE key = 'notification_volume'",
            [],
            |row| row.get(0),
        )
        .map_err(|error| format!("Failed to read volume: {error}"))?;
    volume
        .parse::<f64>()
        .map_err(|error| format!("Invalid volume value: {error}"))
}

#[tauri::command]
pub fn set_notification_volume(state: State<DatabaseState>, volume: f64) -> Result<(), String> {
    let clamped = volume.clamp(0.0, 1.0);
    let connection = state.write()?;
    connection
        .execute(
            "INSERT OR REPLACE INTO user_settings (key, value) VALUES ('notification_volume', ?1)",
            rusqlite::params![clamped.to_string()],
        )
        .map_err(|error| format!("Failed to set volume: {error}"))?;
    Ok(())
}

#[tauri::command]
pub fn get_sound_volume_override(
    state: State<DatabaseState>,
    event_type: NotificationEventType,
    sound_file: String,
) -> Result<f64, String> {
    let connection = state.read()?;
    let volume =
        crate::notification::volume::load_sound_volume_override(&connection, event_type, &sound_file);
    Ok(volume)
}

#[tauri::command]
pub fn set_sound_volume_override(
    state: State<DatabaseState>,
    event_type: NotificationEventType,
    sound_file: String,
    volume: f64,
) -> Result<(), String> {
    let clamped = volume.clamp(0.0, 2.0);
    let connection = state.write()?;
    connection
        .execute(
            "INSERT OR REPLACE INTO sound_volume_overrides (event_type, sound_file, volume) VALUES (?1, ?2, ?3)",
            rusqlite::params![event_type, sound_file, clamped],
        )
        .map_err(|error| format!("Failed to set volume override: {error}"))?;
    Ok(())
}

#[tauri::command]
pub fn get_all_sound_volume_overrides(
    state: State<DatabaseState>,
) -> Result<Vec<SoundVolumeOverride>, String> {
    let connection = state.read()?;
    let mut statement = connection
        .prepare("SELECT event_type, sound_file, volume FROM sound_volume_overrides")
        .map_err(|error| format!("Failed to prepare query: {error}"))?;

    let overrides = statement
        .query_map([], |row| {
            Ok(SoundVolumeOverride {
                event_type: row.get(0)?,
                sound_file: row.get(1)?,
                volume: row.get(2)?,
            })
        })
        .map_err(|error| format!("Failed to query overrides: {error}"))?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|error| format!("Failed to read override row: {error}"))?;

    Ok(overrides)
}

// ─── Sound pack commands ─────────────────────────────────────────────────────

#[tauri::command]
pub fn list_sound_packs(app_handle: AppHandle) -> Result<Vec<SoundPackInfo>, String> {
    let service = app_handle
        .try_state::<NotificationService>()
        .ok_or("ERR_NOTIFICATION_SERVICE_UNAVAILABLE")?;

    Ok(sound_pack::discover_packs(
        service.resource_directory(),
        service.app_data_directory(),
    ))
}

#[tauri::command]
pub fn install_sound_pack(
    app_handle: AppHandle,
    source_path: String,
) -> Result<SoundPackInfo, String> {
    let service = app_handle
        .try_state::<NotificationService>()
        .ok_or("ERR_NOTIFICATION_SERVICE_UNAVAILABLE")?;

    let source_directory = std::path::Path::new(&source_path);
    if !source_directory.is_dir() {
        return Err("Source path is not a directory".to_owned());
    }

    sound_pack::install_pack(source_directory, service.app_data_directory())
}

#[tauri::command]
pub fn remove_sound_pack(
    app_handle: AppHandle,
    pack_name: String,
) -> Result<(), String> {
    let service = app_handle
        .try_state::<NotificationService>()
        .ok_or("ERR_NOTIFICATION_SERVICE_UNAVAILABLE")?;

    sound_pack::remove_pack(&pack_name, service.app_data_directory())
}
