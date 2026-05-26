use serde::{Deserialize, Serialize};
use ts_rs::TS;

#[derive(Debug, Clone, Serialize, Deserialize, TS)]
#[ts(export)]
pub struct UserSetting {
    pub key: String,
    pub value: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, TS)]
#[ts(export)]
pub struct WorkspaceSetting {
    pub dashboard_id: String,
    pub key: String,
    pub value: String,
}

pub const STARTUP_BEHAVIOR_KEY: &str = "startup_behavior";
pub const STARTUP_BEHAVIOR_OVERVIEW: &str = "overview";
pub const STARTUP_BEHAVIOR_LAST_WORKSPACE: &str = "last-workspace";
pub const LAST_WORKSPACE_ID_KEY: &str = "last_workspace_id";
