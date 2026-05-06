use rusqlite::Connection;
use tauri::State;

use crate::database::connection::DatabaseState;
use crate::models::git_status::{
    row_to_git_status_cache, GitStatusCache, GIT_STATUS_CACHE_SELECT_COLUMNS,
};
use crate::models::github::{
    resolve_github_issue_state, resolve_pull_request_state, AssignedIssue, AssignedIssuesResult,
    GhCliAvailability, GhIssueViewOutput, GhPullRequestOutput, GhReviewOutput, GhReviewRequest,
    SearchedGithubIssue, SyncAllResult,
};

use super::dependency_commands;

fn upsert_cache(connection: &Connection, cache: &GitStatusCache) -> Result<(), String> {
    connection
        .execute(
            "INSERT INTO git_status_cache (issue_id, branch_status, pr_state, pr_number, pr_url, \
             github_issue_state, behind_base_count, merge_conflict, has_local_changes, ahead_remote_count, fetched_at) \
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, datetime('now')) \
             ON CONFLICT(issue_id) DO UPDATE SET \
             branch_status = COALESCE(excluded.branch_status, branch_status), \
             pr_state = COALESCE(excluded.pr_state, pr_state), \
             pr_number = COALESCE(excluded.pr_number, pr_number), \
             pr_url = COALESCE(excluded.pr_url, pr_url), \
             github_issue_state = COALESCE(excluded.github_issue_state, github_issue_state), \
             behind_base_count = COALESCE(excluded.behind_base_count, behind_base_count), \
             merge_conflict = COALESCE(excluded.merge_conflict, merge_conflict), \
             has_local_changes = COALESCE(excluded.has_local_changes, has_local_changes), \
             ahead_remote_count = COALESCE(excluded.ahead_remote_count, ahead_remote_count), \
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
                cache.has_local_changes,
                cache.ahead_remote_count,
            ],
        )
        .map_err(|error| format!("Failed to upsert GitHub status cache: {error}"))?;
    Ok(())
}

fn read_cache(
    connection: &Connection,
    issue_id: &str,
) -> Result<Option<GitStatusCache>, String> {
    let query = format!("SELECT {GIT_STATUS_CACHE_SELECT_COLUMNS} FROM git_status_cache WHERE issue_id = ?1");
    match connection.query_row(&query, [issue_id], |row| row_to_git_status_cache(row)) {
        Ok(cache) => Ok(Some(cache)),
        Err(rusqlite::Error::QueryReturnedNoRows) => Ok(None),
        Err(error) => Err(format!("Failed to read GitHub status cache: {error}")),
    }
}

fn read_all_caches_for_dashboard(
    connection: &Connection,
    dashboard_id: &str,
) -> Result<Vec<GitStatusCache>, String> {
    let query = format!(
        "SELECT {GIT_STATUS_CACHE_SELECT_COLUMNS} FROM git_status_cache \
         WHERE issue_id IN (SELECT id FROM issues WHERE dashboard_id = ?1)"
    );
    let mut statement = connection
        .prepare(&query)
        .map_err(|error| format!("Failed to prepare query: {error}"))?;
    let caches = statement
        .query_map([dashboard_id], |row| row_to_git_status_cache(row))
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
            "issue_{index}: issue(number: {number}) {{ state url body labels(first: 20) {{ nodes {{ name color }} }} }}"
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

/// Parse blocking relationship patterns from a GitHub issue body.
/// Returns GitHub issue numbers that this issue is blocked by.
/// Recognized patterns: "Blocked by #N", "Depends on #N", "- Blocked by #N (...)"
fn parse_blocked_by_numbers(body: &str) -> Vec<i64> {
    let mut results = Vec::new();
    for line in body.lines() {
        let trimmed = line.trim().trim_start_matches("- ");
        let lower = trimmed.to_lowercase();
        for prefix in &["blocked by #", "depends on #"] {
            if let Some(rest) = lower.strip_prefix(prefix) {
                if let Some(number_str) = rest.split(|c: char| !c.is_ascii_digit()).next() {
                    if let Ok(number) = number_str.parse::<i64>() {
                        results.push(number);
                    }
                }
            }
        }
    }
    results
}

// --- Tauri commands ---

#[tauri::command]
pub fn get_github_status_cache(
    state: State<DatabaseState>,
    issue_id: String,
) -> Result<Option<GitStatusCache>, String> {
    let connection = state.read()?;
    read_cache(&connection, &issue_id)
}

#[tauri::command]
pub fn get_all_github_status_caches(
    state: State<DatabaseState>,
    dashboard_id: String,
) -> Result<Vec<GitStatusCache>, String> {
    let connection = state.read()?;
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
) -> Result<GitStatusCache, String> {
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

    let cache = GitStatusCache {
        issue_id: issue_id.clone(),
        branch_status: None,
        pr_state: None,
        pr_number: None,
        pr_url: None,
        github_issue_state: Some(resolved_state.to_string()),
        behind_base_count: None,
        merge_conflict: None,
        has_local_changes: None,
        ahead_remote_count: None,
        fetched_at: None,
    };

    // Acquire write lock only for DB write (not held across .await)
    {
        let connection = state.write()?;
        upsert_cache(&connection, &cache)?;
    }

    // Re-read to get fetched_at from DB
    let connection = state.read()?;
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
) -> Result<GitStatusCache, String> {
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

    let cache = GitStatusCache {
        issue_id: issue_id.clone(),
        branch_status: None,
        pr_state,
        pr_number,
        pr_url,
        github_issue_state: None,
        behind_base_count: None,
        merge_conflict: None,
        has_local_changes: None,
        ahead_remote_count: None,
        fetched_at: None,
    };

    {
        let connection = state.write()?;
        upsert_cache(&connection, &cache)?;
    }

    let connection = state.read()?;
    read_cache(&connection, &issue_id)?
        .ok_or_else(|| "Cache entry not found after upsert".to_string())
}

#[tauri::command]
pub async fn fetch_assigned_issues(
    owner: String,
    repo: String,
    limit: Option<i64>,
) -> Result<AssignedIssuesResult, String> {
    let effective_limit = limit.unwrap_or(10);
    let fetch_limit = (effective_limit + 1).to_string();

    let stdout = run_gh_command(&[
        "issue",
        "list",
        "--assignee",
        "@me",
        "--repo",
        &format!("{owner}/{repo}"),
        "--json",
        "number,title,state,url,labels",
        "--limit",
        &fetch_limit,
    ])
    .await?;

    let mut issues: Vec<AssignedIssue> =
        serde_json::from_str(&stdout).map_err(|error| format!("Failed to parse gh output: {error}"))?;

    let has_more = issues.len() as i64 > effective_limit;
    if has_more {
        issues.truncate(effective_limit as usize);
    }

    Ok(AssignedIssuesResult { issues, has_more })
}

#[tauri::command]
pub fn record_deleted_assigned_issue(
    state: State<DatabaseState>,
    dashboard_id: String,
    github_issue_number: i64,
) -> Result<(), String> {
    let connection = state.write()?;
    let id = uuid::Uuid::new_v4().to_string();
    connection
        .execute(
            "INSERT OR IGNORE INTO deleted_assigned_issues (id, dashboard_id, github_issue_number) \
             VALUES (?1, ?2, ?3)",
            rusqlite::params![id, dashboard_id, github_issue_number],
        )
        .map_err(|error| format!("Failed to record deleted assigned issue: {error}"))?;
    Ok(())
}

#[tauri::command]
pub fn get_deleted_assigned_issue_numbers(
    state: State<DatabaseState>,
    dashboard_id: String,
) -> Result<Vec<i64>, String> {
    let connection = state.read()?;
    let mut statement = connection
        .prepare(
            "SELECT github_issue_number FROM deleted_assigned_issues WHERE dashboard_id = ?1",
        )
        .map_err(|error| format!("Failed to prepare query: {error}"))?;
    let numbers = statement
        .query_map([&dashboard_id], |row| row.get(0))
        .map_err(|error| format!("Failed to query deleted issues: {error}"))?
        .collect::<Result<Vec<i64>, _>>()
        .map_err(|error| format!("Failed to read row: {error}"))?;
    Ok(numbers)
}

#[tauri::command]
pub async fn search_github_issues(
    owner: String,
    repo: String,
    query: String,
) -> Result<Vec<SearchedGithubIssue>, String> {
    let trimmed = query.trim();
    if trimmed.is_empty() {
        return Ok(vec![]);
    }

    let repo_arg = format!("{owner}/{repo}");

    // If query looks like a number (with or without #), try exact lookup first
    let number_query = trimmed.trim_start_matches('#');
    if number_query.chars().all(|c| c.is_ascii_digit()) && !number_query.is_empty() {
        match run_gh_command(&[
            "issue", "view", number_query,
            "--repo", &repo_arg,
            "--json", "number,title,state,url",
        ]).await {
            Ok(stdout) => {
                if let Ok(issue) = serde_json::from_str::<SearchedGithubIssue>(&stdout) {
                    return Ok(vec![issue]);
                }
            }
            Err(_) => {} // Fall through to search
        }
    }

    let stdout = run_gh_command(&[
        "issue", "list",
        "--search", trimmed,
        "--repo", &repo_arg,
        "--json", "number,title,state,url",
        "--limit", "20",
    ]).await?;

    let issues: Vec<SearchedGithubIssue> = serde_json::from_str(&stdout)
        .map_err(|error| format!("Failed to parse gh search output: {error}"))?;

    Ok(issues)
}

#[derive(serde::Serialize)]
pub struct UserRepo {
    pub name: String,
    pub owner: String,
    pub description: Option<String>,
    pub is_private: bool,
}

#[tauri::command]
pub async fn list_user_repos() -> Result<Vec<UserRepo>, String> {
    let stdout = run_gh_command(&[
        "repo",
        "list",
        "--json",
        "name,owner,description,isPrivate",
        "--limit",
        "100",
        "--sort",
        "pushed",
    ])
    .await?;

    let raw: Vec<serde_json::Value> =
        serde_json::from_str(&stdout).map_err(|error| format!("Failed to parse gh output: {error}"))?;

    let repos = raw
        .into_iter()
        .filter_map(|value| {
            let name = value.get("name")?.as_str()?.to_string();
            let owner = value.get("owner")?.get("login")?.as_str()?.to_string();
            let description = value.get("description").and_then(|d| d.as_str()).map(String::from);
            let is_private = value.get("isPrivate").and_then(|v| v.as_bool()).unwrap_or(false);
            Some(UserRepo { name, owner, description, is_private })
        })
        .collect();

    Ok(repos)
}

#[tauri::command]
pub async fn search_github_repos(query: String) -> Result<Vec<UserRepo>, String> {
    let trimmed = query.trim();
    if trimmed.is_empty() {
        return Ok(vec![]);
    }

    let stdout = run_gh_command(&[
        "api",
        &format!("/search/repositories?q={}&per_page=20", urlencoded(trimmed)),
    ])
    .await?;

    let parsed: serde_json::Value =
        serde_json::from_str(&stdout).map_err(|error| format!("Failed to parse search output: {error}"))?;

    let items = parsed
        .get("items")
        .and_then(|v| v.as_array())
        .cloned()
        .unwrap_or_default();

    let repos = items
        .into_iter()
        .filter_map(|value| {
            let name = value.get("name")?.as_str()?.to_string();
            let owner = value.get("owner")?.get("login")?.as_str()?.to_string();
            let description = value.get("description").and_then(|d| d.as_str()).map(String::from);
            let is_private = value.get("private").and_then(|v| v.as_bool()).unwrap_or(false);
            Some(UserRepo { name, owner, description, is_private })
        })
        .collect();

    Ok(repos)
}

fn urlencoded(input: &str) -> String {
    let mut encoded = String::with_capacity(input.len() * 3);
    for byte in input.bytes() {
        match byte {
            b'A'..=b'Z' | b'a'..=b'z' | b'0'..=b'9' | b'-' | b'_' | b'.' | b'~' => {
                encoded.push(byte as char);
            }
            _ => {
                encoded.push_str(&format!("%{byte:02X}"));
            }
        }
    }
    encoded
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
        let connection = state.read()?;
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

    // Build github_number → issue_id lookup for dependency resolution
    let number_to_issue_id: std::collections::HashMap<i64, String> = issues_data
        .iter()
        .filter_map(|(id, number, _)| number.map(|n| (n, id.clone())))
        .collect();

    // Parse all results first (no DB lock needed)
    let mut caches_to_write = Vec::with_capacity(syncable.len());
    let mut labels_to_write: Vec<(String, Option<String>)> = Vec::with_capacity(syncable.len());
    let mut dependency_edges: Vec<(String, String)> = Vec::new();

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

            if let Some(body) = issue_data.get("body").and_then(|b| b.as_str()) {
                let blocked_by_numbers = parse_blocked_by_numbers(body);
                let blocked_issue_id = issue_id;
                for blocker_number in blocked_by_numbers {
                    if let Some(blocker_id) = number_to_issue_id.get(&blocker_number) {
                        dependency_edges.push((blocker_id.clone(), blocked_issue_id.clone()));
                    }
                }
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

        caches_to_write.push(GitStatusCache {
            issue_id: issue_id.clone(),
            branch_status: None,
            pr_state,
            pr_number,
            pr_url,
            github_issue_state,
            behind_base_count: None,
            merge_conflict: None,
            has_local_changes: None,
            ahead_remote_count: None,
            fetched_at: None,
        });
    }

    // Scoped write connection for batch write only
    let mut synced_count = 0;
    let mut errors = Vec::new();
    {
        let connection = state.write()?;
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

        if let Err(error) =
            dependency_commands::replace_dependencies_for_dashboard(&connection, &dashboard_id, &dependency_edges)
        {
            errors.push(format!("Failed to sync dependencies: {error}"));
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

        let cache = GitStatusCache {
            issue_id: "i1".to_string(),
            branch_status: None,
            pr_state: Some(PullRequestState::Open),
            pr_number: Some(10),
            pr_url: Some("https://github.com/owner/repo/pull/10".to_string()),
            github_issue_state: Some("open".to_string()),
            behind_base_count: None,
            merge_conflict: None,
            has_local_changes: None,
            ahead_remote_count: None,
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

        let initial = GitStatusCache {
            issue_id: "i1".to_string(),
            branch_status: None,
            pr_state: Some(PullRequestState::Open),
            pr_number: Some(10),
            pr_url: Some("https://github.com/owner/repo/pull/10".to_string()),
            github_issue_state: Some("open".to_string()),
            behind_base_count: None,
            merge_conflict: None,
            has_local_changes: None,
            ahead_remote_count: None,
            fetched_at: None,
        };
        upsert_cache(&connection, &initial).unwrap();

        // Update only PR state (github_issue_state = None should preserve existing)
        let update = GitStatusCache {
            issue_id: "i1".to_string(),
            branch_status: None,
            pr_state: Some(PullRequestState::Merged),
            pr_number: Some(10),
            pr_url: Some("https://github.com/owner/repo/pull/10".to_string()),
            github_issue_state: None, // Should preserve "open" via COALESCE
            behind_base_count: None,
            merge_conflict: None,
            has_local_changes: None,
            ahead_remote_count: None,
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
            let cache = GitStatusCache {
                issue_id: id.to_string(),
                branch_status: None,
                pr_state: Some(PullRequestState::Open),
                pr_number: None,
                pr_url: None,
                github_issue_state: Some("open".to_string()),
                behind_base_count: None,
                merge_conflict: None,
                has_local_changes: None,
                ahead_remote_count: None,
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
        let json = r#"[{"number":1,"title":"Bug fix","state":"OPEN","url":"https://github.com/o/r/issues/1","labels":[{"name":"bug","color":"d73a4a"}]},{"number":2,"title":"Feature","state":"CLOSED","url":"https://github.com/o/r/issues/2","labels":[]}]"#;
        let parsed: Vec<AssignedIssue> = serde_json::from_str(json).unwrap();
        assert_eq!(parsed.len(), 2);
        assert_eq!(parsed[0].number, 1);
        assert_eq!(parsed[0].labels.len(), 1);
        assert_eq!(parsed[0].labels[0].name, "bug");
        assert_eq!(parsed[0].labels[0].color, "d73a4a");
        assert_eq!(parsed[1].state, "CLOSED");
        assert!(parsed[1].labels.is_empty());
    }

    #[test]
    fn parse_assigned_issues_without_labels_field() {
        let json = r#"[{"number":1,"title":"Bug fix","state":"OPEN","url":"https://github.com/o/r/issues/1"}]"#;
        let parsed: Vec<AssignedIssue> = serde_json::from_str(json).unwrap();
        assert_eq!(parsed.len(), 1);
        assert!(parsed[0].labels.is_empty(), "labels should default to empty vec");
    }

    #[test]
    fn record_and_get_deleted_assigned_issue_numbers() {
        let connection = setup_test_database();
        insert_dashboard(&connection, "d1");
        insert_dashboard(&connection, "d2");

        let id1 = uuid::Uuid::new_v4().to_string();
        connection
            .execute(
                "INSERT OR IGNORE INTO deleted_assigned_issues (id, dashboard_id, github_issue_number) VALUES (?1, ?2, ?3)",
                rusqlite::params![id1, "d1", 42],
            )
            .unwrap();

        let id2 = uuid::Uuid::new_v4().to_string();
        connection
            .execute(
                "INSERT OR IGNORE INTO deleted_assigned_issues (id, dashboard_id, github_issue_number) VALUES (?1, ?2, ?3)",
                rusqlite::params![id2, "d1", 99],
            )
            .unwrap();

        let id3 = uuid::Uuid::new_v4().to_string();
        connection
            .execute(
                "INSERT OR IGNORE INTO deleted_assigned_issues (id, dashboard_id, github_issue_number) VALUES (?1, ?2, ?3)",
                rusqlite::params![id3, "d2", 50],
            )
            .unwrap();

        // Query d1
        let mut stmt = connection
            .prepare("SELECT github_issue_number FROM deleted_assigned_issues WHERE dashboard_id = ?1")
            .unwrap();
        let d1_numbers: Vec<i64> = stmt.query_map(["d1"], |row| row.get(0)).unwrap().collect::<Result<Vec<_>, _>>().unwrap();
        assert_eq!(d1_numbers.len(), 2);
        assert!(d1_numbers.contains(&42));
        assert!(d1_numbers.contains(&99));

        // Query d2
        let d2_numbers: Vec<i64> = stmt.query_map(["d2"], |row| row.get(0)).unwrap().collect::<Result<Vec<_>, _>>().unwrap();
        assert_eq!(d2_numbers.len(), 1);
        assert!(d2_numbers.contains(&50));
    }

    #[test]
    fn deleted_assigned_issue_duplicate_is_ignored() {
        let connection = setup_test_database();
        insert_dashboard(&connection, "d1");

        let id1 = uuid::Uuid::new_v4().to_string();
        connection
            .execute(
                "INSERT OR IGNORE INTO deleted_assigned_issues (id, dashboard_id, github_issue_number) VALUES (?1, ?2, ?3)",
                rusqlite::params![id1, "d1", 42],
            )
            .unwrap();

        let id2 = uuid::Uuid::new_v4().to_string();
        connection
            .execute(
                "INSERT OR IGNORE INTO deleted_assigned_issues (id, dashboard_id, github_issue_number) VALUES (?1, ?2, ?3)",
                rusqlite::params![id2, "d1", 42],
            )
            .unwrap();

        let count: i64 = connection
            .query_row(
                "SELECT COUNT(*) FROM deleted_assigned_issues WHERE dashboard_id = 'd1'",
                [],
                |row| row.get(0),
            )
            .unwrap();
        assert_eq!(count, 1, "duplicate insert should be ignored");
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

    // --- Blocking relationship parser tests ---

    #[test]
    fn parse_blocked_by_single() {
        let body = "## Blocking Relationships\n- Blocked by #122 (panel shell)";
        let numbers = parse_blocked_by_numbers(body);
        assert_eq!(numbers, vec![122]);
    }

    #[test]
    fn parse_blocked_by_multiple() {
        let body = "- Blocked by #122 (panel shell)\n- Blocked by #89 (issue data)";
        let numbers = parse_blocked_by_numbers(body);
        assert_eq!(numbers, vec![122, 89]);
    }

    #[test]
    fn parse_depends_on() {
        let body = "Depends on #42";
        let numbers = parse_blocked_by_numbers(body);
        assert_eq!(numbers, vec![42]);
    }

    #[test]
    fn parse_blocked_by_case_insensitive() {
        let body = "blocked by #10\nBLOCKED BY #20";
        let numbers = parse_blocked_by_numbers(body);
        assert_eq!(numbers, vec![10, 20]);
    }

    #[test]
    fn parse_blocked_by_ignores_unrelated_lines() {
        let body = "## Description\nThis implements #123\n\n## Blocking Relationships\n- Blocked by #89";
        let numbers = parse_blocked_by_numbers(body);
        assert_eq!(numbers, vec![89]);
    }

    #[test]
    fn parse_blocked_by_empty_body() {
        let numbers = parse_blocked_by_numbers("");
        assert!(numbers.is_empty());
    }

    #[test]
    fn parse_blocked_by_no_matches() {
        let body = "This issue has no blocking relationships.";
        let numbers = parse_blocked_by_numbers(body);
        assert!(numbers.is_empty());
    }

    #[test]
    fn graphql_query_includes_body_field() {
        let query = build_bulk_sync_graphql_query("owner", "repo", &[1], &[None]);
        assert!(query.contains("body"), "GraphQL query should fetch issue body for dependency parsing");
    }
}
