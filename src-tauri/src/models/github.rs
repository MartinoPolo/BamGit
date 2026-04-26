use rusqlite::types::{FromSql, FromSqlError, FromSqlResult, ToSql, ToSqlOutput, ValueRef};
use serde::{Deserialize, Serialize};
use ts_rs::TS;

/// PR lifecycle states matching the DB CHECK constraint on `git_status_cache.pr_state`.
/// Note: Does NOT include `ready-to-merge` — that exists in TypeScript but not in the DB schema.
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, TS)]
#[ts(export)]
#[serde(rename_all = "kebab-case")]
pub enum PullRequestState {
    Draft,
    Open,
    ReviewRequested,
    ChangesRequested,
    Approved,
    Merged,
    Closed,
}

impl PullRequestState {
    pub fn as_str(&self) -> &'static str {
        match self {
            PullRequestState::Draft => "draft",
            PullRequestState::Open => "open",
            PullRequestState::ReviewRequested => "review-requested",
            PullRequestState::ChangesRequested => "changes-requested",
            PullRequestState::Approved => "approved",
            PullRequestState::Merged => "merged",
            PullRequestState::Closed => "closed",
        }
    }
}

impl FromSql for PullRequestState {
    fn column_result(value: ValueRef<'_>) -> FromSqlResult<Self> {
        let text = value.as_str()?;
        match text {
            "draft" => Ok(PullRequestState::Draft),
            "open" => Ok(PullRequestState::Open),
            "review-requested" => Ok(PullRequestState::ReviewRequested),
            "changes-requested" => Ok(PullRequestState::ChangesRequested),
            "approved" => Ok(PullRequestState::Approved),
            "merged" => Ok(PullRequestState::Merged),
            "closed" => Ok(PullRequestState::Closed),
            other => Err(FromSqlError::Other(
                format!("Unknown PullRequestState: {other}").into(),
            )),
        }
    }
}

impl ToSql for PullRequestState {
    fn to_sql(&self) -> rusqlite::Result<ToSqlOutput<'_>> {
        Ok(ToSqlOutput::from(self.as_str()))
    }
}

/// Cached GitHub status for an issue, mirroring the `git_status_cache` table.
#[derive(Debug, Clone, Serialize, Deserialize, TS)]
#[ts(export)]
pub struct GitHubStatusCache {
    pub issue_id: String,
    pub branch_status: Option<String>,
    pub pr_state: Option<PullRequestState>,
    pub pr_number: Option<i64>,
    pub pr_url: Option<String>,
    pub github_issue_state: Option<String>,
    pub behind_base_count: Option<i64>,
    pub merge_conflict: Option<bool>,
    pub fetched_at: Option<String>,
}

/// Result of `gh auth status` check.
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, TS)]
#[ts(export)]
#[serde(rename_all = "kebab-case")]
pub enum GhCliAvailability {
    Available,
    NotInstalled,
    NotAuthenticated,
}

/// A GitHub issue assigned to the current user, returned by `gh issue list --assignee @me`.
#[derive(Debug, Clone, Serialize, Deserialize, TS)]
#[ts(export)]
pub struct AssignedIssue {
    pub number: i64,
    pub title: String,
    pub state: String,
    pub url: String,
}

/// Result of a bulk sync operation.
#[derive(Debug, Clone, Serialize, Deserialize, TS)]
#[ts(export)]
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

/// Deserialization target for `gh pr list --json number,state,url,isDraft,reviewRequests,latestReviews`.
#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct GhPullRequestOutput {
    pub number: i64,
    pub state: String,
    pub url: String,
    pub is_draft: bool,
    pub review_requests: Vec<GhReviewRequest>,
    #[serde(default)]
    pub latest_reviews: Vec<GhReviewOutput>,
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

/// A review entry from `latestReviews` in gh CLI output.
#[derive(Debug, Deserialize)]
pub struct GhReviewOutput {
    pub state: String,
}

/// Maps gh CLI PR output to our internal PR state enum.
pub fn resolve_pull_request_state(pr: &GhPullRequestOutput) -> PullRequestState {
    match pr.state.as_str() {
        "MERGED" => PullRequestState::Merged,
        "CLOSED" => PullRequestState::Closed,
        _ => {
            // OPEN state with sub-states
            if pr.is_draft {
                PullRequestState::Draft
            } else if !pr.review_requests.is_empty() {
                PullRequestState::ReviewRequested
            // latestReviews is limited to first:1 in both GraphQL and CLI queries
            } else if let Some(review) = pr.latest_reviews.last() {
                match review.state.as_str() {
                    "APPROVED" => PullRequestState::Approved,
                    "CHANGES_REQUESTED" => PullRequestState::ChangesRequested,
                    _ => PullRequestState::Open,
                }
            } else {
                PullRequestState::Open
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

#[cfg(test)]
mod tests {
    use super::*;

    fn make_pr(
        state: &str,
        is_draft: bool,
        review_requests: Vec<GhReviewRequest>,
        latest_reviews: Vec<GhReviewOutput>,
    ) -> GhPullRequestOutput {
        GhPullRequestOutput {
            number: 1,
            state: state.to_string(),
            url: "https://github.com/test/repo/pull/1".to_string(),
            is_draft,
            review_requests,
            latest_reviews,
        }
    }

    #[test]
    fn resolve_pr_state_approved() {
        let pr = make_pr(
            "OPEN",
            false,
            vec![],
            vec![GhReviewOutput {
                state: "APPROVED".to_string(),
            }],
        );
        assert_eq!(resolve_pull_request_state(&pr), PullRequestState::Approved);
    }

    #[test]
    fn resolve_pr_state_changes_requested() {
        let pr = make_pr(
            "OPEN",
            false,
            vec![],
            vec![GhReviewOutput {
                state: "CHANGES_REQUESTED".to_string(),
            }],
        );
        assert_eq!(resolve_pull_request_state(&pr), PullRequestState::ChangesRequested);
    }

    #[test]
    fn resolve_pr_state_draft() {
        let pr = make_pr("OPEN", true, vec![], vec![]);
        assert_eq!(resolve_pull_request_state(&pr), PullRequestState::Draft);
    }

    #[test]
    fn resolve_pr_state_review_requested() {
        let pr = make_pr(
            "OPEN",
            false,
            vec![GhReviewRequest {
                login: Some("reviewer".to_string()),
                name: None,
            }],
            vec![],
        );
        assert_eq!(resolve_pull_request_state(&pr), PullRequestState::ReviewRequested);
    }

    #[test]
    fn resolve_pr_state_merged() {
        let pr = make_pr("MERGED", false, vec![], vec![]);
        assert_eq!(resolve_pull_request_state(&pr), PullRequestState::Merged);
    }

    #[test]
    fn resolve_pr_state_open_fallback() {
        let pr = make_pr("OPEN", false, vec![], vec![]);
        assert_eq!(resolve_pull_request_state(&pr), PullRequestState::Open);
    }

    #[test]
    fn pull_request_state_serde_round_trip() {
        let json = "\"review-requested\"";
        let deserialized: PullRequestState = serde_json::from_str(json).unwrap();
        assert_eq!(deserialized, PullRequestState::ReviewRequested);
        let serialized = serde_json::to_string(&deserialized).unwrap();
        assert_eq!(serialized, "\"review-requested\"");
    }
}
