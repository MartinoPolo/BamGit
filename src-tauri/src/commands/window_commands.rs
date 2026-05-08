use rusqlite::Row;
use tauri::{AppHandle, Manager, State};

use crate::database::connection::DatabaseState;
use crate::models::app_setting::AppSetting;
use crate::models::overview::OverviewWorkspaceData;
use crate::models::window_binding::WindowWorkspaceBinding;
use crate::window_manager::{self, APP_NAME, DEFAULT_WINDOW_HEIGHT, DEFAULT_WINDOW_WIDTH};

pub fn restore_workspace_windows(app: &AppHandle, state: &DatabaseState) {
    let connection = match state.read() {
        Ok(c) => c,
        Err(error) => {
            log::warn!("Failed to read DB for window restore: {error}");
            return;
        }
    };

    let query = format!(
        "SELECT {BINDING_SELECT_COLUMNS}, d.name \
         FROM window_workspace_bindings wb \
         JOIN dashboards d ON wb.dashboard_id = d.id"
    );

    let mut statement = match connection.prepare(&query) {
        Ok(s) => s,
        Err(error) => {
            log::warn!("Failed to prepare window restore query: {error}");
            return;
        }
    };

    let bindings: Vec<(WindowWorkspaceBinding, String)> = statement
        .query_map([], |row| {
            let binding = binding_from_row(row)?;
            let name: String = row.get(6)?;
            Ok((binding, name))
        })
        .ok()
        .map(|rows| rows.filter_map(|r| r.ok()).collect())
        .unwrap_or_default();

    drop(statement);
    drop(connection);

    for (binding, name) in bindings {
        let title = format!("{name} — {APP_NAME}");
        let width = binding
            .window_width
            .map_or(DEFAULT_WINDOW_WIDTH, |v| v as f64);
        let height = binding
            .window_height
            .map_or(DEFAULT_WINDOW_HEIGHT, |v| v as f64);
        if let Err(error) = window_manager::open_or_focus_window_with_position(
            app,
            &binding.window_label,
            "index.html",
            &title,
            width,
            height,
            binding.window_x,
            binding.window_y,
        ) {
            log::warn!("Failed to restore window {}: {error}", binding.window_label);
        }
    }
}

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
pub async fn open_workspace_window(
    app: AppHandle,
    dashboard_id: String,
) -> Result<(), String> {
    let state = app.state::<DatabaseState>();
    let connection = state.read()?;

    let name: String = connection
        .query_row(
            "SELECT name FROM dashboards WHERE id = ?1",
            [&dashboard_id],
            |row: &Row| row.get(0),
        )
        .map_err(|_| "ERR_DASHBOARD_NOT_FOUND".to_string())?;

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

    let saved_x = saved_binding.as_ref().and_then(|b| b.window_x);
    let saved_y = saved_binding.as_ref().and_then(|b| b.window_y);
    window_manager::open_or_focus_window_with_position(&app, &label, "index.html", &title, width, height, saved_x, saved_y)?;

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
pub async fn close_workspace_window(
    app: AppHandle,
    window_label: String,
) -> Result<(), String> {
    window_manager::close_window(&app, &window_label)?;

    let state = app.state::<DatabaseState>();
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
    include_archived: Option<bool>,
) -> Result<Vec<OverviewWorkspaceData>, String> {
    let connection = state.read()?;

    let status_filter = if include_archived.unwrap_or(false) {
        "d.status IN ('active', 'archived')"
    } else {
        "d.status = 'active'"
    };

    let query = format!(
        "SELECT
            d.id,
            d.name,
            d.github_repo,
            d.local_folder,
            d.color_palette_id,
            d.accent_color,
            COALESCE((SELECT COUNT(*) FROM issues i WHERE i.dashboard_id = d.id AND i.status = 'active'), 0) AS open_issue_count,
            COALESCE((SELECT COUNT(*) FROM sessions s JOIN issues i ON s.issue_id = i.id WHERE i.dashboard_id = d.id AND s.state = 'running'), 0) AS active_session_count,
            (SELECT MAX(s2.started_at) FROM sessions s2 JOIN issues i2 ON s2.issue_id = i2.id WHERE i2.dashboard_id = d.id) AS last_activity,
            (SELECT SUM(s3.cost_usd) FROM sessions s3 JOIN issues i3 ON s3.issue_id = i3.id WHERE i3.dashboard_id = d.id) AS total_cost_usd,
            COALESCE((SELECT COUNT(*) FROM sessions s4 JOIN issues i4 ON s4.issue_id = i4.id WHERE i4.dashboard_id = d.id AND s4.state = 'needs-input'), 0) AS hitl_count,
            COALESCE((SELECT COUNT(*) FROM git_status_cache g JOIN issues ig ON g.issue_id = ig.id WHERE ig.dashboard_id = d.id AND g.pr_state IS NOT NULL AND g.pr_state NOT IN ('merged', 'closed')), 0) AS open_pr_count,
            COALESCE((SELECT COUNT(*) FROM git_status_cache g2 JOIN issues ig2 ON g2.issue_id = ig2.id WHERE ig2.dashboard_id = d.id AND (g2.pr_state IN ('changes-requested', 'review-requested') OR g2.merge_conflict = 1)), 0) AS prs_needing_attention,
            'off' AS afk_loop_status,
            d.default_base_branch AS default_branch,
            COALESCE((SELECT COUNT(*) FROM issues iw WHERE iw.dashboard_id = d.id AND iw.worktree_state = 'active'), 0) AS worktree_count,
            COALESCE((SELECT COUNT(*) FROM issues ia WHERE ia.dashboard_id = d.id AND ia.worktree_state = 'active' AND ia.status = 'active' AND NOT EXISTS (SELECT 1 FROM sessions sa WHERE sa.issue_id = ia.id AND sa.state = 'running')), 0) AS afk_ready_count,
            0 AS prd_count,
            0 AS prd_completed_subs,
            0 AS prd_total_subs,
            d.status
        FROM dashboards d
        WHERE d.type = 'repo' AND {status_filter}
        ORDER BY d.name"
    );

    let mut statement = connection
        .prepare(&query)
        .map_err(|error| format!("Failed to prepare overview query: {error}"))?;

    let data = statement
        .query_map([], |row| {
            let status_string: String = row.get(20)?;
            let status =
                crate::models::dashboard::DashboardStatus::from_db(status_string).map_err(
                    |error| {
                        rusqlite::Error::FromSqlConversionFailure(
                            20,
                            rusqlite::types::Type::Text,
                            error.into(),
                        )
                    },
                )?;

            Ok(OverviewWorkspaceData {
                dashboard_id: row.get(0)?,
                name: row.get(1)?,
                github_repo: row.get(2)?,
                local_folder: row.get(3)?,
                color_palette_id: row.get(4)?,
                accent_color: row.get(5)?,
                open_issue_count: row.get(6)?,
                active_session_count: row.get(7)?,
                last_activity: row.get(8)?,
                total_cost_usd: row.get(9)?,
                hitl_count: row.get(10)?,
                open_pr_count: row.get(11)?,
                prs_needing_attention: row.get(12)?,
                afk_loop_status: row.get(13)?,
                default_branch: row.get(14)?,
                worktree_count: row.get(15)?,
                afk_ready_count: row.get(16)?,
                prd_count: row.get(17)?,
                prd_completed_subs: row.get(18)?,
                prd_total_subs: row.get(19)?,
                status,
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
