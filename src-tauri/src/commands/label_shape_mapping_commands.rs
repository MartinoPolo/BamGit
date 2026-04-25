use rusqlite::Row;
use tauri::State;

use crate::database::connection::DatabaseState;
use crate::models::label_shape_mapping::LabelShapeMapping;

fn row_to_mapping(row: &Row) -> Result<LabelShapeMapping, rusqlite::Error> {
    Ok(LabelShapeMapping {
        id: row.get(0)?,
        dashboard_id: row.get(1)?,
        label_name: row.get(2)?,
        tree_shape: row.get(3)?,
        color: row.get(4)?,
        priority_order: row.get(5)?,
    })
}

#[tauri::command]
pub fn get_label_shape_mappings(
    state: State<DatabaseState>,
    dashboard_id: String,
) -> Result<Vec<LabelShapeMapping>, String> {
    let connection = state.0.lock().map_err(|error| error.to_string())?;

    let mut statement = connection
        .prepare(
            "SELECT id, dashboard_id, label_name, tree_shape, color, priority_order \
             FROM label_shape_mappings WHERE dashboard_id = ?1 ORDER BY priority_order",
        )
        .map_err(|error| format!("Failed to prepare query: {error}"))?;

    let mappings = statement
        .query_map([&dashboard_id], |row| row_to_mapping(row))
        .map_err(|error| format!("Failed to query mappings: {error}"))?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|error| format!("Failed to read mapping row: {error}"))?;

    Ok(mappings)
}

#[tauri::command]
pub fn upsert_label_shape_mapping(
    state: State<DatabaseState>,
    dashboard_id: String,
    label_name: String,
    tree_shape: String,
    color: Option<String>,
    priority_order: i32,
) -> Result<LabelShapeMapping, String> {
    let connection = state.0.lock().map_err(|error| error.to_string())?;
    let id = uuid::Uuid::new_v4().to_string();

    connection
        .execute(
            "INSERT INTO label_shape_mappings (id, dashboard_id, label_name, tree_shape, color, priority_order) \
             VALUES (?1, ?2, ?3, ?4, ?5, ?6) \
             ON CONFLICT(dashboard_id, label_name) DO UPDATE SET \
             tree_shape = excluded.tree_shape, color = excluded.color, priority_order = excluded.priority_order",
            rusqlite::params![id, dashboard_id, label_name, tree_shape, color, priority_order],
        )
        .map_err(|error| format!("Failed to upsert mapping: {error}"))?;

    connection
        .query_row(
            "SELECT id, dashboard_id, label_name, tree_shape, color, priority_order \
             FROM label_shape_mappings WHERE dashboard_id = ?1 AND label_name = ?2",
            rusqlite::params![dashboard_id, label_name],
            |row| row_to_mapping(row),
        )
        .map_err(|error| format!("Failed to read upserted mapping: {error}"))
}
