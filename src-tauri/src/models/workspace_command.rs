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
}
