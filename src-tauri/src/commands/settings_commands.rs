use std::collections::HashMap;

use tauri::State;

use crate::database::connection::DatabaseState;
use crate::models::setting::{UserSetting, WorkspaceSetting};

// ─── Helpers ────────────────────────────────────────────────────────────────

fn query_optional_row<T, F>(
    connection: &rusqlite::Connection,
    sql: &str,
    params: &[&dyn rusqlite::types::ToSql],
    mapper: F,
) -> Result<Option<T>, String>
where
    F: FnOnce(&rusqlite::Row) -> rusqlite::Result<T>,
{
    match connection.query_row(sql, params, mapper) {
        Ok(value) => Ok(Some(value)),
        Err(rusqlite::Error::QueryReturnedNoRows) => Ok(None),
        Err(error) => Err(format!("Database error: {error}")),
    }
}

// ─── User Settings CRUD ─────────────────────────────────────────────────────

#[tauri::command]
pub fn get_user_setting(
    state: State<DatabaseState>,
    key: String,
) -> Result<Option<UserSetting>, String> {
    let connection = state.read()?;
    query_optional_row(
        &connection,
        "SELECT key, value FROM user_settings WHERE key = ?1",
        &[&key as &dyn rusqlite::types::ToSql],
        |row| {
            Ok(UserSetting {
                key: row.get(0)?,
                value: row.get(1)?,
            })
        },
    )
}

#[tauri::command]
pub fn set_user_setting(
    state: State<DatabaseState>,
    key: String,
    value: String,
) -> Result<(), String> {
    let connection = state.write()?;
    connection
        .execute(
            "INSERT OR REPLACE INTO user_settings (key, value) VALUES (?1, ?2)",
            rusqlite::params![key, value],
        )
        .map_err(|error| format!("Failed to set user setting: {error}"))?;
    Ok(())
}

#[tauri::command]
pub fn delete_user_setting(
    state: State<DatabaseState>,
    key: String,
) -> Result<(), String> {
    let connection = state.write()?;
    connection
        .execute("DELETE FROM user_settings WHERE key = ?1", [&key])
        .map_err(|error| format!("Failed to delete user setting: {error}"))?;
    Ok(())
}

#[tauri::command]
pub fn get_all_user_settings(
    state: State<DatabaseState>,
) -> Result<Vec<UserSetting>, String> {
    let connection = state.read()?;
    let mut statement = connection
        .prepare("SELECT key, value FROM user_settings")
        .map_err(|error| format!("Failed to prepare query: {error}"))?;
    let settings = statement
        .query_map([], |row| {
            Ok(UserSetting {
                key: row.get(0)?,
                value: row.get(1)?,
            })
        })
        .map_err(|error| format!("Failed to query settings: {error}"))?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|error| format!("Failed to read setting row: {error}"))?;
    Ok(settings)
}

// ─── Workspace Settings CRUD ─────────────────────────────────────────────────

#[tauri::command]
pub fn get_workspace_setting(
    state: State<DatabaseState>,
    dashboard_id: String,
    key: String,
) -> Result<Option<WorkspaceSetting>, String> {
    let connection = state.read()?;
    query_optional_row(
        &connection,
        "SELECT dashboard_id, key, value FROM workspace_settings WHERE dashboard_id = ?1 AND key = ?2",
        &[&dashboard_id as &dyn rusqlite::types::ToSql, &key],
        |row| {
            Ok(WorkspaceSetting {
                dashboard_id: row.get(0)?,
                key: row.get(1)?,
                value: row.get(2)?,
            })
        },
    )
}

#[tauri::command]
pub fn set_workspace_setting(
    state: State<DatabaseState>,
    dashboard_id: String,
    key: String,
    value: String,
) -> Result<(), String> {
    let connection = state.write()?;
    connection
        .execute(
            "INSERT INTO workspace_settings (dashboard_id, key, value) VALUES (?1, ?2, ?3) \
             ON CONFLICT(dashboard_id, key) DO UPDATE SET value = excluded.value",
            rusqlite::params![dashboard_id, key, value],
        )
        .map_err(|error| format!("Failed to set workspace setting: {error}"))?;
    Ok(())
}

#[tauri::command]
pub fn delete_workspace_setting(
    state: State<DatabaseState>,
    dashboard_id: String,
    key: String,
) -> Result<(), String> {
    let connection = state.write()?;
    connection
        .execute(
            "DELETE FROM workspace_settings WHERE dashboard_id = ?1 AND key = ?2",
            rusqlite::params![dashboard_id, key],
        )
        .map_err(|error| format!("Failed to delete workspace setting: {error}"))?;
    Ok(())
}

#[tauri::command]
pub fn get_all_workspace_settings(
    state: State<DatabaseState>,
    dashboard_id: String,
) -> Result<Vec<WorkspaceSetting>, String> {
    let connection = state.read()?;
    let mut statement = connection
        .prepare("SELECT dashboard_id, key, value FROM workspace_settings WHERE dashboard_id = ?1")
        .map_err(|error| format!("Failed to prepare query: {error}"))?;
    let settings = statement
        .query_map([&dashboard_id], |row| {
            Ok(WorkspaceSetting {
                dashboard_id: row.get(0)?,
                key: row.get(1)?,
                value: row.get(2)?,
            })
        })
        .map_err(|error| format!("Failed to query settings: {error}"))?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|error| format!("Failed to read setting row: {error}"))?;
    Ok(settings)
}

#[tauri::command]
pub fn get_workspace_overridden_keys(
    state: State<DatabaseState>,
    dashboard_id: String,
) -> Result<Vec<String>, String> {
    let connection = state.read()?;
    let mut statement = connection
        .prepare("SELECT key FROM workspace_settings WHERE dashboard_id = ?1")
        .map_err(|error| format!("Failed to prepare query: {error}"))?;
    let keys = statement
        .query_map([&dashboard_id], |row| row.get::<_, String>(0))
        .map_err(|error| format!("Failed to query keys: {error}"))?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|error| format!("Failed to read key row: {error}"))?;
    Ok(keys)
}

// ─── Cascade Resolution ─────────────────────────────────────────────────────

#[tauri::command]
pub fn get_resolved_setting(
    state: State<DatabaseState>,
    key: String,
    dashboard_id: Option<String>,
) -> Result<Option<String>, String> {
    let connection = state.read()?;
    resolve_setting_cascade(&connection, &key, dashboard_id.as_deref())
}

fn resolve_setting_cascade(
    connection: &rusqlite::Connection,
    key: &str,
    dashboard_id: Option<&str>,
) -> Result<Option<String>, String> {
    if let Some(did) = dashboard_id {
        let workspace_value = query_optional_row(
            connection,
            "SELECT value FROM workspace_settings WHERE dashboard_id = ?1 AND key = ?2",
            &[&did as &dyn rusqlite::types::ToSql, &key],
            |row| row.get(0),
        )?;
        if workspace_value.is_some() {
            return Ok(workspace_value);
        }
    }

    query_optional_row(
        connection,
        "SELECT value FROM user_settings WHERE key = ?1",
        &[&key as &dyn rusqlite::types::ToSql],
        |row| row.get(0),
    )
}

// ─── Bulk Operations ────────────────────────────────────────────────────────

#[tauri::command]
pub fn bulk_set_user_settings(
    state: State<DatabaseState>,
    entries: HashMap<String, String>,
) -> Result<(), String> {
    let connection = state.write()?;
    let transaction = connection
        .unchecked_transaction()
        .map_err(|error| format!("Failed to start transaction: {error}"))?;

    for (key, value) in &entries {
        transaction
            .execute(
                "INSERT OR REPLACE INTO user_settings (key, value) VALUES (?1, ?2)",
                rusqlite::params![key, value],
            )
            .map_err(|error| format!("Failed to set setting '{key}': {error}"))?;
    }

    transaction
        .commit()
        .map_err(|error| format!("Failed to commit bulk settings: {error}"))?;
    Ok(())
}

#[cfg(test)]
mod tests {
    use crate::database::test_helpers::setup_test_database;

    // ─── User settings tests ─────────────────────────────────────────────────

    #[test]
    fn user_setting_insert_and_read() {
        let connection = setup_test_database();

        connection
            .execute(
                "INSERT INTO user_settings (key, value) VALUES ('theme', 'dark')",
                [],
            )
            .unwrap();

        let value: String = connection
            .query_row(
                "SELECT value FROM user_settings WHERE key = 'theme'",
                [],
                |row| row.get(0),
            )
            .unwrap();

        assert_eq!(value, "dark");
    }

    #[test]
    fn user_setting_upsert_updates_value() {
        let connection = setup_test_database();

        connection
            .execute(
                "INSERT INTO user_settings (key, value) VALUES ('theme', 'dark')",
                [],
            )
            .unwrap();

        connection
            .execute(
                "INSERT OR REPLACE INTO user_settings (key, value) VALUES ('theme', 'light')",
                [],
            )
            .unwrap();

        let value: String = connection
            .query_row(
                "SELECT value FROM user_settings WHERE key = 'theme'",
                [],
                |row| row.get(0),
            )
            .unwrap();

        assert_eq!(value, "light");
    }

    #[test]
    fn user_setting_delete() {
        let connection = setup_test_database();

        connection
            .execute(
                "INSERT INTO user_settings (key, value) VALUES ('theme', 'dark')",
                [],
            )
            .unwrap();

        connection
            .execute("DELETE FROM user_settings WHERE key = 'theme'", [])
            .unwrap();

        let count: i64 = connection
            .query_row("SELECT COUNT(*) FROM user_settings", [], |row| row.get(0))
            .unwrap();

        assert_eq!(count, 0);
    }

    #[test]
    fn user_setting_get_all() {
        let connection = setup_test_database();

        connection
            .execute(
                "INSERT INTO user_settings (key, value) VALUES ('a', '1')",
                [],
            )
            .unwrap();
        connection
            .execute(
                "INSERT INTO user_settings (key, value) VALUES ('b', '2')",
                [],
            )
            .unwrap();

        let mut statement = connection
            .prepare("SELECT key FROM user_settings ORDER BY key")
            .unwrap();
        let keys: Vec<String> = statement
            .query_map([], |row| row.get(0))
            .unwrap()
            .collect::<Result<Vec<_>, _>>()
            .unwrap();

        assert_eq!(keys, vec!["a", "b"]);
    }

    // ─── Workspace settings tests ────────────────────────────────────────────

    fn insert_dashboard(connection: &rusqlite::Connection, id: &str) {
        connection
            .execute(
                "INSERT INTO dashboards (id, name, type) VALUES (?1, 'Test', 'repo')",
                [id],
            )
            .unwrap();
    }

    #[test]
    fn workspace_setting_insert_and_read() {
        let connection = setup_test_database();
        insert_dashboard(&connection, "d1");

        connection
            .execute(
                "INSERT INTO workspace_settings (dashboard_id, key, value) VALUES ('d1', 'theme', 'dark')",
                [],
            )
            .unwrap();

        let value: String = connection
            .query_row(
                "SELECT value FROM workspace_settings WHERE dashboard_id = 'd1' AND key = 'theme'",
                [],
                |row| row.get(0),
            )
            .unwrap();

        assert_eq!(value, "dark");
    }

    #[test]
    fn workspace_setting_unique_constraint_per_dashboard_key() {
        let connection = setup_test_database();
        insert_dashboard(&connection, "d1");

        connection
            .execute(
                "INSERT INTO workspace_settings (dashboard_id, key, value) VALUES ('d1', 'theme', 'dark')",
                [],
            )
            .unwrap();

        let result = connection.execute(
            "INSERT INTO workspace_settings (dashboard_id, key, value) VALUES ('d1', 'theme', 'light')",
            [],
        );

        assert!(result.is_err(), "Duplicate (dashboard_id, key) should be rejected");
    }

    #[test]
    fn workspace_setting_same_key_different_dashboards() {
        let connection = setup_test_database();
        insert_dashboard(&connection, "d1");
        insert_dashboard(&connection, "d2");

        connection
            .execute(
                "INSERT INTO workspace_settings (dashboard_id, key, value) VALUES ('d1', 'theme', 'dark')",
                [],
            )
            .unwrap();

        let result = connection.execute(
            "INSERT INTO workspace_settings (dashboard_id, key, value) VALUES ('d2', 'theme', 'light')",
            [],
        );

        assert!(result.is_ok(), "Same key on different dashboards should be accepted");
    }

    #[test]
    fn workspace_setting_cascade_on_dashboard_delete() {
        let connection = setup_test_database();
        insert_dashboard(&connection, "d1");

        connection
            .execute(
                "INSERT INTO workspace_settings (dashboard_id, key, value) VALUES ('d1', 'theme', 'dark')",
                [],
            )
            .unwrap();

        connection
            .execute("DELETE FROM dashboards WHERE id = 'd1'", [])
            .unwrap();

        let count: i64 = connection
            .query_row(
                "SELECT COUNT(*) FROM workspace_settings WHERE dashboard_id = 'd1'",
                [],
                |row| row.get(0),
            )
            .unwrap();

        assert_eq!(count, 0, "Workspace settings should cascade on dashboard delete");
    }

    #[test]
    fn workspace_setting_foreign_key_rejects_invalid_dashboard() {
        let connection = setup_test_database();

        let result = connection.execute(
            "INSERT INTO workspace_settings (dashboard_id, key, value) VALUES ('nonexistent', 'theme', 'dark')",
            [],
        );

        assert!(result.is_err(), "Invalid dashboard_id should be rejected");
    }

    #[test]
    fn workspace_overridden_keys_returns_only_keys() {
        let connection = setup_test_database();
        insert_dashboard(&connection, "d1");

        connection
            .execute(
                "INSERT INTO workspace_settings (dashboard_id, key, value) VALUES ('d1', 'theme', 'dark')",
                [],
            )
            .unwrap();
        connection
            .execute(
                "INSERT INTO workspace_settings (dashboard_id, key, value) VALUES ('d1', 'font_size', '14')",
                [],
            )
            .unwrap();

        let mut statement = connection
            .prepare("SELECT key FROM workspace_settings WHERE dashboard_id = 'd1' ORDER BY key")
            .unwrap();
        let keys: Vec<String> = statement
            .query_map([], |row| row.get(0))
            .unwrap()
            .collect::<Result<Vec<_>, _>>()
            .unwrap();

        assert_eq!(keys, vec!["font_size", "theme"]);
    }

    // ─── Cascade resolution tests ────────────────────────────────────────────

    #[test]
    fn resolved_setting_returns_workspace_over_user() {
        let connection = setup_test_database();
        insert_dashboard(&connection, "d1");

        connection.execute(
            "INSERT INTO user_settings (key, value) VALUES ('theme', 'light')", [],
        ).unwrap();
        connection.execute(
            "INSERT INTO workspace_settings (dashboard_id, key, value) VALUES ('d1', 'theme', 'dark')", [],
        ).unwrap();

        let result = super::resolve_setting_cascade(&connection, "theme", Some("d1")).unwrap();
        assert_eq!(result, Some("dark".to_string()));
    }

    #[test]
    fn resolved_setting_falls_back_to_user_when_no_workspace_override() {
        let connection = setup_test_database();
        insert_dashboard(&connection, "d1");

        connection.execute(
            "INSERT INTO user_settings (key, value) VALUES ('theme', 'light')", [],
        ).unwrap();

        let result = super::resolve_setting_cascade(&connection, "theme", Some("d1")).unwrap();
        assert_eq!(result, Some("light".to_string()));
    }

    #[test]
    fn resolved_setting_returns_none_when_nothing_set() {
        let connection = setup_test_database();

        let result = super::resolve_setting_cascade(&connection, "nonexistent", None).unwrap();
        assert_eq!(result, None);
    }

    #[test]
    fn resolved_setting_without_dashboard_returns_user_value() {
        let connection = setup_test_database();

        connection.execute(
            "INSERT INTO user_settings (key, value) VALUES ('theme', 'system')", [],
        ).unwrap();

        let result = super::resolve_setting_cascade(&connection, "theme", None).unwrap();
        assert_eq!(result, Some("system".to_string()));
    }

    // ─── Bulk set tests ─────────────────────────────────────────────────────

    #[test]
    fn bulk_set_user_settings_inserts_all_entries() {
        let connection = setup_test_database();
        let mut entries = std::collections::HashMap::new();
        entries.insert("a".to_string(), "1".to_string());
        entries.insert("b".to_string(), "2".to_string());

        let transaction = connection.unchecked_transaction().unwrap();
        for (key, value) in &entries {
            transaction.execute(
                "INSERT OR REPLACE INTO user_settings (key, value) VALUES (?1, ?2)",
                rusqlite::params![key, value],
            ).unwrap();
        }
        transaction.commit().unwrap();

        let count: i64 = connection
            .query_row("SELECT COUNT(*) FROM user_settings", [], |row| row.get(0))
            .unwrap();
        assert_eq!(count, 2);
    }

    #[test]
    fn bulk_set_user_settings_is_atomic_on_failure() {
        let connection = setup_test_database();

        connection.execute(
            "INSERT INTO user_settings (key, value) VALUES ('existing', 'old')", [],
        ).unwrap();

        let transaction = connection.unchecked_transaction().unwrap();
        transaction.execute(
            "INSERT OR REPLACE INTO user_settings (key, value) VALUES ('existing', 'new')",
            [],
        ).unwrap();
        drop(transaction); // rollback

        let value: String = connection
            .query_row("SELECT value FROM user_settings WHERE key = 'existing'", [], |row| row.get(0))
            .unwrap();
        assert_eq!(value, "old");
    }
}
