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

use super::playback_queue::PlaybackQueueHandle;
use super::sound;

/// Manages notification dispatch across all channels (toast, sound, window attention).
pub struct NotificationService {
    resource_directory: PathBuf,
    app_data_directory: PathBuf,
}

impl NotificationService {
    pub fn new(resource_directory: PathBuf, app_data_directory: PathBuf) -> Self {
        Self {
            resource_directory,
            app_data_directory,
        }
    }

    pub fn resource_directory(&self) -> &PathBuf {
        &self.resource_directory
    }

    pub fn app_data_directory(&self) -> &PathBuf {
        &self.app_data_directory
    }

    /// Fire notifications for a session state change event.
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
                self.enqueue_sound(sound_file, event_type, session_id, app_handle, database_connection);
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
            .query_row(&query, rusqlite::params![event_type], |row| {
                row_to_notification_config(row)
            })
            .ok()
    }

    fn send_toast(&self, event_type: NotificationEventType, message: &str, app_handle: &AppHandle) {
        let title = notification_toast_title(event_type);

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

    fn enqueue_sound(
        &self,
        sound_file: &str,
        event_type: NotificationEventType,
        session_id: &str,
        app_handle: &AppHandle,
        database_connection: &std::sync::Arc<Mutex<Connection>>,
    ) {
        let global_volume = self.load_global_volume(database_connection);
        let per_sound_volume = self.load_sound_volume_override(
            event_type,
            sound_file,
            database_connection,
        );
        let volume = global_volume * per_sound_volume;

        let resolved_path = sound::resolve_sound_path(
            sound_file,
            &self.resource_directory,
            &self.app_data_directory,
        );

        match resolved_path {
            Some(path) => {
                if let Some(queue) = app_handle.try_state::<PlaybackQueueHandle>() {
                    queue.enqueue(path, volume as f32, event_type, session_id.to_owned());
                } else {
                    // Fallback: direct playback on thread (shouldn't happen in normal operation)
                    let volume_f32 = volume as f32;
                    std::thread::spawn(move || {
                        if let Err(error) = sound::play_sound_blocking(&path, volume_f32) {
                            log::error!("Sound playback failed: {error}");
                        }
                    });
                }
            }
            None => {
                log::warn!("Sound file not found: {sound_file}");
            }
        }
    }

    fn load_global_volume(
        &self,
        database_connection: &std::sync::Arc<Mutex<Connection>>,
    ) -> f64 {
        let connection = match database_connection.lock() {
            Ok(conn) => conn,
            Err(_) => return 0.8,
        };
        connection
            .query_row(
                "SELECT value FROM app_settings WHERE key = 'notification_volume'",
                [],
                |row| row.get::<_, String>(0),
            )
            .ok()
            .and_then(|value| value.parse::<f64>().ok())
            .unwrap_or(0.8)
    }

    fn load_sound_volume_override(
        &self,
        event_type: NotificationEventType,
        sound_file: &str,
        database_connection: &std::sync::Arc<Mutex<Connection>>,
    ) -> f64 {
        let connection = match database_connection.lock() {
            Ok(conn) => conn,
            Err(_) => return 1.0,
        };
        connection
            .query_row(
                "SELECT volume FROM sound_volume_overrides WHERE event_type = ?1 AND sound_file = ?2",
                rusqlite::params![event_type, sound_file],
                |row| row.get::<_, f64>(0),
            )
            .unwrap_or(1.0)
    }

    fn request_attention(&self, event_type: NotificationEventType, app_handle: &AppHandle) {
        let attention_type = if event_type.is_critical() {
            tauri::UserAttentionType::Critical
        } else {
            tauri::UserAttentionType::Informational
        };

        if let Some(window) = app_handle.get_webview_window("main") {
            if let Err(error) = window.request_user_attention(Some(attention_type)) {
                log::error!("Failed to request window attention: {error}");
            }
        }
    }
}

fn notification_toast_title(event_type: NotificationEventType) -> &'static str {
    match event_type {
        NotificationEventType::SessionStart => "NOTIFICATION_SESSION_START",
        NotificationEventType::SessionEnd => "NOTIFICATION_SESSION_END",
        NotificationEventType::SessionError => "NOTIFICATION_SESSION_ERROR",
        NotificationEventType::SessionNeedsInput => "NOTIFICATION_NEEDS_INPUT",
        NotificationEventType::TaskComplete => "NOTIFICATION_TASK_COMPLETE",
        NotificationEventType::TaskAcknowledge => "NOTIFICATION_TASK_ACKNOWLEDGE",
        NotificationEventType::PrReady => "NOTIFICATION_PR_READY",
        NotificationEventType::PrMerged => "NOTIFICATION_PR_MERGED",
        NotificationEventType::PrReviewRequested => "NOTIFICATION_PR_REVIEW_REQUESTED",
        NotificationEventType::MergeConflict => "NOTIFICATION_MERGE_CONFLICT",
        NotificationEventType::BranchBehindBase => "NOTIFICATION_BRANCH_BEHIND_BASE",
        NotificationEventType::GithubIssueAssigned => "NOTIFICATION_GITHUB_ISSUE_ASSIGNED",
        NotificationEventType::GithubTriggerReceived => "NOTIFICATION_GITHUB_TRIGGER_RECEIVED",
        NotificationEventType::AchievementUnlocked => "NOTIFICATION_ACHIEVEMENT_UNLOCKED",
        NotificationEventType::ResourceLimit => "NOTIFICATION_RESOURCE_LIMIT",
    }
}

/// Map a SessionState to a notification event type.
/// Returns None for states that should not trigger notifications (e.g. Running, Paused).
pub fn session_state_to_event_type(state: &SessionState) -> Option<NotificationEventType> {
    match state {
        SessionState::NeedsInput => Some(NotificationEventType::SessionNeedsInput),
        SessionState::NeedsReview => Some(NotificationEventType::SessionNeedsInput),
        SessionState::Finished => Some(NotificationEventType::SessionEnd),
        SessionState::Errored => Some(NotificationEventType::SessionError),
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
            Some(NotificationEventType::SessionNeedsInput)
        );
        assert_eq!(
            session_state_to_event_type(&SessionState::NeedsReview),
            Some(NotificationEventType::SessionNeedsInput)
        );
        assert_eq!(
            session_state_to_event_type(&SessionState::Finished),
            Some(NotificationEventType::SessionEnd)
        );
        assert_eq!(
            session_state_to_event_type(&SessionState::Errored),
            Some(NotificationEventType::SessionError)
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

    #[test]
    fn toast_titles_all_prefixed() {
        for event_type in NotificationEventType::all() {
            let title = notification_toast_title(*event_type);
            assert!(
                title.starts_with("NOTIFICATION_"),
                "Toast title for {:?} should start with NOTIFICATION_",
                event_type
            );
        }
    }
}
