use serde::{Deserialize, Serialize};
use ts_rs::TS;

#[derive(Debug, Clone, Serialize, Deserialize, TS)]
#[ts(export)]
pub struct OverviewWorkspaceData {
    pub dashboard_id: String,
    pub name: String,
    pub github_repo: Option<String>,
    pub local_folder: Option<String>,
    pub color_palette_id: Option<String>,
    #[ts(type = "number")]
    pub open_issue_count: i64,
    #[ts(type = "number")]
    pub active_session_count: i64,
    pub last_activity: Option<String>,
    pub total_cost_usd: Option<f64>,
}
