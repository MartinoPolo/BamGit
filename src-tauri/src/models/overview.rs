use serde::{Deserialize, Serialize};
use ts_rs::TS;

use super::dashboard::DashboardStatus;

#[derive(Debug, Clone, Serialize, Deserialize, TS)]
#[ts(export)]
pub struct OverviewWorkspaceData {
    pub dashboard_id: String,
    pub name: String,
    pub github_repo: Option<String>,
    pub local_folder: Option<String>,
    pub color_palette_id: Option<String>,
    pub accent_color: Option<String>,
    #[ts(type = "number")]
    pub open_issue_count: i64,
    #[ts(type = "number")]
    pub active_session_count: i64,
    pub last_activity: Option<String>,
    pub total_cost_usd: Option<f64>,
    #[ts(type = "number")]
    pub hitl_count: i64,
    #[ts(type = "number")]
    pub open_pr_count: i64,
    #[ts(type = "number")]
    pub prs_needing_attention: i64,
    pub afk_loop_status: String,
    pub default_branch: Option<String>,
    #[ts(type = "number")]
    pub worktree_count: i64,
    #[ts(type = "number")]
    pub afk_ready_count: i64,
    #[ts(type = "number")]
    pub prd_count: i64,
    #[ts(type = "number")]
    pub prd_completed_subs: i64,
    #[ts(type = "number")]
    pub prd_total_subs: i64,
    pub status: DashboardStatus,
}
