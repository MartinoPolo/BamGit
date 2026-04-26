use serde::{Deserialize, Serialize};
use ts_rs::TS;

use crate::models::github::PullRequestState;

#[derive(Debug, Clone, Serialize, Deserialize, TS)]
#[ts(export)]
pub struct GitStatusCache {
    pub issue_id: String,
    pub branch_status: Option<String>,
    pub pr_state: Option<PullRequestState>,
    #[ts(type = "number | null")]
    pub pr_number: Option<i64>,
    pub pr_url: Option<String>,
    pub github_issue_state: Option<String>,
    #[ts(type = "number | null")]
    pub behind_base_count: Option<i64>,
    pub merge_conflict: Option<bool>,
    pub fetched_at: Option<String>,
}
