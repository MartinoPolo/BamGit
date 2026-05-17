use serde::{Deserialize, Serialize};
use ts_rs::TS;

/// Kept for backward compatibility with frontend `get_app_setting`/`set_app_setting`.
/// New code should use `UserSetting` and `WorkspaceSetting` from `models::setting`.
#[derive(Debug, Clone, Serialize, Deserialize, TS)]
#[ts(export)]
pub struct AppSetting {
    pub key: String,
    pub value: String,
}
