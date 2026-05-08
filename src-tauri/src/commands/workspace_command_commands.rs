use rusqlite::Row;
use tauri::State;
use uuid::Uuid;

use crate::database::connection::DatabaseState;
use crate::models::workspace_command::{
    CommandCategory, CreateWorkspaceCommandRequest, UpdateWorkspaceCommandRequest, WorkspaceCommand,
};

use super::shared::resolve_nullable_field;

const SELECT_COLUMNS: &str =
    "id, dashboard_id, category, name, command, port_pattern, expected_exit_code, sort_order";

fn row_to_workspace_command(row: &Row) -> Result<WorkspaceCommand, rusqlite::Error> {
    let category_string: String = row.get(2)?;
    let category = CommandCategory::from_db(category_string).map_err(|error| {
        rusqlite::Error::FromSqlConversionFailure(2, rusqlite::types::Type::Text, error.into())
    })?;

    Ok(WorkspaceCommand {
        id: row.get(0)?,
        dashboard_id: row.get(1)?,
        category,
        name: row.get(3)?,
        command: row.get(4)?,
        port_pattern: row.get(5)?,
        expected_exit_code: row.get(6)?,
        sort_order: row.get(7)?,
    })
}

#[tauri::command]
pub fn create_workspace_command(
    state: State<DatabaseState>,
    request: CreateWorkspaceCommandRequest,
) -> Result<WorkspaceCommand, String> {
    let connection = state.write()?;
    let id = Uuid::new_v4().to_string();

    connection
        .execute(
            "INSERT INTO workspace_commands (id, dashboard_id, category, name, command, port_pattern, expected_exit_code, sort_order) \
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)",
            rusqlite::params![
                id,
                request.dashboard_id,
                request.category.to_string(),
                request.name,
                request.command,
                request.port_pattern,
                request.expected_exit_code.unwrap_or(0),
                request.sort_order.unwrap_or(0),
            ],
        )
        .map_err(|error| format!("Failed to create workspace command: {error}"))?;

    let query = format!("SELECT {SELECT_COLUMNS} FROM workspace_commands WHERE id = ?1");
    connection
        .query_row(&query, [&id], |row| row_to_workspace_command(row))
        .map_err(|error| format!("Failed to read created workspace command: {error}"))
}

#[tauri::command]
pub fn get_workspace_commands_for_dashboard(
    state: State<DatabaseState>,
    dashboard_id: String,
) -> Result<Vec<WorkspaceCommand>, String> {
    let connection = state.read()?;

    let query = format!(
        "SELECT {SELECT_COLUMNS} FROM workspace_commands WHERE dashboard_id = ?1 ORDER BY category, sort_order"
    );
    let mut statement = connection
        .prepare(&query)
        .map_err(|error| format!("Failed to prepare query: {error}"))?;

    let commands = statement
        .query_map([&dashboard_id], |row| row_to_workspace_command(row))
        .map_err(|error| format!("Failed to query workspace commands: {error}"))?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|error| format!("Failed to read workspace command row: {error}"))?;

    Ok(commands)
}

#[tauri::command]
pub fn update_workspace_command(
    state: State<DatabaseState>,
    request: UpdateWorkspaceCommandRequest,
) -> Result<WorkspaceCommand, String> {
    let connection = state.write()?;

    let select_query = format!("SELECT {SELECT_COLUMNS} FROM workspace_commands WHERE id = ?1");
    let existing = connection
        .query_row(&select_query, [&request.id], |row| {
            row_to_workspace_command(row)
        })
        .map_err(|_| "ERR_WORKSPACE_COMMAND_NOT_FOUND".to_string())?;

    let name = request.name.unwrap_or(existing.name);
    let category = request.category.unwrap_or(existing.category);
    let command = request.command.unwrap_or(existing.command);
    let port_pattern = resolve_nullable_field(request.port_pattern, existing.port_pattern);
    let expected_exit_code = request.expected_exit_code.unwrap_or(existing.expected_exit_code);
    let sort_order = request.sort_order.unwrap_or(existing.sort_order);

    connection
        .execute(
            "UPDATE workspace_commands SET name = ?1, category = ?2, command = ?3, port_pattern = ?4, \
             expected_exit_code = ?5, sort_order = ?6 WHERE id = ?7",
            rusqlite::params![
                name,
                category.to_string(),
                command,
                port_pattern,
                expected_exit_code,
                sort_order,
                existing.id,
            ],
        )
        .map_err(|error| format!("Failed to update workspace command: {error}"))?;

    connection
        .query_row(&select_query, [&existing.id], |row| {
            row_to_workspace_command(row)
        })
        .map_err(|error| format!("Failed to read updated workspace command: {error}"))
}

#[tauri::command]
pub fn delete_workspace_command(state: State<DatabaseState>, id: String) -> Result<(), String> {
    let connection = state.write()?;

    let rows_affected = connection
        .execute("DELETE FROM workspace_commands WHERE id = ?1", [&id])
        .map_err(|error| format!("Failed to delete workspace command: {error}"))?;

    if rows_affected == 0 {
        return Err("ERR_WORKSPACE_COMMAND_NOT_FOUND".to_string());
    }

    Ok(())
}

#[tauri::command]
pub fn reorder_workspace_commands(
    state: State<DatabaseState>,
    command_ids: Vec<String>,
) -> Result<(), String> {
    let mut connection = state.write()?;

    let transaction = connection
        .transaction()
        .map_err(|error| format!("Failed to begin transaction: {error}"))?;

    for (index, command_id) in command_ids.iter().enumerate() {
        transaction
            .execute(
                "UPDATE workspace_commands SET sort_order = ?1 WHERE id = ?2",
                rusqlite::params![index as i64, command_id],
            )
            .map_err(|error| format!("Failed to reorder workspace command: {error}"))?;
    }

    transaction
        .commit()
        .map_err(|error| format!("Failed to commit reorder: {error}"))
}
