use std::path::PathBuf;
use std::sync::Mutex;

use rusqlite::Connection;
use tauri::{AppHandle, Manager};
use tauri_plugin_notification::NotificationExt;

use crate::models::notification::{
    row_to_notification_config, NotificationConfig, NotificationEventType,
    NOTIFICATION_CONFIG_SELECT_COLUMNS,
};
use crate::models::session::SessionState;

use super::sound;

/// Manages notification dispatch across all channels (toast, sound, window attention).
pub struct NotificationService {
    resource_directory: PathBuf,
}

impl NotificationService {
    pub fn new(resource_directory: PathBuf) -> Self {
        Self { resource_directory }
    }

    pub fn resource_directory(&self) -> &PathBuf {
        &self.resource_directory
    }

    /// Fire notifications for a session state change event.
    /// Reads config from DB, dispatches to enabled channels.
    pub fn notify(
        &self,
        event_type: NotificationEventType,
        session_id: &str,
        message: &str,
        app_handle: &AppHandle,
        database_connection: &std::sync::Arc<Mutex<Connection>>,
    ) {
        let config = match self.load_config(event_type, database_connection) {
            Some(config) => config,
            None => {
                log::warn!(
                    "No notification config for event type: {}",
                    event_type.as_str()
                );
                return;
            }
        };

        if config.toast_enabled {
            self.send_toast(event_type, message, app_handle);
        }

        if config.sound_enabled {
            if let Some(ref sound_file) = config.sound_file {
                self.play_sound(sound_file);
            }
        }

        if config.window_flash_enabled {
            self.request_attention(event_type, app_handle);
        }

        log::info!(
            "Notification dispatched: {} for session {session_id} \
             (toast={}, sound={}, flash={})",
            event_type.as_str(),
            config.toast_enabled,
            config.sound_enabled,
            config.window_flash_enabled,
        );
    }

    fn load_config(
        &self,
        event_type: NotificationEventType,
        database_connection: &std::sync::Arc<Mutex<Connection>>,
    ) -> Option<NotificationConfig> {
        let connection = database_connection.lock().ok()?;
        let query = format!(
            "SELECT {NOTIFICATION_CONFIG_SELECT_COLUMNS} \
             FROM notification_config WHERE event_type = ?1"
        );
        connection
            .query_row(&query, [event_type.as_str()], |row| {
                row_to_notification_config(row)
            })
            .ok()
    }

    fn send_toast(&self, event_type: NotificationEventType, message: &str, app_handle: &AppHandle) {
        let title = match event_type {
            NotificationEventType::NeedsInput => "Session needs input",
            NotificationEventType::NeedsReview => "Session ready for review",
            NotificationEventType::Finished => "Session finished",
            NotificationEventType::Errored => "Session errored",
            NotificationEventType::PrReady => "PR ready",
        };

        if let Err(error) = app_handle
            .notification()
            .builder()
            .title(title)
            .body(message)
            .show()
        {
            log::error!("Failed to send toast notification: {error}");
        }
    }

    fn play_sound(&self, sound_file: &str) {
        // Move path resolution + playback off the async executor entirely.
        // Both resolve_sound_path (.exists() calls) and play_sound_blocking are blocking I/O.
        let sound_file = sound_file.to_owned();
        let resource_directory = self.resource_directory.clone();

        std::thread::spawn(move || {
            match sound::resolve_sound_path(&sound_file, &resource_directory) {
                Some(path) => {
                    if let Err(error) = sound::play_sound_blocking(&path) {
                        log::error!("Sound playback failed: {error}");
                    }
                }
                None => {
                    log::warn!("Sound file not found: {sound_file}");
                }
            }
        });
    }

    fn request_attention(&self, event_type: NotificationEventType, app_handle: &AppHandle) {
        let attention_type = match event_type {
            NotificationEventType::NeedsInput | NotificationEventType::Errored => {
                tauri::UserAttentionType::Critical
            }
            _ => tauri::UserAttentionType::Informational,
        };

        if let Some(window) = app_handle.get_webview_window("main") {
            if let Err(error) = window.request_user_attention(Some(attention_type)) {
                log::error!("Failed to request window attention: {error}");
            }
        }
    }
}

/// Map a SessionState to a notification event type.
/// Returns None for states that should not trigger notifications (e.g. Running, Paused).
/// Note: PrReady is not mapped here — it will be triggered by a future GitHub
/// polling hook, not by session state transitions.
pub fn session_state_to_event_type(state: &SessionState) -> Option<NotificationEventType> {
    match state {
        SessionState::NeedsInput => Some(NotificationEventType::NeedsInput),
        SessionState::NeedsReview => Some(NotificationEventType::NeedsReview),
        SessionState::Finished => Some(NotificationEventType::Finished),
        SessionState::Errored => Some(NotificationEventType::Errored),
        SessionState::Running | SessionState::Paused => None,
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn session_state_to_event_type_maps_correctly() {
        assert_eq!(
            session_state_to_event_type(&SessionState::NeedsInput),
            Some(NotificationEventType::NeedsInput)
        );
        assert_eq!(
            session_state_to_event_type(&SessionState::NeedsReview),
            Some(NotificationEventType::NeedsReview)
        );
        assert_eq!(
            session_state_to_event_type(&SessionState::Finished),
            Some(NotificationEventType::Finished)
        );
        assert_eq!(
            session_state_to_event_type(&SessionState::Errored),
            Some(NotificationEventType::Errored)
        );
    }

    #[test]
    fn session_state_to_event_type_ignores_running() {
        assert_eq!(session_state_to_event_type(&SessionState::Running), None);
    }

    #[test]
    fn session_state_to_event_type_ignores_paused() {
        assert_eq!(session_state_to_event_type(&SessionState::Paused), None);
    }
}
