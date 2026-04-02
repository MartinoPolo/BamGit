use serde::{Deserialize, Serialize};

/// Cached GitHub status for an issue, mirroring the `git_status_cache` table.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GitHubStatusCache {
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

/// Result of `gh auth status` check.
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "kebab-case")]
pub enum GhCliAvailability {
    Available,
    NotInstalled,
    NotAuthenticated,
}

/// A GitHub issue assigned to the current user, returned by `gh issue list --assignee @me`.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AssignedIssue {
    pub number: i64,
    pub title: String,
    pub state: String,
    pub url: String,
}

/// Result of a bulk sync operation.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SyncAllResult {
    pub synced_count: usize,
    pub errors: Vec<String>,
}

/// Deserialization target for `gh issue view --json state,url`.
#[derive(Debug, Deserialize)]
#[allow(dead_code)] // Fields read by serde, not all accessed in Rust
pub struct GhIssueViewOutput {
    pub state: String,
    pub url: String,
}

/// Deserialization target for `gh pr list --json number,state,url,isDraft,reviewRequests`.
#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct GhPullRequestOutput {
    pub number: i64,
    pub state: String,
    pub url: String,
    pub is_draft: bool,
    pub review_requests: Vec<GhReviewRequest>,
}

/// A review request entry from gh CLI output.
#[derive(Debug, Deserialize)]
#[allow(dead_code)] // Fields populated by serde; we only check vec emptiness
pub struct GhReviewRequest {
    #[serde(default)]
    pub login: Option<String>,
    #[serde(default)]
    pub name: Option<String>,
}

/// Maps gh CLI PR output to our internal state string.
pub fn resolve_pull_request_state(pr: &GhPullRequestOutput) -> &'static str {
    match pr.state.as_str() {
        "MERGED" => "merged",
        "CLOSED" => "closed",
        _ => {
            // OPEN state with sub-states
            if pr.is_draft {
                "draft"
            } else if !pr.review_requests.is_empty() {
                "review-requested"
            } else {
                "open"
            }
        }
    }
}

/// Maps gh CLI issue state to our internal state string (lowercase).
pub fn resolve_github_issue_state(gh_state: &str) -> &'static str {
    match gh_state {
        "CLOSED" => "closed",
        _ => "open",
    }
}
