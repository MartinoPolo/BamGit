use std::path::Path;

use tauri::State;

use crate::database::connection::DatabaseState;
use crate::git::branch_detection;
use crate::git::cli_operations;
use crate::git::fetch_coordinator::FetchCoordinator;
use crate::models::git_status::{
    row_to_git_status_cache, GitStatusCache, GIT_STATUS_CACHE_SELECT_COLUMNS,
};

const GIT_STATUS_SELECT_COLUMNS_ALIASED: &str =
    "g.issue_id, g.branch_status, g.pr_state, g.pr_number, g.pr_url, g.github_issue_state, \
     g.behind_base_count, g.merge_conflict, g.has_local_changes, g.ahead_remote_count, g.fetched_at";

#[tauri::command]
pub fn refresh_git_status(
    database_state: State<DatabaseState>,
    fetch_coordinator: State<FetchCoordinator>,
    issue_id: String,
) -> Result<GitStatusCache, String> {
    let connection = database_state.write()?;

    // Load issue + dashboard to get branch_name, base_branch, local_folder, worktree_folder
    let (branch_name, base_branch, local_folder, default_base_branch, worktree_folder): (
        Option<String>,
        Option<String>,
        Option<String>,
        Option<String>,
        Option<String>,
    ) = connection
        .query_row(
            "SELECT i.branch_name, i.base_branch, d.local_folder, d.default_base_branch, i.worktree_folder \
             FROM issues i \
             JOIN dashboards d ON i.dashboard_id = d.id \
             WHERE i.id = ?1",
            [&issue_id],
            |row| Ok((row.get(0)?, row.get(1)?, row.get(2)?, row.get(3)?, row.get(4)?)),
        )
        .map_err(|_| "ERR_ISSUE_NOT_FOUND".to_string())?;

    let branch_name =
        branch_name.ok_or_else(|| "Issue has no branch_name set".to_string())?;

    let local_folder =
        local_folder.ok_or_else(|| "Dashboard has no local_folder configured".to_string())?;

    let working_directory = Path::new(&local_folder);

    // Run fetch to get latest remote state (non-fatal if it fails)
    let _fetch_result = fetch_coordinator.fetch_once(working_directory);

    // Resolve branch status via git2
    let branch_status = branch_detection::resolve_branch_status(working_directory, &branch_name)
        .map(|status| status.as_str().to_string())
        .unwrap_or_else(|_| "unknown".to_string());

    // Get behind-base count and merge conflicts using explicit branch ref (not HEAD)
    let effective_base = base_branch.or(default_base_branch);

    let (behind_base_count, merge_conflict) = if let Some(ref base) = effective_base {
        let behind =
            cli_operations::get_behind_base_count(working_directory, &branch_name, base).ok();
        let conflict =
            cli_operations::detect_merge_conflicts(working_directory, &branch_name, base).ok();
        (behind, conflict)
    } else {
        (None, None)
    };

    let ahead_remote_count =
        cli_operations::get_ahead_remote_count(working_directory, &branch_name).ok();

    // Use worktree folder for local changes detection (dirty working tree check)
    let changes_directory = worktree_folder
        .as_deref()
        .map(Path::new)
        .unwrap_or(working_directory);
    let has_local_changes = cli_operations::has_local_changes(changes_directory).ok();

    // Upsert into git_status_cache
    connection
        .execute(
            "INSERT INTO git_status_cache (issue_id, branch_status, behind_base_count, merge_conflict, has_local_changes, ahead_remote_count, fetched_at)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, datetime('now'))
             ON CONFLICT(issue_id) DO UPDATE SET
                branch_status = excluded.branch_status,
                behind_base_count = excluded.behind_base_count,
                merge_conflict = excluded.merge_conflict,
                has_local_changes = excluded.has_local_changes,
                ahead_remote_count = excluded.ahead_remote_count,
                fetched_at = excluded.fetched_at",
            rusqlite::params![issue_id, branch_status, behind_base_count, merge_conflict, has_local_changes, ahead_remote_count],
        )
        .map_err(|error| format!("Failed to upsert git status cache: {error}"))?;

    // Read back the full row
    let query = format!(
        "SELECT {GIT_STATUS_CACHE_SELECT_COLUMNS} FROM git_status_cache WHERE issue_id = ?1"
    );
    connection
        .query_row(&query, [&issue_id], |row| row_to_git_status_cache(row))
        .map_err(|error| format!("Failed to read git status cache: {error}"))
}

#[tauri::command]
pub fn get_cached_git_status(
    database_state: State<DatabaseState>,
    issue_id: String,
) -> Result<Option<GitStatusCache>, String> {
    let connection = database_state.read()?;

    let query = format!(
        "SELECT {GIT_STATUS_CACHE_SELECT_COLUMNS} FROM git_status_cache WHERE issue_id = ?1"
    );

    match connection.query_row(&query, [&issue_id], |row| row_to_git_status_cache(row)) {
        Ok(cache) => Ok(Some(cache)),
        Err(rusqlite::Error::QueryReturnedNoRows) => Ok(None),
        Err(error) => Err(format!("Failed to read git status cache: {error}")),
    }
}

#[tauri::command]
pub fn get_all_git_statuses_for_dashboard(
    database_state: State<DatabaseState>,
    dashboard_id: String,
) -> Result<Vec<GitStatusCache>, String> {
    let connection = database_state.read()?;

    let query = format!(
        "SELECT {GIT_STATUS_SELECT_COLUMNS_ALIASED} FROM git_status_cache g \
         JOIN issues i ON g.issue_id = i.id \
         WHERE i.dashboard_id = ?1 AND i.branch_name IS NOT NULL"
    );

    let mut statement = connection
        .prepare(&query)
        .map_err(|error| format!("Failed to prepare query: {error}"))?;

    let statuses = statement
        .query_map([&dashboard_id], |row| row_to_git_status_cache(row))
        .map_err(|error| format!("Failed to query git statuses: {error}"))?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|error| format!("Failed to read git status row: {error}"))?;

    Ok(statuses)
}
