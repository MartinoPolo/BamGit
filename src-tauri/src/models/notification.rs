use serde::{Deserialize, Serialize};

/// All event types that can trigger notifications.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "kebab-case")]
pub enum NotificationEventType {
    NeedsInput,
    NeedsReview,
    Finished,
    Errored,
    PrReady,
}

impl NotificationEventType {
    pub const ALL: &[NotificationEventType] = &[
        NotificationEventType::NeedsInput,
        NotificationEventType::NeedsReview,
        NotificationEventType::Finished,
        NotificationEventType::Errored,
        NotificationEventType::PrReady,
    ];

    pub fn as_str(&self) -> &'static str {
        match self {
            NotificationEventType::NeedsInput => "needs-input",
            NotificationEventType::NeedsReview => "needs-review",
            NotificationEventType::Finished => "finished",
            NotificationEventType::Errored => "errored",
            NotificationEventType::PrReady => "pr-ready",
        }
    }

    pub fn from_str(value: &str) -> Option<NotificationEventType> {
        match value {
            "needs-input" => Some(NotificationEventType::NeedsInput),
            "needs-review" => Some(NotificationEventType::NeedsReview),
            "finished" => Some(NotificationEventType::Finished),
            "errored" => Some(NotificationEventType::Errored),
            "pr-ready" => Some(NotificationEventType::PrReady),
            _ => None,
        }
    }

    /// Default sound file name shipped in resources/sounds/.
    pub fn default_sound_file(&self) -> Option<&'static str> {
        match self {
            NotificationEventType::NeedsInput | NotificationEventType::Errored => {
                Some("urgent.wav")
            }
            NotificationEventType::NeedsReview => Some("gentle.wav"),
            _ => None,
        }
    }
}

/// Per-event notification configuration stored in SQLite.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NotificationConfig {
    pub event_type: String,
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
    pub event_type: String,
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
                event_type: "needs-input".into(),
                sound_enabled: true,
                sound_file: Some("urgent.wav".into()),
                toast_enabled: true,
                window_flash_enabled: true,
            },
            NotificationConfig {
                event_type: "needs-review".into(),
                sound_enabled: true,
                sound_file: Some("gentle.wav".into()),
                toast_enabled: true,
                window_flash_enabled: false,
            },
            NotificationConfig {
                event_type: "finished".into(),
                sound_enabled: false,
                sound_file: None,
                toast_enabled: true,
                window_flash_enabled: false,
            },
            NotificationConfig {
                event_type: "errored".into(),
                sound_enabled: true,
                sound_file: Some("urgent.wav".into()),
                toast_enabled: true,
                window_flash_enabled: true,
            },
            NotificationConfig {
                event_type: "pr-ready".into(),
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
    fn event_type_round_trip() {
        for event_type in NotificationEventType::ALL {
            let as_str = event_type.as_str();
            let parsed = NotificationEventType::from_str(as_str);
            assert_eq!(parsed, Some(*event_type), "round-trip failed for {as_str}");
        }
    }

    #[test]
    fn event_type_from_str_unknown_returns_none() {
        assert_eq!(NotificationEventType::from_str("unknown"), None);
    }

    #[test]
    fn defaults_cover_all_event_types() {
        let defaults = NotificationConfig::defaults();
        for event_type in NotificationEventType::ALL {
            assert!(
                defaults.iter().any(|c| c.event_type == event_type.as_str()),
                "missing default for {}",
                event_type.as_str()
            );
        }
    }

    #[test]
    fn needs_input_defaults_all_channels_on() {
        let defaults = NotificationConfig::defaults();
        let config = defaults
            .iter()
            .find(|c| c.event_type == "needs-input")
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
            .find(|c| c.event_type == "needs-review")
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
            .find(|c| c.event_type == "errored")
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
            .find(|c| c.event_type == "finished")
            .unwrap();
        assert!(!config.sound_enabled);
        assert!(config.toast_enabled);
        assert!(!config.window_flash_enabled);
    }

    #[test]
    fn serde_round_trip() {
        let config = NotificationConfig {
            event_type: "needs-input".into(),
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
