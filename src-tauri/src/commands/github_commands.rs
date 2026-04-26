use rusqlite::{Connection, Row};
use tauri::State;

use crate::database::connection::DatabaseState;
use crate::models::github::{
    resolve_github_issue_state, resolve_pull_request_state, AssignedIssue, GhCliAvailability,
    GhIssueViewOutput, GhPullRequestOutput, GhReviewOutput, GhReviewRequest, GitHubStatusCache,
    SyncAllResult,
};

const CACHE_SELECT_COLUMNS: &str =
    "issue_id, branch_status, pr_state, pr_number, pr_url, github_issue_state, \
     behind_base_count, merge_conflict, fetched_at";

fn row_to_github_status_cache(row: &Row) -> Result<GitHubStatusCache, rusqlite::Error> {
    Ok(GitHubStatusCache {
        issue_id: row.get(0)?,
        branch_status: row.get(1)?,
        pr_state: row.get(2)?,
        pr_number: row.get(3)?,
        pr_url: row.get(4)?,
        github_issue_state: row.get(5)?,
        behind_base_count: row.get(6)?,
        merge_conflict: row.get(7)?,
        fetched_at: row.get(8)?,
    })
}

fn upsert_cache(connection: &Connection, cache: &GitHubStatusCache) -> Result<(), String> {
    connection
        .execute(
            "INSERT INTO git_status_cache (issue_id, branch_status, pr_state, pr_number, pr_url, \
             github_issue_state, behind_base_count, merge_conflict, fetched_at) \
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, datetime('now')) \
             ON CONFLICT(issue_id) DO UPDATE SET \
             branch_status = COALESCE(excluded.branch_status, branch_status), \
             pr_state = COALESCE(excluded.pr_state, pr_state), \
             pr_number = COALESCE(excluded.pr_number, pr_number), \
             pr_url = COALESCE(excluded.pr_url, pr_url), \
             github_issue_state = COALESCE(excluded.github_issue_state, github_issue_state), \
             behind_base_count = COALESCE(excluded.behind_base_count, behind_base_count), \
             merge_conflict = COALESCE(excluded.merge_conflict, merge_conflict), \
             fetched_at = datetime('now')",
            rusqlite::params![
                cache.issue_id,
                cache.branch_status,
                cache.pr_state,
                cache.pr_number,
                cache.pr_url,
                cache.github_issue_state,
                cache.behind_base_count,
                cache.merge_conflict,
            ],
        )
        .map_err(|error| format!("Failed to upsert GitHub status cache: {error}"))?;
    Ok(())
}

fn read_cache(
    connection: &Connection,
    issue_id: &str,
) -> Result<Option<GitHubStatusCache>, String> {
    let query = format!("SELECT {CACHE_SELECT_COLUMNS} FROM git_status_cache WHERE issue_id = ?1");
    match connection.query_row(&query, [issue_id], |row| row_to_github_status_cache(row)) {
        Ok(cache) => Ok(Some(cache)),
        Err(rusqlite::Error::QueryReturnedNoRows) => Ok(None),
        Err(error) => Err(format!("Failed to read GitHub status cache: {error}")),
    }
}

fn read_all_caches_for_dashboard(
    connection: &Connection,
    dashboard_id: &str,
) -> Result<Vec<GitHubStatusCache>, String> {
    let query = format!(
        "SELECT {CACHE_SELECT_COLUMNS} FROM git_status_cache \
         WHERE issue_id IN (SELECT id FROM issues WHERE dashboard_id = ?1)"
    );
    let mut statement = connection
        .prepare(&query)
        .map_err(|error| format!("Failed to prepare query: {error}"))?;
    let caches = statement
        .query_map([dashboard_id], |row| row_to_github_status_cache(row))
        .map_err(|error| format!("Failed to query caches: {error}"))?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|error| format!("Failed to read cache row: {error}"))?;
    Ok(caches)
}

/// Run a gh CLI command and return stdout. Returns Err on non-zero exit or missing binary.
async fn run_gh_command(args: &[&str]) -> Result<String, String> {
    let output = tokio::process::Command::new("gh")
        .args(args)
        .output()
        .await
        .map_err(|error| {
            if error.kind() == std::io::ErrorKind::NotFound {
                "gh CLI not found. Install it from https://cli.github.com".to_string()
            } else {
                format!("Failed to run gh command: {error}")
            }
        })?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        return Err(format!("gh command failed: {stderr}"));
    }

    String::from_utf8(output.stdout)
        .map_err(|error| format!("Invalid UTF-8 in gh output: {error}"))
}

const GITHUB_DEFAULT_LABEL_COLOR: &str = "6e7681";

fn parse_label_nodes_to_json(label_nodes: &[serde_json::Value]) -> String {
    let labels: Vec<serde_json::Value> = label_nodes
        .iter()
        .filter_map(|node| {
            let name = node.get("name")?.as_str()?;
            let color = node
                .get("color")
                .and_then(|c| c.as_str())
                .unwrap_or(GITHUB_DEFAULT_LABEL_COLOR);
            Some(serde_json::json!({"name": name, "color": format!("#{color}")}))
        })
        .collect();
    serde_json::to_string(&labels).unwrap_or_else(|_| "[]".to_string())
}

/// Build a GraphQL query to fetch multiple issues and their associated PRs in one call.
fn build_bulk_sync_graphql_query(
    owner: &str,
    repo: &str,
    issue_numbers: &[i64],
    branch_names: &[Option<&str>],
) -> String {
    let mut fragments = Vec::with_capacity(issue_numbers.len() * 2);

    for (index, &number) in issue_numbers.iter().enumerate() {
        fragments.push(format!(
            "issue_{index}: issue(number: {number}) {{ state url labels(first: 20) {{ nodes {{ name color }} }} }}"
        ));
    }

    for (index, branch) in branch_names.iter().enumerate() {
        if let Some(branch_name) = branch {
            // Escape the branch name for GraphQL string literal
            let escaped = branch_name.replace('\\', "\\\\").replace('"', "\\\"");
            fragments.push(format!(
                "pr_{index}: pullRequests(headRefName: \"{escaped}\", first: 1, orderBy: {{field: CREATED_AT, direction: DESC}}) {{ \
                 nodes {{ number state url isDraft reviewRequests(first: 10) {{ nodes {{ requestedReviewer {{ ... on User {{ login }} ... on Team {{ name }} }} }} }} latestReviews(first: 1) {{ nodes {{ state }} }} }} }}"
            ));
        }
    }

    let safe_owner = owner.replace(['\\', '"'], "");
    let safe_repo = repo.replace(['\\', '"'], "");
    format!(
        "query {{ repository(owner: \"{safe_owner}\", name: \"{safe_repo}\") {{ {fragments} }} }}",
        fragments = fragments.join(" ")
    )
}

// --- Tauri commands ---

#[tauri::command]
pub fn get_github_status_cache(
    state: State<DatabaseState>,
    issue_id: String,
) -> Result<Option<GitHubStatusCache>, String> {
    let connection = state.read();
    read_cache(&connection, &issue_id)
}

#[tauri::command]
pub fn get_all_github_status_caches(
    state: State<DatabaseState>,
    dashboard_id: String,
) -> Result<Vec<GitHubStatusCache>, String> {
    let connection = state.read();
    read_all_caches_for_dashboard(&connection, &dashboard_id)
}

#[tauri::command]
pub async fn check_gh_availability() -> Result<GhCliAvailability, String> {
    match run_gh_command(&["auth", "status"]).await {
        Ok(_) => Ok(GhCliAvailability::Available),
        Err(error) => {
            if error.contains("not found") || error.contains("not recognized") {
                Ok(GhCliAvailability::NotInstalled)
            } else {
                Ok(GhCliAvailability::NotAuthenticated)
            }
        }
    }
}

#[tauri::command]
pub async fn fetch_issue_state(
    state: State<'_, DatabaseState>,
    issue_id: String,
    owner: String,
    repo: String,
    issue_number: i64,
) -> Result<GitHubStatusCache, String> {
    let stdout = run_gh_command(&[
        "issue",
        "view",
        &issue_number.to_string(),
        "--repo",
        &format!("{owner}/{repo}"),
        "--json",
        "state,url",
    ])
    .await?;

    let gh_issue: GhIssueViewOutput =
        serde_json::from_str(&stdout).map_err(|error| format!("Failed to parse gh output: {error}"))?;

    let resolved_state = resolve_github_issue_state(&gh_issue.state);

    let cache = GitHubStatusCache {
        issue_id: issue_id.clone(),
        branch_status: None,
        pr_state: None,
        pr_number: None,
        pr_url: None,
        github_issue_state: Some(resolved_state.to_string()),
        behind_base_count: None,
        merge_conflict: None,
        fetched_at: None, // Set by DB via datetime('now')
    };

    // Acquire write lock only for DB write (not held across .await)
    {
        let connection = state.write();
        upsert_cache(&connection, &cache)?;
    }

    // Re-read to get fetched_at from DB
    let connection = state.read();
    read_cache(&connection, &issue_id)?
        .ok_or_else(|| "Cache entry not found after upsert".to_string())
}

#[tauri::command]
pub async fn fetch_pr_for_branch(
    state: State<'_, DatabaseState>,
    issue_id: String,
    owner: String,
    repo: String,
    branch_name: String,
) -> Result<GitHubStatusCache, String> {
    let stdout = run_gh_command(&[
        "pr",
        "list",
        "--head",
        &branch_name,
        "--repo",
        &format!("{owner}/{repo}"),
        "--json",
        "number,state,url,isDraft,reviewRequests,latestReviews",
        "--limit",
        "1",
    ])
    .await?;

    let prs: Vec<GhPullRequestOutput> =
        serde_json::from_str(&stdout).map_err(|error| format!("Failed to parse gh output: {error}"))?;

    let (pr_state, pr_number, pr_url) = if let Some(pr) = prs.first() {
        (
            Some(resolve_pull_request_state(pr)),
            Some(pr.number),
            Some(pr.url.clone()),
        )
    } else {
        (None, None, None)
    };

    let cache = GitHubStatusCache {
        issue_id: issue_id.clone(),
        branch_status: None,
        pr_state,
        pr_number,
        pr_url,
        github_issue_state: None,
        behind_base_count: None,
        merge_conflict: None,
        fetched_at: None,
    };

    {
        let connection = state.write();
        upsert_cache(&connection, &cache)?;
    }

    let connection = state.read();
    read_cache(&connection, &issue_id)?
        .ok_or_else(|| "Cache entry not found after upsert".to_string())
}

#[tauri::command]
pub async fn fetch_assigned_issues(
    owner: String,
    repo: String,
) -> Result<Vec<AssignedIssue>, String> {
    let stdout = run_gh_command(&[
        "issue",
        "list",
        "--assignee",
        "@me",
        "--repo",
        &format!("{owner}/{repo}"),
        "--json",
        "number,title,state,url",
    ])
    .await?;

    let issues: Vec<AssignedIssue> =
        serde_json::from_str(&stdout).map_err(|error| format!("Failed to parse gh output: {error}"))?;

    Ok(issues)
}

#[tauri::command]
pub async fn sync_all_github_state(
    state: State<'_, DatabaseState>,
    dashboard_id: String,
    owner: String,
    repo: String,
) -> Result<SyncAllResult, String> {
    // Read issues from DB (connection released before async work)
    let issues_data: Vec<(String, Option<i64>, Option<String>)> = {
        let connection = state.read();
        let mut statement = connection
            .prepare(
                "SELECT id, github_issue_number, branch_name FROM issues \
                 WHERE dashboard_id = ?1 AND status = 'active'",
            )
            .map_err(|error| format!("Failed to prepare query: {error}"))?;

        let results = statement
            .query_map([&dashboard_id], |row| {
                Ok((row.get(0)?, row.get(1)?, row.get(2)?))
            })
            .map_err(|error| format!("Failed to query issues: {error}"))?
            .collect::<Result<Vec<_>, _>>()
            .map_err(|error| format!("Failed to read issue row: {error}"))?;
        results
    };

    // Filter to issues that have a github_issue_number
    let syncable: Vec<_> = issues_data
        .iter()
        .filter(|(_, number, _)| number.is_some())
        .collect();

    if syncable.is_empty() {
        return Ok(SyncAllResult {
            synced_count: 0,
            errors: vec![],
        });
    }

    let issue_numbers: Vec<i64> = syncable.iter().map(|(_, n, _)| n.unwrap()).collect();
    let branch_names: Vec<Option<&str>> = syncable
        .iter()
        .map(|(_, _, b)| b.as_deref())
        .collect();

    let graphql_query =
        build_bulk_sync_graphql_query(&owner, &repo, &issue_numbers, &branch_names);

    let stdout = run_gh_command(&["api", "graphql", "-f", &format!("query={graphql_query}")])
        .await?;

    let response: serde_json::Value = serde_json::from_str(&stdout)
        .map_err(|error| format!("Failed to parse GraphQL response: {error}"))?;

    let repository = response
        .get("data")
        .and_then(|d| d.get("repository"))
        .ok_or("GraphQL response missing data.repository")?;

    // Parse all results first (no DB lock needed)
    let mut caches_to_write = Vec::with_capacity(syncable.len());
    let mut labels_to_write: Vec<(String, Option<String>)> = Vec::with_capacity(syncable.len());

    for (index, (issue_id, _, _)) in syncable.iter().enumerate() {
        let mut github_issue_state = None;
        let mut pr_state = None;
        let mut pr_number = None;
        let mut pr_url = None;
        let mut labels_json: Option<String> = None;

        // Parse issue state and labels
        let issue_key = format!("issue_{index}");
        if let Some(issue_data) = repository.get(&issue_key) {
            if let Some(state_str) = issue_data.get("state").and_then(|s| s.as_str()) {
                github_issue_state = Some(resolve_github_issue_state(state_str).to_string());
            }

            if let Some(label_nodes) = issue_data
                .get("labels")
                .and_then(|l| l.get("nodes"))
                .and_then(|n| n.as_array())
            {
                labels_json = Some(parse_label_nodes_to_json(label_nodes));
            }
        }

        // Parse PR state from GraphQL shape (differs from gh CLI JSON shape)
        // GraphQL: { nodes: [{ number, state, url, isDraft, reviewRequests: { nodes: [...] } }] }
        let pr_key = format!("pr_{index}");
        if let Some(pr_data) = repository.get(&pr_key) {
            if let Some(nodes) = pr_data.get("nodes").and_then(|n| n.as_array()) {
                if let Some(pr_node) = nodes.first() {
                    if let (Some(num), Some(st), Some(u)) = (
                        pr_node.get("number").and_then(|n| n.as_i64()),
                        pr_node.get("state").and_then(|s| s.as_str()),
                        pr_node.get("url").and_then(|s| s.as_str()),
                    ) {
                        let is_draft = pr_node.get("isDraft").and_then(|d| d.as_bool()).unwrap_or(false);
                        let has_review_requests = pr_node
                            .get("reviewRequests")
                            .and_then(|rr| rr.get("nodes"))
                            .and_then(|n| n.as_array())
                            .is_some_and(|arr| !arr.is_empty());

                        let latest_reviews: Vec<GhReviewOutput> = pr_node
                            .get("latestReviews")
                            .and_then(|lr| lr.get("nodes"))
                            .and_then(|n| n.as_array())
                            .map(|arr| {
                                arr.iter()
                                    .filter_map(|r| {
                                        r.get("state")
                                            .and_then(|s| s.as_str())
                                            .map(|s| GhReviewOutput { state: s.to_string() })
                                    })
                                    .collect()
                            })
                            .unwrap_or_default();

                        let pr = GhPullRequestOutput {
                            number: num,
                            state: st.to_string(),
                            url: u.to_string(),
                            is_draft,
                            review_requests: if has_review_requests {
                                vec![GhReviewRequest { login: None, name: None }]
                            } else {
                                vec![]
                            },
                            latest_reviews,
                        };
                        pr_state = Some(resolve_pull_request_state(&pr));
                        pr_number = Some(pr.number);
                        pr_url = Some(pr.url);
                    }
                }
            }
        }

        labels_to_write.push((issue_id.clone(), labels_json));

        caches_to_write.push(GitHubStatusCache {
            issue_id: issue_id.clone(),
            branch_status: None,
            pr_state,
            pr_number,
            pr_url,
            github_issue_state,
            behind_base_count: None,
            merge_conflict: None,
            fetched_at: None,
        });
    }

    // Scoped write connection for batch write only
    let mut synced_count = 0;
    let mut errors = Vec::new();
    {
        let connection = state.write();
        for cache in &caches_to_write {
            match upsert_cache(&connection, cache) {
                Ok(()) => synced_count += 1,
                Err(error) => errors.push(format!("Failed to cache {}: {error}", cache.issue_id)),
            }
        }

        for (issue_id, labels_json) in &labels_to_write {
            if let Some(labels) = labels_json {
                if let Err(error) = connection.execute(
                    "UPDATE issues SET labels = ?1 WHERE id = ?2",
                    rusqlite::params![labels, issue_id],
                ) {
                    errors.push(format!("Failed to update labels for {issue_id}: {error}"));
                }
            }
        }
    }

    Ok(SyncAllResult {
        synced_count,
        errors,
    })
}

#[cfg(test)]
mod tests {
    use super::*;
    use rusqlite::Connection;

    use crate::database::test_helpers::setup_test_database;
    use crate::models::github::{GhReviewRequest, PullRequestState};

    fn insert_dashboard(connection: &Connection, id: &str) {
        connection
            .execute(
                "INSERT INTO dashboards (id, name, type, github_repo) VALUES (?1, 'Test', 'repo', 'owner/repo')",
                [id],
            )
            .unwrap();
    }

    fn insert_issue(
        connection: &Connection,
        id: &str,
        dashboard_id: &str,
        github_issue_number: Option<i64>,
        branch_name: Option<&str>,
    ) {
        connection
            .execute(
                "INSERT INTO issues (id, dashboard_id, name, github_issue_number, branch_name) \
                 VALUES (?1, ?2, 'Test Issue', ?3, ?4)",
                rusqlite::params![id, dashboard_id, github_issue_number, branch_name],
            )
            .unwrap();
    }

    // --- Cache CRUD tests ---

    #[test]
    fn upsert_cache_inserts_new_row() {
        let connection = setup_test_database();
        insert_dashboard(&connection, "d1");
        insert_issue(&connection, "i1", "d1", Some(42), None);

        let cache = GitHubStatusCache {
            issue_id: "i1".to_string(),
            branch_status: None,
            pr_state: Some(PullRequestState::Open),
            pr_number: Some(10),
            pr_url: Some("https://github.com/owner/repo/pull/10".to_string()),
            github_issue_state: Some("open".to_string()),
            behind_base_count: None,
            merge_conflict: None,
            fetched_at: None,
        };

        upsert_cache(&connection, &cache).unwrap();

        let result = read_cache(&connection, "i1").unwrap().unwrap();
        assert_eq!(result.pr_state, Some(PullRequestState::Open));
        assert_eq!(result.pr_number, Some(10));
        assert_eq!(result.github_issue_state.as_deref(), Some("open"));
        assert!(result.fetched_at.is_some(), "fetched_at should be set by DB");
    }

    #[test]
    fn upsert_cache_updates_existing_row() {
        let connection = setup_test_database();
        insert_dashboard(&connection, "d1");
        insert_issue(&connection, "i1", "d1", Some(42), None);

        let initial = GitHubStatusCache {
            issue_id: "i1".to_string(),
            branch_status: None,
            pr_state: Some(PullRequestState::Open),
            pr_number: Some(10),
            pr_url: Some("https://github.com/owner/repo/pull/10".to_string()),
            github_issue_state: Some("open".to_string()),
            behind_base_count: None,
            merge_conflict: None,
            fetched_at: None,
        };
        upsert_cache(&connection, &initial).unwrap();

        // Update only PR state (github_issue_state = None should preserve existing)
        let update = GitHubStatusCache {
            issue_id: "i1".to_string(),
            branch_status: None,
            pr_state: Some(PullRequestState::Merged),
            pr_number: Some(10),
            pr_url: Some("https://github.com/owner/repo/pull/10".to_string()),
            github_issue_state: None, // Should preserve "open" via COALESCE
            behind_base_count: None,
            merge_conflict: None,
            fetched_at: None,
        };
        upsert_cache(&connection, &update).unwrap();

        let result = read_cache(&connection, "i1").unwrap().unwrap();
        assert_eq!(result.pr_state, Some(PullRequestState::Merged));
        assert_eq!(
            result.github_issue_state.as_deref(),
            Some("open"),
            "COALESCE should preserve existing github_issue_state"
        );
    }

    #[test]
    fn read_cache_returns_none_for_missing_issue() {
        let connection = setup_test_database();
        let result = read_cache(&connection, "nonexistent").unwrap();
        assert!(result.is_none());
    }

    #[test]
    fn read_all_caches_returns_only_dashboard_issues() {
        let connection = setup_test_database();
        insert_dashboard(&connection, "d1");
        insert_dashboard(&connection, "d2");
        insert_issue(&connection, "i1", "d1", Some(1), None);
        insert_issue(&connection, "i2", "d1", Some(2), None);
        insert_issue(&connection, "i3", "d2", Some(3), None);

        for id in &["i1", "i2", "i3"] {
            let cache = GitHubStatusCache {
                issue_id: id.to_string(),
                branch_status: None,
                pr_state: Some(PullRequestState::Open),
                pr_number: None,
                pr_url: None,
                github_issue_state: Some("open".to_string()),
                behind_base_count: None,
                merge_conflict: None,
                fetched_at: None,
            };
            upsert_cache(&connection, &cache).unwrap();
        }

        let d1_caches = read_all_caches_for_dashboard(&connection, "d1").unwrap();
        assert_eq!(d1_caches.len(), 2);

        let d2_caches = read_all_caches_for_dashboard(&connection, "d2").unwrap();
        assert_eq!(d2_caches.len(), 1);
    }

    #[test]
    fn read_all_caches_returns_empty_for_dashboard_with_no_cache() {
        let connection = setup_test_database();
        insert_dashboard(&connection, "d1");
        insert_issue(&connection, "i1", "d1", Some(1), None);

        let caches = read_all_caches_for_dashboard(&connection, "d1").unwrap();
        assert!(caches.is_empty());
    }

    // --- PR state resolution tests ---

    #[test]
    fn resolve_pr_state_open() {
        let pr = GhPullRequestOutput {
            number: 1,
            state: "OPEN".to_string(),
            url: "https://github.com/o/r/pull/1".to_string(),
            is_draft: false,
            review_requests: vec![],
            latest_reviews: vec![],
        };
        assert_eq!(resolve_pull_request_state(&pr), PullRequestState::Open);
    }

    #[test]
    fn resolve_pr_state_draft() {
        let pr = GhPullRequestOutput {
            number: 1,
            state: "OPEN".to_string(),
            url: "https://github.com/o/r/pull/1".to_string(),
            is_draft: true,
            review_requests: vec![],
            latest_reviews: vec![],
        };
        assert_eq!(resolve_pull_request_state(&pr), PullRequestState::Draft);
    }

    #[test]
    fn resolve_pr_state_review_requested() {
        let pr = GhPullRequestOutput {
            number: 1,
            state: "OPEN".to_string(),
            url: "https://github.com/o/r/pull/1".to_string(),
            is_draft: false,
            review_requests: vec![GhReviewRequest {
                login: Some("reviewer".to_string()),
                name: None,
            }],
            latest_reviews: vec![],
        };
        assert_eq!(resolve_pull_request_state(&pr), PullRequestState::ReviewRequested);
    }

    #[test]
    fn resolve_pr_state_merged() {
        let pr = GhPullRequestOutput {
            number: 1,
            state: "MERGED".to_string(),
            url: "https://github.com/o/r/pull/1".to_string(),
            is_draft: false,
            review_requests: vec![],
            latest_reviews: vec![],
        };
        assert_eq!(resolve_pull_request_state(&pr), PullRequestState::Merged);
    }

    #[test]
    fn resolve_pr_state_closed() {
        let pr = GhPullRequestOutput {
            number: 1,
            state: "CLOSED".to_string(),
            url: "https://github.com/o/r/pull/1".to_string(),
            is_draft: false,
            review_requests: vec![],
            latest_reviews: vec![],
        };
        assert_eq!(resolve_pull_request_state(&pr), PullRequestState::Closed);
    }

    // --- Issue state resolution tests ---

    #[test]
    fn resolve_issue_state_open() {
        assert_eq!(resolve_github_issue_state("OPEN"), "open");
    }

    #[test]
    fn resolve_issue_state_closed() {
        assert_eq!(resolve_github_issue_state("CLOSED"), "closed");
    }

    // --- gh CLI JSON parsing tests ---

    #[test]
    fn parse_gh_issue_view_output() {
        let json = r#"{"state":"OPEN","url":"https://github.com/owner/repo/issues/42"}"#;
        let parsed: GhIssueViewOutput = serde_json::from_str(json).unwrap();
        assert_eq!(parsed.state, "OPEN");
        assert_eq!(parsed.url, "https://github.com/owner/repo/issues/42");
    }

    #[test]
    fn parse_gh_pr_list_output() {
        let json = r#"[{"number":10,"state":"OPEN","url":"https://github.com/o/r/pull/10","isDraft":false,"reviewRequests":[]}]"#;
        let parsed: Vec<GhPullRequestOutput> = serde_json::from_str(json).unwrap();
        assert_eq!(parsed.len(), 1);
        assert_eq!(parsed[0].number, 10);
        assert!(!parsed[0].is_draft);
    }

    #[test]
    fn parse_gh_pr_list_with_review_requests() {
        let json = r#"[{"number":10,"state":"OPEN","url":"https://github.com/o/r/pull/10","isDraft":false,"reviewRequests":[{"login":"alice","name":null}]}]"#;
        let parsed: Vec<GhPullRequestOutput> = serde_json::from_str(json).unwrap();
        assert_eq!(parsed[0].review_requests.len(), 1);
        assert_eq!(
            parsed[0].review_requests[0].login.as_deref(),
            Some("alice")
        );
    }

    #[test]
    fn parse_gh_assigned_issues_output() {
        let json = r#"[{"number":1,"title":"Bug fix","state":"OPEN","url":"https://github.com/o/r/issues/1"},{"number":2,"title":"Feature","state":"CLOSED","url":"https://github.com/o/r/issues/2"}]"#;
        let parsed: Vec<AssignedIssue> = serde_json::from_str(json).unwrap();
        assert_eq!(parsed.len(), 2);
        assert_eq!(parsed[0].number, 1);
        assert_eq!(parsed[1].state, "CLOSED");
    }

    // --- GraphQL query builder tests ---

    #[test]
    fn graphql_query_with_issues_only() {
        let query = build_bulk_sync_graphql_query("owner", "repo", &[1, 2], &[None, None]);
        assert!(query.contains("issue_0: issue(number: 1)"));
        assert!(query.contains("issue_1: issue(number: 2)"));
        assert!(query.contains("labels(first: 20)"));
        assert!(query.contains("nodes { name color }"));
        assert!(!query.contains("pr_"));
    }

    #[test]
    fn graphql_query_with_issues_and_branches() {
        let query = build_bulk_sync_graphql_query(
            "owner",
            "repo",
            &[1, 2],
            &[Some("feature-a"), Some("fix/bug")],
        );
        assert!(query.contains("issue_0: issue(number: 1)"));
        assert!(query.contains("pr_0: pullRequests(headRefName: \"feature-a\""));
        assert!(query.contains("pr_1: pullRequests(headRefName: \"fix/bug\""));
    }

    #[test]
    fn graphql_query_with_mixed_branches() {
        let query =
            build_bulk_sync_graphql_query("owner", "repo", &[1, 2], &[Some("main"), None]);
        assert!(query.contains("pr_0: pullRequests(headRefName: \"main\""));
        assert!(!query.contains("pr_1"));
    }

    // --- GraphQL response parsing tests ---

    #[test]
    fn parse_graphql_sync_response() {
        let response_json = r#"{
            "data": {
                "repository": {
                    "issue_0": {"state": "OPEN", "url": "https://github.com/o/r/issues/1"},
                    "issue_1": {"state": "CLOSED", "url": "https://github.com/o/r/issues/2"},
                    "pr_0": {"nodes": [{"number": 5, "state": "OPEN", "url": "https://github.com/o/r/pull/5", "isDraft": true, "reviewRequests": {"nodes": []}}]}
                }
            }
        }"#;

        let response: serde_json::Value = serde_json::from_str(response_json).unwrap();
        let repository = response
            .get("data")
            .unwrap()
            .get("repository")
            .unwrap();

        // Issue 0
        let issue_0 = repository.get("issue_0").unwrap();
        let state = issue_0.get("state").unwrap().as_str().unwrap();
        assert_eq!(resolve_github_issue_state(state), "open");

        // Issue 1
        let issue_1 = repository.get("issue_1").unwrap();
        let state = issue_1.get("state").unwrap().as_str().unwrap();
        assert_eq!(resolve_github_issue_state(state), "closed");

        // PR 0 (draft)
        let pr_0 = repository.get("pr_0").unwrap();
        let nodes = pr_0.get("nodes").unwrap().as_array().unwrap();
        assert_eq!(nodes.len(), 1);
    }

    #[test]
    fn graphql_pr_with_review_requests_resolves_correctly() {
        // GraphQL shape has nested reviewRequests.nodes[].requestedReviewer
        let pr_json = r#"{"number": 7, "state": "OPEN", "url": "https://github.com/o/r/pull/7", "isDraft": false, "reviewRequests": {"nodes": [{"requestedReviewer": {"login": "alice"}}]}}"#;
        let pr_node: serde_json::Value = serde_json::from_str(pr_json).unwrap();

        let is_draft = pr_node.get("isDraft").and_then(|d| d.as_bool()).unwrap_or(false);
        let has_review_requests = pr_node
            .get("reviewRequests")
            .and_then(|rr| rr.get("nodes"))
            .and_then(|n| n.as_array())
            .is_some_and(|arr| !arr.is_empty());

        assert!(!is_draft);
        assert!(has_review_requests, "Should detect review requests from GraphQL shape");

        let pr = GhPullRequestOutput {
            number: 7,
            state: "OPEN".to_string(),
            url: "https://github.com/o/r/pull/7".to_string(),
            is_draft,
            review_requests: if has_review_requests {
                vec![GhReviewRequest { login: None, name: None }]
            } else {
                vec![]
            },
            latest_reviews: vec![],
        };
        assert_eq!(resolve_pull_request_state(&pr), PullRequestState::ReviewRequested);
    }

    #[test]
    fn graphql_pr_without_review_requests_resolves_to_open() {
        let pr_json = r#"{"number": 8, "state": "OPEN", "url": "https://github.com/o/r/pull/8", "isDraft": false, "reviewRequests": {"nodes": []}}"#;
        let pr_node: serde_json::Value = serde_json::from_str(pr_json).unwrap();

        let has_review_requests = pr_node
            .get("reviewRequests")
            .and_then(|rr| rr.get("nodes"))
            .and_then(|n| n.as_array())
            .is_some_and(|arr| !arr.is_empty());

        assert!(!has_review_requests);

        let pr = GhPullRequestOutput {
            number: 8,
            state: "OPEN".to_string(),
            url: "https://github.com/o/r/pull/8".to_string(),
            is_draft: false,
            review_requests: vec![],
            latest_reviews: vec![],
        };
        assert_eq!(resolve_pull_request_state(&pr), PullRequestState::Open);
    }

    #[test]
    fn parse_graphql_labels_from_issue() {
        let response_json = r#"{
            "data": {
                "repository": {
                    "issue_0": {
                        "state": "OPEN",
                        "url": "https://github.com/o/r/issues/1",
                        "labels": {
                            "nodes": [
                                {"name": "bug", "color": "d73a4a"},
                                {"name": "task", "color": "0E8A16"}
                            ]
                        }
                    }
                }
            }
        }"#;

        let response: serde_json::Value = serde_json::from_str(response_json).unwrap();
        let repository = response
            .get("data")
            .unwrap()
            .get("repository")
            .unwrap();

        let issue_data = repository.get("issue_0").unwrap();
        let label_nodes = issue_data
            .get("labels")
            .unwrap()
            .get("nodes")
            .unwrap()
            .as_array()
            .unwrap();

        let json = parse_label_nodes_to_json(label_nodes);
        let parsed: Vec<serde_json::Value> = serde_json::from_str(&json).unwrap();
        assert_eq!(parsed.len(), 2);
        assert_eq!(parsed[0]["name"], "bug");
        assert_eq!(parsed[0]["color"], "#d73a4a");
        assert_eq!(parsed[1]["name"], "task");
        assert_eq!(parsed[1]["color"], "#0E8A16");
    }

    #[test]
    fn parse_graphql_issue_without_labels() {
        let label_nodes: Vec<serde_json::Value> = vec![];
        let json = parse_label_nodes_to_json(&label_nodes);
        assert_eq!(json, "[]");
    }
}
