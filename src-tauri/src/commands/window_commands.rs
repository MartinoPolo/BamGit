use rusqlite::Row;
use tauri::{AppHandle, State};

use crate::database::connection::DatabaseState;
use crate::models::app_setting::AppSetting;
use crate::models::overview::OverviewWorkspaceData;
use crate::models::window_binding::WindowWorkspaceBinding;
use crate::window_manager::{self, APP_NAME, DEFAULT_WINDOW_HEIGHT, DEFAULT_WINDOW_WIDTH};

const BINDING_SELECT_COLUMNS: &str =
    "window_label, dashboard_id, window_x, window_y, window_width, window_height";

fn binding_from_row(row: &Row) -> Result<WindowWorkspaceBinding, rusqlite::Error> {
    Ok(WindowWorkspaceBinding {
        window_label: row.get(0)?,
        dashboard_id: row.get(1)?,
        window_x: row.get(2)?,
        window_y: row.get(3)?,
        window_width: row.get(4)?,
        window_height: row.get(5)?,
    })
}

#[tauri::command]
pub fn open_workspace_window(
    app: AppHandle,
    state: State<DatabaseState>,
    dashboard_id: String,
) -> Result<(), String> {
    let connection = state.read()?;

    let name: String = connection
        .query_row(
            "SELECT name FROM dashboards WHERE id = ?1",
            [&dashboard_id],
            |row| row.get(0),
        )
        .map_err(|error| format!("Dashboard not found: {error}"))?;

    let label = window_manager::workspace_label(&dashboard_id);
    let title = format!("{name} — {APP_NAME}");

    let saved_binding: Option<WindowWorkspaceBinding> = connection
        .query_row(
            &format!("SELECT {BINDING_SELECT_COLUMNS} FROM window_workspace_bindings WHERE dashboard_id = ?1"),
            [&dashboard_id],
            binding_from_row,
        )
        .ok();

    let width = saved_binding
        .as_ref()
        .and_then(|b| b.window_width)
        .map_or(DEFAULT_WINDOW_WIDTH, |v| v as f64);
    let height = saved_binding
        .as_ref()
        .and_then(|b| b.window_height)
        .map_or(DEFAULT_WINDOW_HEIGHT, |v| v as f64);

    drop(connection);

    window_manager::open_or_focus_window(&app, &label, "/", &title, width, height)?;

    let connection = state.write()?;
    connection
        .execute(
            "INSERT OR REPLACE INTO window_workspace_bindings (window_label, dashboard_id) \
             VALUES (?1, ?2)",
            rusqlite::params![label, dashboard_id],
        )
        .map_err(|error| format!("Failed to persist window binding: {error}"))?;

    Ok(())
}

#[tauri::command]
pub fn close_workspace_window(
    app: AppHandle,
    state: State<DatabaseState>,
    window_label: String,
) -> Result<(), String> {
    window_manager::close_window(&app, &window_label)?;

    let connection = state.write()?;
    connection
        .execute(
            "DELETE FROM window_workspace_bindings WHERE window_label = ?1",
            [&window_label],
        )
        .map_err(|error| format!("Failed to remove window binding: {error}"))?;

    Ok(())
}

#[tauri::command]
pub fn get_window_bindings(
    state: State<DatabaseState>,
) -> Result<Vec<WindowWorkspaceBinding>, String> {
    let connection = state.read()?;

    let query = format!("SELECT {BINDING_SELECT_COLUMNS} FROM window_workspace_bindings");
    let mut statement = connection
        .prepare(&query)
        .map_err(|error| format!("Failed to prepare query: {error}"))?;

    let bindings = statement
        .query_map([], binding_from_row)
        .map_err(|error| format!("Failed to query bindings: {error}"))?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|error| format!("Failed to read binding row: {error}"))?;

    Ok(bindings)
}

#[tauri::command]
pub fn save_window_geometry(
    state: State<DatabaseState>,
    window_label: String,
    window_x: i32,
    window_y: i32,
    window_width: i32,
    window_height: i32,
) -> Result<(), String> {
    let connection = state.write()?;

    connection
        .execute(
            "UPDATE window_workspace_bindings \
             SET window_x = ?1, window_y = ?2, window_width = ?3, window_height = ?4 \
             WHERE window_label = ?5",
            rusqlite::params![window_x, window_y, window_width, window_height, window_label],
        )
        .map_err(|error| format!("Failed to save window geometry: {error}"))?;

    Ok(())
}

#[tauri::command]
pub fn get_overview_data(
    state: State<DatabaseState>,
) -> Result<Vec<OverviewWorkspaceData>, String> {
    let connection = state.read()?;

    let mut statement = connection
        .prepare(
            "SELECT
                d.id,
                d.name,
                d.github_repo,
                d.local_folder,
                d.color_palette_id,
                COALESCE((SELECT COUNT(*) FROM issues i WHERE i.dashboard_id = d.id AND i.status = 'active'), 0) AS open_issue_count,
                COALESCE((SELECT COUNT(*) FROM sessions s JOIN issues i ON s.issue_id = i.id WHERE i.dashboard_id = d.id AND s.state = 'running'), 0) AS active_session_count,
                (SELECT MAX(s2.started_at) FROM sessions s2 JOIN issues i2 ON s2.issue_id = i2.id WHERE i2.dashboard_id = d.id) AS last_activity,
                (SELECT SUM(s3.cost_usd) FROM sessions s3 JOIN issues i3 ON s3.issue_id = i3.id WHERE i3.dashboard_id = d.id) AS total_cost_usd
            FROM dashboards d
            WHERE d.type = 'repo'
            ORDER BY d.name",
        )
        .map_err(|error| format!("Failed to prepare overview query: {error}"))?;

    let data = statement
        .query_map([], |row| {
            Ok(OverviewWorkspaceData {
                dashboard_id: row.get(0)?,
                name: row.get(1)?,
                github_repo: row.get(2)?,
                local_folder: row.get(3)?,
                color_palette_id: row.get(4)?,
                open_issue_count: row.get(5)?,
                active_session_count: row.get(6)?,
                last_activity: row.get(7)?,
                total_cost_usd: row.get(8)?,
            })
        })
        .map_err(|error| format!("Failed to query overview data: {error}"))?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|error| format!("Failed to read overview row: {error}"))?;

    Ok(data)
}

#[tauri::command]
pub fn get_app_setting(
    state: State<DatabaseState>,
    key: String,
) -> Result<Option<AppSetting>, String> {
    let connection = state.read()?;

    let result = connection
        .query_row(
            "SELECT key, value FROM app_settings WHERE key = ?1",
            [&key],
            |row| {
                Ok(AppSetting {
                    key: row.get(0)?,
                    value: row.get(1)?,
                })
            },
        )
        .ok();

    Ok(result)
}

#[tauri::command]
pub fn set_app_setting(
    state: State<DatabaseState>,
    key: String,
    value: String,
) -> Result<(), String> {
    let connection = state.write()?;

    connection
        .execute(
            "INSERT OR REPLACE INTO app_settings (key, value) VALUES (?1, ?2)",
            rusqlite::params![key, value],
        )
        .map_err(|error| format!("Failed to set app setting: {error}"))?;

    Ok(())
}
