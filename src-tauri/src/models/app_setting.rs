use serde::{Deserialize, Serialize};
use ts_rs::TS;

#[derive(Debug, Clone, Serialize, Deserialize, TS)]
#[ts(export)]
pub struct AppSetting {
    pub key: String,
    pub value: String,
}

pub const STARTUP_BEHAVIOR_KEY: &str = "startup_behavior";
pub const STARTUP_BEHAVIOR_OVERVIEW: &str = "overview";
pub const STARTUP_BEHAVIOR_LAST_WORKSPACE: &str = "last-workspace";
