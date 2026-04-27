use rusqlite::Row;
use tauri::State;
use uuid::Uuid;

use crate::database::connection::DatabaseState;
use crate::database::migrations::{seed_label_shape_mappings_for_dashboard, DEFAULT_TREE_SHAPE};
use crate::models::dashboard::{
    CreateDashboardRequest, Dashboard, DashboardType, UpdateDashboardRequest,
};

const DASHBOARD_SELECT_COLUMNS: &str =
    "id, name, type, github_repo, local_folder, default_base_branch, worktree_parent_folder, color_palette_id, default_shape";

fn row_to_dashboard(row: &Row) -> Result<Dashboard, rusqlite::Error> {
    let dashboard_type_string: String = row.get(2)?;
    let dashboard_type =
        DashboardType::from_db(dashboard_type_string).map_err(|error| {
            rusqlite::Error::FromSqlConversionFailure(2, rusqlite::types::Type::Text, error.into())
        })?;

    Ok(Dashboard {
        id: row.get(0)?,
        name: row.get(1)?,
        dashboard_type,
        github_repo: row.get(3)?,
        local_folder: row.get(4)?,
        default_base_branch: row.get(5)?,
        worktree_parent_folder: row.get(6)?,
        color_palette_id: row.get(7)?,
        default_shape: row.get(8)?,
    })
}

#[tauri::command]
pub fn create_dashboard(
    state: State<DatabaseState>,
    request: CreateDashboardRequest,
) -> Result<Dashboard, String> {
    let connection = state.write()?;
    let id = Uuid::new_v4().to_string();

    connection
        .execute(
            "INSERT INTO dashboards (id, name, type, github_repo, local_folder, default_base_branch, worktree_parent_folder, color_palette_id)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)",
            rusqlite::params![
                id,
                request.name,
                request.dashboard_type.to_string(),
                request.github_repo,
                request.local_folder,
                request.default_base_branch,
                request.worktree_parent_folder,
                request.color_palette_id,
            ],
        )
        .map_err(|error| format!("Failed to create dashboard: {error}"))?;

    seed_label_shape_mappings_for_dashboard(&connection, &id)
        .map_err(|error| format!("Failed to seed label shape mappings: {error}"))?;

    Ok(Dashboard {
        id,
        name: request.name,
        dashboard_type: request.dashboard_type,
        github_repo: request.github_repo,
        local_folder: request.local_folder,
        default_base_branch: request.default_base_branch,
        worktree_parent_folder: request.worktree_parent_folder,
        color_palette_id: request.color_palette_id,
        default_shape: DEFAULT_TREE_SHAPE.to_string(),
    })
}

#[tauri::command]
pub fn get_dashboards(state: State<DatabaseState>) -> Result<Vec<Dashboard>, String> {
    let connection = state.read()?;

    let query = format!("SELECT {DASHBOARD_SELECT_COLUMNS} FROM dashboards");
    let mut statement = connection
        .prepare(&query)
        .map_err(|error| format!("Failed to prepare query: {error}"))?;

    let dashboards = statement
        .query_map([], |row| row_to_dashboard(row))
        .map_err(|error| format!("Failed to query dashboards: {error}"))?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|error| format!("Failed to read dashboard row: {error}"))?;

    Ok(dashboards)
}

#[tauri::command]
pub fn get_dashboard(state: State<DatabaseState>, id: String) -> Result<Dashboard, String> {
    let connection = state.read()?;

    let query = format!("SELECT {DASHBOARD_SELECT_COLUMNS} FROM dashboards WHERE id = ?1");
    connection
        .query_row(&query, [&id], |row| row_to_dashboard(row))
        .map_err(|error| format!("Dashboard not found: {error}"))
}

use super::shared::resolve_nullable_field;

#[tauri::command]
pub fn update_dashboard(
    state: State<DatabaseState>,
    request: UpdateDashboardRequest,
) -> Result<Dashboard, String> {
    let connection = state.write()?;

    let query = format!("SELECT {DASHBOARD_SELECT_COLUMNS} FROM dashboards WHERE id = ?1");
    let existing = connection
        .query_row(&query, [&request.id], |row| row_to_dashboard(row))
        .map_err(|error| format!("Dashboard not found: {error}"))?;

    let updated = Dashboard {
        id: existing.id,
        name: request.name.unwrap_or(existing.name),
        dashboard_type: request.dashboard_type.unwrap_or(existing.dashboard_type),
        github_repo: resolve_nullable_field(request.github_repo, existing.github_repo),
        local_folder: resolve_nullable_field(request.local_folder, existing.local_folder),
        default_base_branch: resolve_nullable_field(
            request.default_base_branch,
            existing.default_base_branch,
        ),
        worktree_parent_folder: resolve_nullable_field(
            request.worktree_parent_folder,
            existing.worktree_parent_folder,
        ),
        color_palette_id: resolve_nullable_field(
            request.color_palette_id,
            existing.color_palette_id,
        ),
        default_shape: request.default_shape.unwrap_or(existing.default_shape),
    };

    connection
        .execute(
            "UPDATE dashboards SET name = ?1, type = ?2, github_repo = ?3, local_folder = ?4, \
             default_base_branch = ?5, worktree_parent_folder = ?6, color_palette_id = ?7, \
             default_shape = ?8 WHERE id = ?9",
            rusqlite::params![
                updated.name,
                updated.dashboard_type.to_string(),
                updated.github_repo,
                updated.local_folder,
                updated.default_base_branch,
                updated.worktree_parent_folder,
                updated.color_palette_id,
                updated.default_shape,
                updated.id,
            ],
        )
        .map_err(|error| format!("Failed to update dashboard: {error}"))?;

    Ok(updated)
}

#[tauri::command]
pub fn delete_dashboard(state: State<DatabaseState>, id: String) -> Result<(), String> {
    let connection = state.write()?;

    let rows_affected = connection
        .execute("DELETE FROM dashboards WHERE id = ?1", [&id])
        .map_err(|error| format!("Failed to delete dashboard: {error}"))?;

    if rows_affected == 0 {
        return Err("Dashboard not found".to_string());
    }

    Ok(())
}
