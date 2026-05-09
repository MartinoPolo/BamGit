use serde::{Deserialize, Serialize};
use ts_rs::TS;

/// PR lifecycle states matching the DB CHECK constraint on `git_status_cache.pr_state`.
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, TS)]
#[ts(export)]
#[serde(rename_all = "kebab-case")]
pub enum PullRequestState {
    Draft,
    Open,
    ReviewRequested,
    ChangesRequested,
    Approved,
    ReadyToMerge,
    Merged,
    Closed,
}

impl_sql_enum!(PullRequestState {
    Draft => "draft",
    Open => "open",
    ReviewRequested => "review-requested",
    ChangesRequested => "changes-requested",
    Approved => "approved",
    ReadyToMerge => "ready-to-merge",
    Merged => "merged",
    Closed => "closed",
});

/// Result of `gh auth status` check.
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, TS)]
#[ts(export)]
#[serde(rename_all = "kebab-case")]
pub enum GhCliAvailability {
    Available,
    NotInstalled,
    NotAuthenticated,
}

/// Response from GitHub POST /login/device/code.
#[derive(Debug, Clone, Serialize, Deserialize, TS)]
#[ts(export)]
pub struct DeviceFlowStartResult {
    pub device_code: String,
    pub user_code: String,
    pub verification_uri: String,
    #[ts(type = "number")]
    pub expires_in: u64,
    #[ts(type = "number")]
    pub interval: u64,
}

/// GitHub user profile (subset of GET /user response).
#[derive(Debug, Clone, Serialize, Deserialize, TS)]
#[ts(export)]
pub struct GitHubUser {
    pub login: String,
    pub avatar_url: String,
}

/// Authentication status reported to the frontend.
#[derive(Debug, Clone, Serialize, Deserialize, TS)]
#[ts(export)]
#[serde(tag = "status", rename_all = "kebab-case")]
pub enum GhAuthStatus {
    NotConnected,
    #[serde(rename = "oauth-connected")]
    OAuthConnected { user: GitHubUser },
    CliConnected,
}

/// A label on a GitHub issue (name + hex color).
#[derive(Debug, Clone, Serialize, Deserialize, TS)]
#[ts(export)]
pub struct AssignedIssueLabel {
    pub name: String,
    pub color: String,
}

/// A GitHub issue assigned to the current user, returned by `gh issue list --assignee @me`.
#[derive(Debug, Clone, Serialize, Deserialize, TS)]
#[ts(export)]
pub struct AssignedIssue {
    #[ts(type = "number")]
    pub number: i64,
    pub title: String,
    pub state: String,
    pub url: String,
    #[serde(default)]
    pub labels: Vec<AssignedIssueLabel>,
    #[serde(default)]
    #[ts(type = "number | null")]
    pub parent_issue_number: Option<i64>,
}

/// Paginated result from fetch_assigned_issues.
#[derive(Debug, Clone, Serialize, Deserialize, TS)]
#[ts(export)]
pub struct AssignedIssuesResult {
    pub issues: Vec<AssignedIssue>,
    pub has_more: bool,
}

/// A GitHub issue returned by search, used in the creation wizard.
#[derive(Debug, Clone, Serialize, Deserialize, TS)]
#[ts(export)]
pub struct SearchedGithubIssue {
    #[ts(type = "number")]
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

/// Deserialization target for `gh issue view --json state`.
/// Only `state` is used in production; the url field from the CLI response is ignored by serde.
#[derive(Debug, Deserialize)]
pub struct GhIssueViewOutput {
    pub state: String,
}

impl GhIssueViewOutput {
    /// Parse from a REST API JSON value, mapping the lowercase state.
    pub fn from_rest_json(value: &serde_json::Value) -> Result<Self, String> {
        Ok(Self {
            state: value.get("state").and_then(|s| s.as_str()).ok_or("Missing state")?.to_string(),
        })
    }
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

/// Maps GitHub issue state to our internal state string (lowercase).
/// Handles both CLI format ("OPEN"/"CLOSED") and REST API format ("open"/"closed").
pub fn resolve_github_issue_state(gh_state: &str) -> &'static str {
    match gh_state.to_uppercase().as_str() {
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

    // ─── Device Flow type tests ──────────────────────────────────────────────

    #[test]
    fn device_flow_start_result_deserializes_from_github_response() {
        let json = r#"{
            "device_code": "3584d83530557fdd4b50c4c855bc37a4d0eec9b9",
            "user_code": "WDJB-MJHT",
            "verification_uri": "https://github.com/login/device",
            "expires_in": 900,
            "interval": 5
        }"#;
        let result: DeviceFlowStartResult = serde_json::from_str(json).unwrap();
        assert_eq!(result.user_code, "WDJB-MJHT");
        assert_eq!(result.verification_uri, "https://github.com/login/device");
        assert_eq!(result.expires_in, 900);
        assert_eq!(result.interval, 5);
    }

    #[test]
    fn github_user_deserializes_from_api_response() {
        let json = r#"{
            "login": "octocat",
            "avatar_url": "https://avatars.githubusercontent.com/u/1?v=4",
            "id": 1,
            "name": "The Octocat"
        }"#;
        let user: GitHubUser = serde_json::from_str(json).unwrap();
        assert_eq!(user.login, "octocat");
        assert_eq!(
            user.avatar_url,
            "https://avatars.githubusercontent.com/u/1?v=4"
        );
    }

    #[test]
    fn gh_auth_status_not_connected_serializes_correctly() {
        let status = GhAuthStatus::NotConnected;
        let json = serde_json::to_string(&status).unwrap();
        assert_eq!(json, r#"{"status":"not-connected"}"#);
    }

    #[test]
    fn gh_auth_status_oauth_connected_serializes_correctly() {
        let status = GhAuthStatus::OAuthConnected {
            user: GitHubUser {
                login: "testuser".to_string(),
                avatar_url: "https://example.com/avatar.png".to_string(),
            },
        };
        let json = serde_json::to_string(&status).unwrap();
        let parsed: serde_json::Value = serde_json::from_str(&json).unwrap();
        assert_eq!(parsed["status"], "oauth-connected");
        assert_eq!(parsed["user"]["login"], "testuser");
    }

    #[test]
    fn gh_auth_status_cli_connected_serializes_correctly() {
        let status = GhAuthStatus::CliConnected;
        let json = serde_json::to_string(&status).unwrap();
        assert_eq!(json, r#"{"status":"cli-connected"}"#);
    }

    #[test]
    fn gh_auth_status_round_trip() {
        let original = GhAuthStatus::OAuthConnected {
            user: GitHubUser {
                login: "user".to_string(),
                avatar_url: "https://example.com/a.png".to_string(),
            },
        };
        let json = serde_json::to_string(&original).unwrap();
        let deserialized: GhAuthStatus = serde_json::from_str(&json).unwrap();
        match deserialized {
            GhAuthStatus::OAuthConnected { user } => {
                assert_eq!(user.login, "user");
            }
            _ => panic!("Expected OAuthConnected"),
        }
    }

    #[test]
    fn device_flow_poll_success_response_parses() {
        let json = r#"{
            "access_token": "gho_16C7e42F292c6912E7710c838347Ae178B4a",
            "token_type": "bearer",
            "scope": "repo read:org read:user"
        }"#;
        let value: serde_json::Value = serde_json::from_str(json).unwrap();
        let token = value["access_token"].as_str().unwrap();
        assert!(token.starts_with("gho_"));
        assert!(value.get("error").is_none());
    }

    #[test]
    fn device_flow_poll_authorization_pending_parses() {
        let json = r#"{"error": "authorization_pending"}"#;
        let value: serde_json::Value = serde_json::from_str(json).unwrap();
        assert_eq!(value["error"].as_str().unwrap(), "authorization_pending");
    }

    #[test]
    fn device_flow_poll_slow_down_parses() {
        let json = r#"{"error": "slow_down"}"#;
        let value: serde_json::Value = serde_json::from_str(json).unwrap();
        assert_eq!(value["error"].as_str().unwrap(), "slow_down");
    }

    #[test]
    fn device_flow_poll_expired_token_parses() {
        let json = r#"{"error": "expired_token"}"#;
        let value: serde_json::Value = serde_json::from_str(json).unwrap();
        assert_eq!(value["error"].as_str().unwrap(), "expired_token");
    }

    #[test]
    fn device_flow_poll_access_denied_parses() {
        let json = r#"{"error": "access_denied"}"#;
        let value: serde_json::Value = serde_json::from_str(json).unwrap();
        assert_eq!(value["error"].as_str().unwrap(), "access_denied");
    }
}
