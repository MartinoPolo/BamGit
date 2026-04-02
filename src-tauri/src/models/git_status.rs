use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GitStatusCache {
    pub issue_id: String,
    pub branch_status: Option<String>,
    pub pr_state: Option<String>,
    pub pr_number: Option<i64>,
    pub pr_url: Option<String>,
    pub github_issue_state: Option<String>,
    pub behind_base_count: Option<i64>,
    pub merge_conflict: Option<bool>,
    pub fetched_at: Option<String>,
}
