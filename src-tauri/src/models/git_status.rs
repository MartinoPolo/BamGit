use rusqlite::Row;
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
    pub has_local_changes: Option<bool>,
    #[ts(type = "number | null")]
    pub ahead_remote_count: Option<i64>,
    pub fetched_at: Option<String>,
}

pub const GIT_STATUS_CACHE_SELECT_COLUMNS: &str =
    "issue_id, branch_status, pr_state, pr_number, pr_url, github_issue_state, \
     behind_base_count, merge_conflict, has_local_changes, ahead_remote_count, fetched_at";

pub fn row_to_git_status_cache(row: &Row) -> Result<GitStatusCache, rusqlite::Error> {
    Ok(GitStatusCache {
        issue_id: row.get(0)?,
        branch_status: row.get(1)?,
        pr_state: row.get(2)?,
        pr_number: row.get(3)?,
        pr_url: row.get(4)?,
        github_issue_state: row.get(5)?,
        behind_base_count: row.get(6)?,
        merge_conflict: row.get(7)?,
        has_local_changes: row.get(8)?,
        ahead_remote_count: row.get(9)?,
        fetched_at: row.get(10)?,
    })
}
