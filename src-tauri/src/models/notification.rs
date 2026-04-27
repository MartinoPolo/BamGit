use serde::{Deserialize, Serialize};
use ts_rs::TS;

/// All event types that can trigger notifications.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize, TS)]
#[ts(export)]
#[serde(rename_all = "kebab-case")]
pub enum NotificationEventType {
    NeedsInput,
    NeedsReview,
    Finished,
    Errored,
    PrReady,
}

impl_sql_enum!(NotificationEventType {
    NeedsInput => "needs-input",
    NeedsReview => "needs-review",
    Finished => "finished",
    Errored => "errored",
    PrReady => "pr-ready",
});

/// Per-event notification configuration stored in SQLite.
#[derive(Debug, Clone, Serialize, Deserialize, TS)]
#[ts(export)]
pub struct NotificationConfig {
    pub event_type: NotificationEventType,
    pub sound_enabled: bool,
    pub sound_file: Option<String>,
    pub toast_enabled: bool,
    pub window_flash_enabled: bool,
}

pub const NOTIFICATION_CONFIG_SELECT_COLUMNS: &str =
    "event_type, sound_enabled, sound_file, toast_enabled, window_flash_enabled";

pub fn row_to_notification_config(
    row: &rusqlite::Row,
) -> Result<NotificationConfig, rusqlite::Error> {
    Ok(NotificationConfig {
        event_type: row.get(0)?,
        sound_enabled: row.get(1)?,
        sound_file: row.get(2)?,
        toast_enabled: row.get(3)?,
        window_flash_enabled: row.get(4)?,
    })
}

/// Request to update a single event type's notification settings.
#[derive(Debug, Deserialize)]
pub struct UpdateNotificationConfigRequest {
    pub event_type: NotificationEventType,
    pub sound_enabled: Option<bool>,
    pub sound_file: Option<Option<String>>,
    pub toast_enabled: Option<bool>,
    pub window_flash_enabled: Option<bool>,
}

/// Seed defaults: which channels are on by default for each event type.
impl NotificationConfig {
    pub fn defaults() -> Vec<NotificationConfig> {
        vec![
            NotificationConfig {
                event_type: NotificationEventType::NeedsInput,
                sound_enabled: true,
                sound_file: Some("urgent.wav".into()),
                toast_enabled: true,
                window_flash_enabled: true,
            },
            NotificationConfig {
                event_type: NotificationEventType::NeedsReview,
                sound_enabled: true,
                sound_file: Some("gentle.wav".into()),
                toast_enabled: true,
                window_flash_enabled: false,
            },
            NotificationConfig {
                event_type: NotificationEventType::Finished,
                sound_enabled: false,
                sound_file: None,
                toast_enabled: true,
                window_flash_enabled: false,
            },
            NotificationConfig {
                event_type: NotificationEventType::Errored,
                sound_enabled: true,
                sound_file: Some("urgent.wav".into()),
                toast_enabled: true,
                window_flash_enabled: true,
            },
            NotificationConfig {
                event_type: NotificationEventType::PrReady,
                sound_enabled: false,
                sound_file: None,
                toast_enabled: true,
                window_flash_enabled: false,
            },
        ]
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn needs_input_defaults_all_channels_on() {
        let defaults = NotificationConfig::defaults();
        let config = defaults
            .iter()
            .find(|c| c.event_type == NotificationEventType::NeedsInput)
            .unwrap();
        assert!(config.sound_enabled);
        assert!(config.toast_enabled);
        assert!(config.window_flash_enabled);
        assert_eq!(config.sound_file.as_deref(), Some("urgent.wav"));
    }

    #[test]
    fn needs_review_has_gentle_sound_no_flash() {
        let defaults = NotificationConfig::defaults();
        let config = defaults
            .iter()
            .find(|c| c.event_type == NotificationEventType::NeedsReview)
            .unwrap();
        assert!(config.sound_enabled);
        assert!(config.toast_enabled);
        assert!(!config.window_flash_enabled);
        assert_eq!(config.sound_file.as_deref(), Some("gentle.wav"));
    }

    #[test]
    fn errored_defaults_all_channels_on() {
        let defaults = NotificationConfig::defaults();
        let config = defaults
            .iter()
            .find(|c| c.event_type == NotificationEventType::Errored)
            .unwrap();
        assert!(config.sound_enabled);
        assert!(config.toast_enabled);
        assert!(config.window_flash_enabled);
        assert_eq!(config.sound_file.as_deref(), Some("urgent.wav"));
    }

    #[test]
    fn finished_defaults_toast_only() {
        let defaults = NotificationConfig::defaults();
        let config = defaults
            .iter()
            .find(|c| c.event_type == NotificationEventType::Finished)
            .unwrap();
        assert!(!config.sound_enabled);
        assert!(config.toast_enabled);
        assert!(!config.window_flash_enabled);
    }

    #[test]
    fn serde_round_trip() {
        let config = NotificationConfig {
            event_type: NotificationEventType::NeedsInput,
            sound_enabled: true,
            sound_file: Some("urgent.wav".into()),
            toast_enabled: true,
            window_flash_enabled: true,
        };
        let json = serde_json::to_string(&config).unwrap();
        let deserialized: NotificationConfig = serde_json::from_str(&json).unwrap();
        assert_eq!(deserialized.event_type, config.event_type);
        assert_eq!(deserialized.sound_enabled, config.sound_enabled);
        assert_eq!(deserialized.sound_file, config.sound_file);
        assert_eq!(deserialized.toast_enabled, config.toast_enabled);
        assert_eq!(
            deserialized.window_flash_enabled,
            config.window_flash_enabled
        );
    }
}
