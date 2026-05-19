use serde::{Deserialize, Serialize};
use ts_rs::TS;

#[derive(Debug, Clone, Serialize, Deserialize, TS, PartialEq)]
#[ts(export)]
#[serde(rename_all = "lowercase")]
pub enum CommandCategory {
    Server,
    Check,
}

impl std::fmt::Display for CommandCategory {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            CommandCategory::Server => write!(f, "server"),
            CommandCategory::Check => write!(f, "check"),
        }
    }
}

impl CommandCategory {
    pub fn from_db(value: String) -> Result<Self, String> {
        match value.as_str() {
            "server" => Ok(CommandCategory::Server),
            "check" => Ok(CommandCategory::Check),
            other => Err(format!("Invalid command category: {other}")),
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, TS, PartialEq)]
#[ts(export)]
#[serde(rename_all = "lowercase")]
pub enum CommandMode {
    Headless,
    Terminal,
}

impl std::fmt::Display for CommandMode {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            CommandMode::Headless => write!(f, "headless"),
            CommandMode::Terminal => write!(f, "terminal"),
        }
    }
}

impl CommandMode {
    pub fn from_db(value: String) -> Result<Self, String> {
        match value.as_str() {
            "headless" => Ok(CommandMode::Headless),
            "terminal" => Ok(CommandMode::Terminal),
            other => Err(format!("Invalid command mode: {other}")),
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, TS, PartialEq)]
#[ts(export)]
#[serde(rename_all = "snake_case")]
pub enum RestartPolicy {
    Never,
    OnFailure,
    Always,
}

impl std::fmt::Display for RestartPolicy {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            RestartPolicy::Never => write!(f, "never"),
            RestartPolicy::OnFailure => write!(f, "on_failure"),
            RestartPolicy::Always => write!(f, "always"),
        }
    }
}

impl RestartPolicy {
    pub fn from_db(value: String) -> Result<Self, String> {
        match value.as_str() {
            "never" => Ok(RestartPolicy::Never),
            "on_failure" => Ok(RestartPolicy::OnFailure),
            "always" => Ok(RestartPolicy::Always),
            other => Err(format!("Invalid restart policy: {other}")),
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, TS)]
#[ts(export)]
pub struct WorkspaceCommand {
    pub id: String,
    pub dashboard_id: String,
    pub category: CommandCategory,
    pub name: String,
    pub command: String,
    pub port_pattern: Option<String>,
    #[ts(type = "number")]
    pub expected_exit_code: i64,
    #[ts(type = "number")]
    pub sort_order: i64,
    pub mode: CommandMode,
    pub restart_policy: RestartPolicy,
    #[ts(type = "number | null")]
    pub timeout_seconds: Option<i64>,
}

#[derive(Debug, Deserialize)]
pub struct CreateWorkspaceCommandRequest {
    pub dashboard_id: String,
    pub category: CommandCategory,
    pub name: String,
    pub command: String,
    pub port_pattern: Option<String>,
    pub expected_exit_code: Option<i64>,
    pub sort_order: Option<i64>,
    pub mode: Option<CommandMode>,
    pub restart_policy: Option<RestartPolicy>,
    pub timeout_seconds: Option<i64>,
}

#[derive(Debug, Deserialize)]
pub struct UpdateWorkspaceCommandRequest {
    pub id: String,
    pub name: Option<String>,
    pub category: Option<CommandCategory>,
    pub command: Option<String>,
    #[serde(default, deserialize_with = "crate::models::dashboard::deserialize_optional_nullable")]
    pub port_pattern: Option<Option<String>>,
    pub expected_exit_code: Option<i64>,
    pub sort_order: Option<i64>,
    pub mode: Option<CommandMode>,
    pub restart_policy: Option<RestartPolicy>,
    #[serde(default, deserialize_with = "crate::models::dashboard::deserialize_optional_nullable_i64")]
    pub timeout_seconds: Option<Option<i64>>,
}

#[cfg(test)]
mod tests {
    use super::*;

    // --- CommandMode ---

    #[test]
    fn command_mode_from_db_headless() {
        assert_eq!(CommandMode::from_db("headless".to_string()), Ok(CommandMode::Headless));
    }

    #[test]
    fn command_mode_from_db_terminal() {
        assert_eq!(CommandMode::from_db("terminal".to_string()), Ok(CommandMode::Terminal));
    }

    #[test]
    fn command_mode_from_db_invalid() {
        assert!(CommandMode::from_db("embedded".to_string()).is_err());
    }

    #[test]
    fn command_mode_display() {
        assert_eq!(CommandMode::Headless.to_string(), "headless");
        assert_eq!(CommandMode::Terminal.to_string(), "terminal");
    }

    // --- RestartPolicy ---

    #[test]
    fn restart_policy_from_db_never() {
        assert_eq!(RestartPolicy::from_db("never".to_string()), Ok(RestartPolicy::Never));
    }

    #[test]
    fn restart_policy_from_db_on_failure() {
        assert_eq!(RestartPolicy::from_db("on_failure".to_string()), Ok(RestartPolicy::OnFailure));
    }

    #[test]
    fn restart_policy_from_db_always() {
        assert_eq!(RestartPolicy::from_db("always".to_string()), Ok(RestartPolicy::Always));
    }

    #[test]
    fn restart_policy_from_db_invalid() {
        assert!(RestartPolicy::from_db("retry".to_string()).is_err());
    }

    #[test]
    fn restart_policy_display() {
        assert_eq!(RestartPolicy::Never.to_string(), "never");
        assert_eq!(RestartPolicy::OnFailure.to_string(), "on_failure");
        assert_eq!(RestartPolicy::Always.to_string(), "always");
    }
}
