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

use super::playback_queue::LazyPlaybackQueue;
use super::sound;
use super::sound_pack;
use super::volume;

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
    /// If issue_id is provided, checks is_sound_muted on the issue.
    pub fn notify(
        &self,
        event_type: NotificationEventType,
        session_id: &str,
        issue_id: Option<&str>,
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

        let issue_muted = issue_id
            .and_then(|id| self.is_issue_sound_muted(id, database_connection))
            .unwrap_or(false);

        if config.toast_enabled {
            self.send_toast(event_type, message, app_handle);
        }

        if config.sound_enabled && !issue_muted {
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
        let volume = match database_connection.lock() {
            Ok(connection) => volume::compute_effective_volume(&connection, event_type, sound_file),
            Err(_) => return,
        };

        let candidates = self.resolve_sound_candidates(sound_file, event_type);

        if candidates.is_empty() {
            log::warn!("Sound file not found: {sound_file}");
            return;
        }

        if let Some(queue) = app_handle.try_state::<LazyPlaybackQueue>() {
            queue.enqueue(candidates, volume as f32, event_type, session_id.to_owned());
        } else {
            // Fallback: direct playback on thread (shouldn't happen in normal operation)
            let volume_f32 = volume as f32;
            let path = candidates.into_iter().next().unwrap();
            std::thread::spawn(move || {
                if let Err(error) = sound::play_sound_blocking(&path, volume_f32) {
                    log::error!("Sound playback failed: {error}");
                }
            });
        }
    }

    fn resolve_sound_candidates(
        &self,
        sound_file: &str,
        event_type: NotificationEventType,
    ) -> Vec<PathBuf> {
        if let Some(pack_prefix) = sound_file.split('/').next() {
            let pack_directories = [
                self.resource_directory.join("sounds").join(pack_prefix),
                self.app_data_directory
                    .join("sound-packs")
                    .join(pack_prefix),
            ];

            for pack_directory in &pack_directories {
                if let Some(candidates) = self.resolve_pack_candidates(
                    pack_directory,
                    pack_prefix,
                    event_type,
                ) {
                    return candidates;
                }
            }
        }

        match sound::resolve_sound_path(
            sound_file,
            &self.resource_directory,
            &self.app_data_directory,
        ) {
            Some(path) => vec![path],
            None => vec![],
        }
    }

    fn resolve_pack_candidates(
        &self,
        pack_directory: &std::path::Path,
        pack_prefix: &str,
        event_type: NotificationEventType,
    ) -> Option<Vec<PathBuf>> {
        let manifest = sound_pack::load_manifest(pack_directory).ok()?;
        let sounds = manifest.categories.get(event_type.as_str())?;
        if sounds.len() <= 1 {
            return None;
        }
        let resolved: Vec<PathBuf> = sounds
            .iter()
            .filter_map(|entry| {
                let relative = format!("{}/{}", pack_prefix, entry.file);
                sound::resolve_sound_path(
                    &relative,
                    &self.resource_directory,
                    &self.app_data_directory,
                )
            })
            .collect();
        if resolved.is_empty() {
            None
        } else {
            Some(resolved)
        }
    }

    fn is_issue_sound_muted(
        &self,
        issue_id: &str,
        database_connection: &std::sync::Arc<Mutex<Connection>>,
    ) -> Option<bool> {
        let connection = database_connection.lock().ok()?;
        connection
            .query_row(
                "SELECT is_sound_muted FROM issues WHERE id = ?1",
                [issue_id],
                |row| row.get::<_, bool>(0),
            )
            .ok()
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
