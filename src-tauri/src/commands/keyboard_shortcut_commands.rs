use tauri::State;

use crate::database::connection::DatabaseState;
use crate::models::keyboard_shortcut::{
    row_to_keyboard_shortcut, KeyboardShortcut, UpsertCustomBindingRequest,
    KEYBOARD_SHORTCUT_SELECT_COLUMNS,
};

#[tauri::command]
pub fn get_custom_bindings(
    state: State<DatabaseState>,
) -> Result<Vec<KeyboardShortcut>, String> {
    let connection = state.read()?;

    let query = format!(
        "SELECT {KEYBOARD_SHORTCUT_SELECT_COLUMNS} FROM keyboard_shortcuts ORDER BY action_id"
    );
    let mut statement = connection
        .prepare(&query)
        .map_err(|error| format!("Failed to prepare query: {error}"))?;

    let shortcuts = statement
        .query_map([], |row| row_to_keyboard_shortcut(row))
        .map_err(|error| format!("Failed to query custom bindings: {error}"))?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|error| format!("Failed to read custom binding row: {error}"))?;

    Ok(shortcuts)
}

#[tauri::command]
pub fn upsert_custom_binding(
    state: State<DatabaseState>,
    request: UpsertCustomBindingRequest,
) -> Result<KeyboardShortcut, String> {
    let connection = state.write()?;

    connection
        .execute(
            "INSERT OR REPLACE INTO keyboard_shortcuts (action_id, binding) VALUES (?1, ?2)",
            rusqlite::params![request.action_id, request.binding],
        )
        .map_err(|error| format!("Failed to upsert custom binding: {error}"))?;

    Ok(KeyboardShortcut {
        action_id: request.action_id,
        binding: request.binding,
    })
}

#[tauri::command]
pub fn delete_custom_binding(
    state: State<DatabaseState>,
    action_id: String,
) -> Result<(), String> {
    let connection = state.write()?;

    connection
        .execute(
            "DELETE FROM keyboard_shortcuts WHERE action_id = ?1",
            rusqlite::params![action_id],
        )
        .map_err(|error| format!("Failed to delete custom binding: {error}"))?;

    Ok(())
}
