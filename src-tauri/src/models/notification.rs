use serde::{Deserialize, Serialize};
use ts_rs::TS;

/// All event types that can trigger notifications.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize, TS)]
#[ts(export)]
pub enum NotificationEventType {
    #[serde(rename = "session.start")]
    SessionStart,
    #[serde(rename = "session.end")]
    SessionEnd,
    #[serde(rename = "session.error")]
    SessionError,
    #[serde(rename = "session.needs-input")]
    SessionNeedsInput,
    #[serde(rename = "task.complete")]
    TaskComplete,
    #[serde(rename = "task.acknowledge")]
    TaskAcknowledge,
    #[serde(rename = "pr.ready")]
    PrReady,
    #[serde(rename = "pr.merged")]
    PrMerged,
    #[serde(rename = "pr.review-requested")]
    PrReviewRequested,
    #[serde(rename = "merge.conflict")]
    MergeConflict,
    #[serde(rename = "branch.behind-base")]
    BranchBehindBase,
    #[serde(rename = "github.issue-assigned")]
    GithubIssueAssigned,
    #[serde(rename = "github.trigger-received")]
    GithubTriggerReceived,
    #[serde(rename = "achievement.unlocked")]
    AchievementUnlocked,
    #[serde(rename = "resource.limit")]
    ResourceLimit,
}

impl_sql_enum!(NotificationEventType {
    SessionStart => "session.start",
    SessionEnd => "session.end",
    SessionError => "session.error",
    SessionNeedsInput => "session.needs-input",
    TaskComplete => "task.complete",
    TaskAcknowledge => "task.acknowledge",
    PrReady => "pr.ready",
    PrMerged => "pr.merged",
    PrReviewRequested => "pr.review-requested",
    MergeConflict => "merge.conflict",
    BranchBehindBase => "branch.behind-base",
    GithubIssueAssigned => "github.issue-assigned",
    GithubTriggerReceived => "github.trigger-received",
    AchievementUnlocked => "achievement.unlocked",
    ResourceLimit => "resource.limit",
});

#[cfg(test)]
impl NotificationEventType {
    pub fn all() -> &'static [NotificationEventType] {
        &[
            Self::SessionStart,
            Self::SessionEnd,
            Self::SessionError,
            Self::SessionNeedsInput,
            Self::TaskComplete,
            Self::TaskAcknowledge,
            Self::PrReady,
            Self::PrMerged,
            Self::PrReviewRequested,
            Self::MergeConflict,
            Self::BranchBehindBase,
            Self::GithubIssueAssigned,
            Self::GithubTriggerReceived,
            Self::AchievementUnlocked,
            Self::ResourceLimit,
        ]
    }
}

/// Importance tier for notification events.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize, TS)]
#[ts(export)]
#[serde(rename_all = "kebab-case")]
pub enum ImportanceTier {
    Critical,
    Important,
    Normal,
}

impl_sql_enum!(ImportanceTier {
    Critical => "critical",
    Important => "important",
    Normal => "normal",
});

impl NotificationEventType {
    pub fn importance_tier(&self) -> ImportanceTier {
        match self {
            Self::SessionNeedsInput | Self::SessionEnd => ImportanceTier::Critical,
            Self::SessionError | Self::MergeConflict | Self::ResourceLimit | Self::PrReady => {
                ImportanceTier::Important
            }
            _ => ImportanceTier::Normal,
        }
    }

    pub fn is_critical(&self) -> bool {
        self.importance_tier() == ImportanceTier::Critical
    }
}

/// Per-event notification configuration stored in SQLite.
#[derive(Debug, Clone, Serialize, Deserialize, TS)]
#[ts(export)]
pub struct NotificationConfig {
    pub event_type: NotificationEventType,
    pub importance_tier: ImportanceTier,
    pub sound_enabled: bool,
    pub sound_file: Option<String>,
    pub toast_enabled: bool,
    pub window_flash_enabled: bool,
}

pub const NOTIFICATION_CONFIG_SELECT_COLUMNS: &str =
    "event_type, importance_tier, sound_enabled, sound_file, toast_enabled, window_flash_enabled";

pub fn row_to_notification_config(
    row: &rusqlite::Row,
) -> Result<NotificationConfig, rusqlite::Error> {
    Ok(NotificationConfig {
        event_type: row.get(0)?,
        importance_tier: row.get(1)?,
        sound_enabled: row.get(2)?,
        sound_file: row.get(3)?,
        toast_enabled: row.get(4)?,
        window_flash_enabled: row.get(5)?,
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

/// Per-sound volume override stored in SQLite.
#[derive(Debug, Clone, Serialize, Deserialize, TS)]
#[ts(export)]
pub struct SoundVolumeOverride {
    pub event_type: NotificationEventType,
    pub sound_file: String,
    pub volume: f64,
}

/// Seed defaults: which channels are on by default for each event type.
impl NotificationConfig {
    pub fn defaults() -> Vec<NotificationConfig> {
        vec![
            // Critical tier — sound ON by default
            NotificationConfig {
                event_type: NotificationEventType::SessionNeedsInput,
                importance_tier: ImportanceTier::Critical,
                sound_enabled: true,
                sound_file: Some("grove/needs_input.wav".into()),
                toast_enabled: true,
                window_flash_enabled: true,
            },
            NotificationConfig {
                event_type: NotificationEventType::SessionEnd,
                importance_tier: ImportanceTier::Critical,
                sound_enabled: true,
                sound_file: Some("grove/session_end.wav".into()),
                toast_enabled: true,
                window_flash_enabled: true,
            },
            // Important tier — sound ON by default
            NotificationConfig {
                event_type: NotificationEventType::SessionError,
                importance_tier: ImportanceTier::Important,
                sound_enabled: true,
                sound_file: Some("grove/error.wav".into()),
                toast_enabled: true,
                window_flash_enabled: true,
            },
            NotificationConfig {
                event_type: NotificationEventType::MergeConflict,
                importance_tier: ImportanceTier::Important,
                sound_enabled: true,
                sound_file: Some("grove/conflict.wav".into()),
                toast_enabled: true,
                window_flash_enabled: false,
            },
            NotificationConfig {
                event_type: NotificationEventType::ResourceLimit,
                importance_tier: ImportanceTier::Important,
                sound_enabled: true,
                sound_file: Some("grove/error.wav".into()),
                toast_enabled: true,
                window_flash_enabled: true,
            },
            NotificationConfig {
                event_type: NotificationEventType::PrReady,
                importance_tier: ImportanceTier::Important,
                sound_enabled: true,
                sound_file: Some("grove/ready.wav".into()),
                toast_enabled: true,
                window_flash_enabled: false,
            },
            // Normal tier — sound OFF by default
            NotificationConfig {
                event_type: NotificationEventType::SessionStart,
                importance_tier: ImportanceTier::Normal,
                sound_enabled: false,
                sound_file: Some("grove/start.wav".into()),
                toast_enabled: true,
                window_flash_enabled: false,
            },
            NotificationConfig {
                event_type: NotificationEventType::TaskComplete,
                importance_tier: ImportanceTier::Normal,
                sound_enabled: false,
                sound_file: Some("grove/complete.wav".into()),
                toast_enabled: false,
                window_flash_enabled: false,
            },
            NotificationConfig {
                event_type: NotificationEventType::TaskAcknowledge,
                importance_tier: ImportanceTier::Normal,
                sound_enabled: false,
                sound_file: Some("grove/acknowledge.wav".into()),
                toast_enabled: false,
                window_flash_enabled: false,
            },
            NotificationConfig {
                event_type: NotificationEventType::PrMerged,
                importance_tier: ImportanceTier::Normal,
                sound_enabled: false,
                sound_file: Some("grove/merged.wav".into()),
                toast_enabled: true,
                window_flash_enabled: false,
            },
            NotificationConfig {
                event_type: NotificationEventType::PrReviewRequested,
                importance_tier: ImportanceTier::Normal,
                sound_enabled: false,
                sound_file: Some("grove/ready.wav".into()),
                toast_enabled: true,
                window_flash_enabled: false,
            },
            NotificationConfig {
                event_type: NotificationEventType::BranchBehindBase,
                importance_tier: ImportanceTier::Normal,
                sound_enabled: false,
                sound_file: Some("grove/acknowledge.wav".into()),
                toast_enabled: false,
                window_flash_enabled: false,
            },
            NotificationConfig {
                event_type: NotificationEventType::GithubIssueAssigned,
                importance_tier: ImportanceTier::Normal,
                sound_enabled: false,
                sound_file: Some("grove/notification.wav".into()),
                toast_enabled: true,
                window_flash_enabled: false,
            },
            NotificationConfig {
                event_type: NotificationEventType::GithubTriggerReceived,
                importance_tier: ImportanceTier::Normal,
                sound_enabled: false,
                sound_file: Some("grove/start.wav".into()),
                toast_enabled: true,
                window_flash_enabled: false,
            },
            NotificationConfig {
                event_type: NotificationEventType::AchievementUnlocked,
                importance_tier: ImportanceTier::Normal,
                sound_enabled: false,
                sound_file: Some("grove/achievement.wav".into()),
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
    fn defaults_cover_all_event_types() {
        let defaults = NotificationConfig::defaults();
        for event_type in NotificationEventType::all() {
            assert!(
                defaults.iter().any(|c| c.event_type == *event_type),
                "Missing default for {:?}",
                event_type
            );
        }
        assert_eq!(defaults.len(), NotificationEventType::all().len());
    }

    #[test]
    fn critical_events_have_sound_enabled_by_default() {
        let defaults = NotificationConfig::defaults();
        for config in &defaults {
            if config.event_type.is_critical() {
                assert!(
                    config.sound_enabled,
                    "Critical event {:?} should have sound enabled",
                    config.event_type
                );
            }
        }
    }

    #[test]
    fn importance_tiers_match_defaults() {
        let defaults = NotificationConfig::defaults();
        for config in &defaults {
            assert_eq!(
                config.importance_tier,
                config.event_type.importance_tier(),
                "Tier mismatch for {:?}",
                config.event_type
            );
        }
    }

    #[test]
    fn serde_round_trip() {
        let config = NotificationConfig {
            event_type: NotificationEventType::SessionNeedsInput,
            importance_tier: ImportanceTier::Critical,
            sound_enabled: true,
            sound_file: Some("grove/needs_input.wav".into()),
            toast_enabled: true,
            window_flash_enabled: true,
        };
        let json = serde_json::to_string(&config).unwrap();
        let deserialized: NotificationConfig = serde_json::from_str(&json).unwrap();
        assert_eq!(deserialized.event_type, config.event_type);
        assert_eq!(deserialized.importance_tier, config.importance_tier);
        assert_eq!(deserialized.sound_enabled, config.sound_enabled);
        assert_eq!(deserialized.sound_file, config.sound_file);
        assert_eq!(deserialized.toast_enabled, config.toast_enabled);
        assert_eq!(
            deserialized.window_flash_enabled,
            config.window_flash_enabled
        );
    }

    #[test]
    fn event_type_serializes_with_dot_separator() {
        let json = serde_json::to_string(&NotificationEventType::SessionNeedsInput).unwrap();
        assert_eq!(json, "\"session.needs-input\"");
        let json = serde_json::to_string(&NotificationEventType::SessionStart).unwrap();
        assert_eq!(json, "\"session.start\"");
    }
}
