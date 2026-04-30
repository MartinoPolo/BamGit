use rusqlite::Row;
use tauri::State;
use uuid::Uuid;

use crate::database::connection::DatabaseState;
use crate::models::issue::{CreateIssueRequest, Issue, UpdateIssueRequest};

use super::shared::resolve_nullable_field;

const ISSUE_SELECT_COLUMNS: &str =
    "id, dashboard_id, name, priority, color, status, github_issue_url, github_issue_number, \
     branch_name, base_branch, worktree_folder, worktree_state, parent_issue_id, editor_folder, \
     dev_server_command, dev_server_port, dev_server_pid, browser_url, labels, sort_order, created_at";

fn row_to_issue(row: &Row) -> Result<Issue, rusqlite::Error> {
    Ok(Issue {
        id: row.get(0)?,
        dashboard_id: row.get(1)?,
        name: row.get(2)?,
        priority: row.get(3)?,
        color: row.get(4)?,
        status: row.get(5)?,
        github_issue_url: row.get(6)?,
        github_issue_number: row.get(7)?,
        branch_name: row.get(8)?,
        base_branch: row.get(9)?,
        worktree_folder: row.get(10)?,
        worktree_state: row.get(11)?,
        parent_issue_id: row.get(12)?,
        editor_folder: row.get(13)?,
        dev_server_command: row.get(14)?,
        dev_server_port: row.get(15)?,
        dev_server_pid: row.get(16)?,
        browser_url: row.get(17)?,
        labels: row.get(18)?,
        sort_order: row.get(19)?,
        created_at: row.get(20)?,
    })
}

#[tauri::command]
pub fn create_issue(
    state: State<DatabaseState>,
    request: CreateIssueRequest,
) -> Result<Issue, String> {
    let connection = state.write()?;
    let id = Uuid::new_v4().to_string();

    connection
        .execute(
            "INSERT INTO issues (id, dashboard_id, name, priority, color, github_issue_url, github_issue_number, parent_issue_id, labels)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)",
            rusqlite::params![
                id,
                request.dashboard_id,
                request.name,
                request.priority,
                request.color,
                request.github_issue_url,
                request.github_issue_number,
                request.parent_issue_id,
                request.labels,
            ],
        )
        .map_err(|error| format!("Failed to create issue: {error}"))?;

    let query = format!("SELECT {ISSUE_SELECT_COLUMNS} FROM issues WHERE id = ?1");
    connection
        .query_row(&query, [&id], |row| row_to_issue(row))
        .map_err(|error| format!("Failed to read created issue: {error}"))
}

#[tauri::command]
pub fn get_issues_for_dashboard(
    state: State<DatabaseState>,
    dashboard_id: String,
    include_archived: bool,
) -> Result<Vec<Issue>, String> {
    let connection = state.read()?;

    let query = if include_archived {
        format!(
            "SELECT {ISSUE_SELECT_COLUMNS} FROM issues WHERE dashboard_id = ?1 ORDER BY sort_order, created_at"
        )
    } else {
        format!(
            "SELECT {ISSUE_SELECT_COLUMNS} FROM issues WHERE dashboard_id = ?1 AND status = 'active' ORDER BY sort_order, created_at"
        )
    };

    let mut statement = connection
        .prepare(&query)
        .map_err(|error| format!("Failed to prepare query: {error}"))?;

    let issues = statement
        .query_map([&dashboard_id], |row| row_to_issue(row))
        .map_err(|error| format!("Failed to query issues: {error}"))?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|error| format!("Failed to read issue row: {error}"))?;

    Ok(issues)
}

#[tauri::command]
pub fn get_issue(state: State<DatabaseState>, id: String) -> Result<Issue, String> {
    let connection = state.read()?;

    let query = format!("SELECT {ISSUE_SELECT_COLUMNS} FROM issues WHERE id = ?1");
    connection
        .query_row(&query, [&id], |row| row_to_issue(row))
        .map_err(|error| format!("Issue not found: {error}"))
}

#[tauri::command]
pub fn update_issue(
    state: State<DatabaseState>,
    request: UpdateIssueRequest,
) -> Result<Issue, String> {
    let connection = state.write()?;

    let select_query = format!("SELECT {ISSUE_SELECT_COLUMNS} FROM issues WHERE id = ?1");
    let existing = connection
        .query_row(&select_query, [&request.id], |row| row_to_issue(row))
        .map_err(|error| format!("Issue not found: {error}"))?;

    let name = request.name.unwrap_or(existing.name);
    let priority = resolve_nullable_field(request.priority, existing.priority);
    let color = resolve_nullable_field(request.color, existing.color);
    let github_issue_url = resolve_nullable_field(request.github_issue_url, existing.github_issue_url);
    let github_issue_number = resolve_nullable_field(request.github_issue_number, existing.github_issue_number);
    let branch_name = resolve_nullable_field(request.branch_name, existing.branch_name);
    let base_branch = resolve_nullable_field(request.base_branch, existing.base_branch);
    let worktree_folder = resolve_nullable_field(request.worktree_folder, existing.worktree_folder);
    let worktree_state = request.worktree_state.unwrap_or(existing.worktree_state);
    let parent_issue_id = resolve_nullable_field(request.parent_issue_id, existing.parent_issue_id);
    let labels = resolve_nullable_field(request.labels, existing.labels);
    let sort_order = request.sort_order.unwrap_or(existing.sort_order);

    connection
        .execute(
            "UPDATE issues SET name = ?1, priority = ?2, color = ?3, github_issue_url = ?4, \
             github_issue_number = ?5, branch_name = ?6, base_branch = ?7, \
             worktree_folder = ?8, worktree_state = ?9, parent_issue_id = ?10, \
             labels = ?11, sort_order = ?12 WHERE id = ?13",
            rusqlite::params![
                name,
                priority,
                color,
                github_issue_url,
                github_issue_number,
                branch_name,
                base_branch,
                worktree_folder,
                worktree_state,
                parent_issue_id,
                labels,
                sort_order,
                existing.id,
            ],
        )
        .map_err(|error| format!("Failed to update issue: {error}"))?;

    connection
        .query_row(&select_query, [&existing.id], |row| row_to_issue(row))
        .map_err(|error| format!("Failed to read updated issue: {error}"))
}

#[tauri::command]
pub fn delete_issue(state: State<DatabaseState>, id: String) -> Result<(), String> {
    let connection = state.write()?;

    let rows_affected = connection
        .execute("DELETE FROM issues WHERE id = ?1", [&id])
        .map_err(|error| format!("Failed to delete issue: {error}"))?;

    if rows_affected == 0 {
        return Err("ERR_ISSUE_NOT_FOUND".to_string());
    }

    Ok(())
}

#[tauri::command]
pub fn archive_issue(state: State<DatabaseState>, id: String) -> Result<Issue, String> {
    let connection = state.write()?;

    let rows_affected = connection
        .execute(
            "UPDATE issues SET status = 'archived' WHERE id = ?1",
            [&id],
        )
        .map_err(|error| format!("Failed to archive issue: {error}"))?;

    if rows_affected == 0 {
        return Err("ERR_ISSUE_NOT_FOUND".to_string());
    }

    let query = format!("SELECT {ISSUE_SELECT_COLUMNS} FROM issues WHERE id = ?1");
    connection
        .query_row(&query, [&id], |row| row_to_issue(row))
        .map_err(|error| format!("Failed to read archived issue: {error}"))
}

#[tauri::command]
pub fn unarchive_issue(state: State<DatabaseState>, id: String) -> Result<Issue, String> {
    let connection = state.write()?;

    let rows_affected = connection
        .execute(
            "UPDATE issues SET status = 'active' WHERE id = ?1",
            [&id],
        )
        .map_err(|error| format!("Failed to unarchive issue: {error}"))?;

    if rows_affected == 0 {
        return Err("ERR_ISSUE_NOT_FOUND".to_string());
    }

    let query = format!("SELECT {ISSUE_SELECT_COLUMNS} FROM issues WHERE id = ?1");
    connection
        .query_row(&query, [&id], |row| row_to_issue(row))
        .map_err(|error| format!("Failed to read unarchived issue: {error}"))
}
