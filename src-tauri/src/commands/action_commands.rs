use std::collections::HashMap;
use std::path::PathBuf;

use rusqlite::{Connection, Row};
use tauri::{AppHandle, Manager, State};
use uuid::Uuid;

use crate::database::connection::DatabaseState;
use crate::models::action::{Action, CreateActionRequest, UpdateActionRequest};
use crate::session::manager::SessionManager;
use crate::session::provider::SpawnConfig;

use super::shared::resolve_nullable_field;

const ACTION_SELECT_COLUMNS: &str =
    "id, dashboard_id, name, icon, command_template, sort_order, visible";

fn row_to_action(row: &Row) -> Result<Action, rusqlite::Error> {
    Ok(Action {
        id: row.get(0)?,
        dashboard_id: row.get(1)?,
        name: row.get(2)?,
        icon: row.get(3)?,
        command_template: row.get(4)?,
        sort_order: row.get(5)?,
        visible: row.get(6)?,
    })
}

/// Replace `{{variable}}` placeholders in a command template with actual values.
/// Unknown variables are left as-is (graceful degradation).
pub fn resolve_command_template(template: &str, variables: &HashMap<&str, String>) -> String {
    let mut result = template.to_string();
    for (key, value) in variables {
        let placeholder = format!("{{{{{key}}}}}");
        result = result.replace(&placeholder, value);
    }
    result
}

fn seed_default_actions(connection: &Connection, dashboard_id: &str) -> Result<(), String> {
    let defaults = [
        ("Execute", "play", "claude \"/mp-execute #{{issue_number}}\""),
        ("Review", "eye", "claude \"/mp-review #{{issue_number}}\""),
        (
            "Check & Fix",
            "wrench",
            "claude \"/mp-check-fix #{{issue_number}}\"",
        ),
    ];

    for (sort_order, (name, icon, command_template)) in defaults.iter().enumerate() {
        let id = Uuid::new_v4().to_string();
        connection
            .execute(
                "INSERT INTO actions (id, dashboard_id, name, icon, command_template, sort_order, visible) \
                 VALUES (?1, ?2, ?3, ?4, ?5, ?6, 1)",
                rusqlite::params![id, dashboard_id, name, icon, command_template, sort_order as i64],
            )
            .map_err(|error| format!("Failed to seed default action: {error}"))?;
    }

    Ok(())
}

#[tauri::command]
pub fn create_action(
    state: State<DatabaseState>,
    request: CreateActionRequest,
) -> Result<Action, String> {
    let connection = state.write()?;
    let id = Uuid::new_v4().to_string();

    connection
        .execute(
            "INSERT INTO actions (id, dashboard_id, name, icon, command_template, sort_order, visible) \
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
            rusqlite::params![
                id,
                request.dashboard_id,
                request.name,
                request.icon,
                request.command_template,
                request.sort_order.unwrap_or(0),
                request.visible.unwrap_or(true),
            ],
        )
        .map_err(|error| format!("Failed to create action: {error}"))?;

    let query = format!("SELECT {ACTION_SELECT_COLUMNS} FROM actions WHERE id = ?1");
    connection
        .query_row(&query, [&id], |row| row_to_action(row))
        .map_err(|error| format!("Failed to read created action: {error}"))
}

#[tauri::command]
pub fn get_actions_for_dashboard(
    state: State<DatabaseState>,
    dashboard_id: String,
) -> Result<Vec<Action>, String> {
    // Uses write because it may seed default actions on first access
    let connection = state.write()?;

    // Seed defaults if no actions exist for this dashboard (including global ones)
    let count: i64 = connection
        .query_row(
            "SELECT COUNT(*) FROM actions WHERE dashboard_id = ?1 OR dashboard_id IS NULL",
            [&dashboard_id],
            |row| row.get(0),
        )
        .map_err(|error| format!("Failed to count actions: {error}"))?;

    if count == 0 {
        seed_default_actions(&connection, &dashboard_id)?;
    }

    // Return global (null dashboard_id) + dashboard-specific, ordered by sort_order
    let query = format!(
        "SELECT {ACTION_SELECT_COLUMNS} FROM actions \
         WHERE dashboard_id IS NULL OR dashboard_id = ?1 \
         ORDER BY sort_order"
    );

    let mut statement = connection
        .prepare(&query)
        .map_err(|error| format!("Failed to prepare query: {error}"))?;

    let actions = statement
        .query_map([&dashboard_id], |row| row_to_action(row))
        .map_err(|error| format!("Failed to query actions: {error}"))?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|error| format!("Failed to read action row: {error}"))?;

    Ok(actions)
}

#[tauri::command]
pub fn get_action(state: State<DatabaseState>, id: String) -> Result<Action, String> {
    let connection = state.read()?;

    let query = format!("SELECT {ACTION_SELECT_COLUMNS} FROM actions WHERE id = ?1");
    connection
        .query_row(&query, [&id], |row| row_to_action(row))
        .map_err(|_| "ERR_ACTION_NOT_FOUND".to_string())
}

#[tauri::command]
pub fn update_action(
    state: State<DatabaseState>,
    request: UpdateActionRequest,
) -> Result<Action, String> {
    let connection = state.write()?;

    let select_query = format!("SELECT {ACTION_SELECT_COLUMNS} FROM actions WHERE id = ?1");
    let existing = connection
        .query_row(&select_query, [&request.id], |row| row_to_action(row))
        .map_err(|_| "ERR_ACTION_NOT_FOUND".to_string())?;

    let name = request.name.unwrap_or(existing.name);
    let icon = resolve_nullable_field(request.icon, existing.icon);
    let command_template = request.command_template.unwrap_or(existing.command_template);
    let sort_order = request.sort_order.unwrap_or(existing.sort_order);
    let visible = request.visible.unwrap_or(existing.visible);

    connection
        .execute(
            "UPDATE actions SET name = ?1, icon = ?2, command_template = ?3, sort_order = ?4, visible = ?5 \
             WHERE id = ?6",
            rusqlite::params![name, icon, command_template, sort_order, visible, existing.id],
        )
        .map_err(|error| format!("Failed to update action: {error}"))?;

    connection
        .query_row(&select_query, [&existing.id], |row| row_to_action(row))
        .map_err(|error| format!("Failed to read updated action: {error}"))
}

#[tauri::command]
pub fn delete_action(state: State<DatabaseState>, id: String) -> Result<(), String> {
    let connection = state.write()?;

    let rows_affected = connection
        .execute("DELETE FROM actions WHERE id = ?1", [&id])
        .map_err(|error| format!("Failed to delete action: {error}"))?;

    if rows_affected == 0 {
        return Err("ERR_ACTION_NOT_FOUND".to_string());
    }

    Ok(())
}

#[tauri::command]
pub fn reorder_actions(
    state: State<DatabaseState>,
    action_ids: Vec<String>,
) -> Result<(), String> {
    let mut connection = state.write()?;

    let transaction = connection
        .transaction()
        .map_err(|error| format!("Failed to begin transaction: {error}"))?;

    for (index, action_id) in action_ids.iter().enumerate() {
        transaction
            .execute(
                "UPDATE actions SET sort_order = ?1 WHERE id = ?2",
                rusqlite::params![index as i64, action_id],
            )
            .map_err(|error| format!("Failed to reorder action: {error}"))?;
    }

    transaction
        .commit()
        .map_err(|error| format!("Failed to commit reorder: {error}"))
}

struct IssueContext {
    issue_id: String,
    issue_name: String,
    github_issue_number: Option<i64>,
    branch_name: Option<String>,
    base_branch: Option<String>,
    worktree_folder: Option<String>,
    dashboard_github_repo: Option<String>,
    dashboard_default_base_branch: Option<String>,
    dashboard_local_folder: Option<String>,
}

#[tauri::command]
pub async fn execute_action(
    state: State<'_, DatabaseState>,
    manager: State<'_, SessionManager>,
    app_handle: AppHandle,
    action_id: String,
    issue_id: String,
) -> Result<String, String> {
    let (resolved_command, working_directory) = {
        let connection = state.read()?;

        // Load action
        let action_query = format!("SELECT {ACTION_SELECT_COLUMNS} FROM actions WHERE id = ?1");
        let action = connection
            .query_row(&action_query, [&action_id], |row| row_to_action(row))
            .map_err(|_| "ERR_ACTION_NOT_FOUND".to_string())?;

        // Load issue + dashboard fields for variable substitution
        let context: IssueContext = connection
            .query_row(
                "SELECT i.id, i.name, i.github_issue_number, i.branch_name, \
                 i.base_branch, i.worktree_folder, d.github_repo, d.default_base_branch, d.local_folder \
                 FROM issues i JOIN dashboards d ON i.dashboard_id = d.id \
                 WHERE i.id = ?1",
                [&issue_id],
                |row| {
                    Ok(IssueContext {
                        issue_id: row.get(0)?,
                        issue_name: row.get(1)?,
                        github_issue_number: row.get(2)?,
                        branch_name: row.get(3)?,
                        base_branch: row.get(4)?,
                        worktree_folder: row.get(5)?,
                        dashboard_github_repo: row.get(6)?,
                        dashboard_default_base_branch: row.get(7)?,
                        dashboard_local_folder: row.get(8)?,
                    })
                },
            )
            .map_err(|_| "ERR_ISSUE_NOT_FOUND".to_string())?;

        let mut variables: HashMap<&str, String> = HashMap::new();
        variables.insert("issue_id", context.issue_id.clone());
        variables.insert("issue_name", context.issue_name);

        if let Some(number) = context.github_issue_number {
            variables.insert("issue_number", number.to_string());
        }
        if let Some(ref branch) = context.branch_name {
            variables.insert("branch_name", branch.clone());
        }

        // base_branch: prefer issue-level, fall back to dashboard default
        let base_branch = context.base_branch.or(context.dashboard_default_base_branch);
        if let Some(branch) = base_branch {
            variables.insert("base_branch", branch);
        }

        if let Some(ref folder) = context.worktree_folder {
            variables.insert("worktree_folder", folder.clone());
        }
        if let Some(repo) = context.dashboard_github_repo {
            variables.insert("github_repo", repo);
        }

        let resolved = resolve_command_template(&action.command_template, &variables);

        // Working directory: prefer worktree_folder, fall back to dashboard local_folder
        let working_dir = context
            .worktree_folder
            .or(context.dashboard_local_folder)
            .ok_or_else(|| "No working directory: issue has no worktree_folder and dashboard has no local_folder".to_string())?;

        (resolved, working_dir)
    };

    let session_id = Uuid::new_v4().to_string();

    // Create session row before spawning (needs resolved_command for original_intent)
    {
        let conn = state.write()?;
        conn.execute(
            "INSERT INTO sessions (id, issue_id, provider, state, original_intent, source, working_directory) \
             VALUES (?1, ?2, 'claude-code', 'running', ?3, 'spawned', ?4)",
            rusqlite::params![session_id, issue_id, &resolved_command, &working_directory],
        )
        .map_err(|error| format!("Failed to create session row: {error}"))?;
    }

    let app_data_directory = app_handle
        .path()
        .app_data_dir()
        .map_err(|error| error.to_string())?;
    let database_connection = crate::database::connection::open_actor_connection(app_data_directory)?;

    let config = SpawnConfig {
        prompt: resolved_command,
        working_directory: PathBuf::from(&working_directory),
        resume_session_id: None,
        permission_mode: None,
        model: None,
        max_turns: None,
        env_vars: HashMap::new(),
    };

    manager
        .spawn_session(session_id.clone(), config, app_handle, database_connection)
        .await?;

    Ok(session_id)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn resolve_template_replaces_all_variables() {
        let mut variables = HashMap::new();
        variables.insert("issue_number", "42".to_string());
        variables.insert("branch_name", "feature/login".to_string());
        variables.insert("github_repo", "user/repo".to_string());

        let result = resolve_command_template(
            "claude \"/mp-execute #{{issue_number}}\" --branch {{branch_name}} --repo {{github_repo}}",
            &variables,
        );

        assert_eq!(
            result,
            "claude \"/mp-execute #42\" --branch feature/login --repo user/repo"
        );
    }

    #[test]
    fn resolve_template_leaves_unknown_variables() {
        let variables = HashMap::new();

        let result = resolve_command_template(
            "claude \"/mp-execute #{{issue_number}}\"",
            &variables,
        );

        assert_eq!(result, "claude \"/mp-execute #{{issue_number}}\"");
    }

    #[test]
    fn resolve_template_handles_multiple_occurrences() {
        let mut variables = HashMap::new();
        variables.insert("issue_number", "7".to_string());

        let result = resolve_command_template(
            "echo {{issue_number}} && echo {{issue_number}}",
            &variables,
        );

        assert_eq!(result, "echo 7 && echo 7");
    }

    #[test]
    fn resolve_template_passthrough_no_variables() {
        let variables = HashMap::new();
        let result = resolve_command_template("echo hello", &variables);
        assert_eq!(result, "echo hello");
    }

    #[test]
    fn resolve_template_partial_substitution() {
        let mut variables = HashMap::new();
        variables.insert("issue_number", "5".to_string());

        let result = resolve_command_template(
            "{{issue_number}} {{branch_name}}",
            &variables,
        );

        assert_eq!(result, "5 {{branch_name}}");
    }
}
