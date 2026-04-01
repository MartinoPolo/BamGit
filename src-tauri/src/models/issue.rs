use serde::{Deserialize, Serialize};

// Note: priority, status, and worktree_state are stored as String fields in the Issue struct.
// Type safety is enforced by SQLite CHECK constraints. Typed enums can be introduced later
// with rusqlite::types::FromSql if compile-time exhaustive matching is needed.

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Issue {
    pub id: String,
    pub dashboard_id: String,
    pub name: String,
    pub priority: Option<String>,
    pub color: Option<String>,
    pub status: String,
    pub github_issue_url: Option<String>,
    pub github_issue_number: Option<i64>,
    pub branch_name: Option<String>,
    pub base_branch: Option<String>,
    pub worktree_folder: Option<String>,
    pub worktree_state: String,
    pub parent_issue_id: Option<String>,
    pub editor_folder: Option<String>,
    pub dev_server_command: Option<String>,
    pub dev_server_port: Option<i64>,
    pub dev_server_pid: Option<i64>,
    pub browser_url: Option<String>,
    pub sort_order: i64,
    pub created_at: String,
}

#[derive(Debug, Deserialize)]
pub struct CreateIssueRequest {
    pub dashboard_id: String,
    pub name: String,
    pub priority: Option<String>,
    pub color: Option<String>,
    pub github_issue_url: Option<String>,
    pub github_issue_number: Option<i64>,
    pub parent_issue_id: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct UpdateIssueRequest {
    pub id: String,
    pub name: Option<String>,
    pub priority: Option<Option<String>>,
    pub color: Option<Option<String>>,
    pub github_issue_url: Option<Option<String>>,
    pub github_issue_number: Option<Option<i64>>,
    pub parent_issue_id: Option<Option<String>>,
    pub sort_order: Option<i64>,
}
