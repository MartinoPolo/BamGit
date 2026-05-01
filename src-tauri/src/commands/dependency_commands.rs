use rusqlite::{Connection, Row};
use tauri::State;
use uuid::Uuid;

use crate::database::connection::DatabaseState;
use crate::models::issue_dependency::IssueDependency;

fn row_to_dependency(row: &Row) -> Result<IssueDependency, rusqlite::Error> {
    Ok(IssueDependency {
        id: row.get(0)?,
        blocker_issue_id: row.get(1)?,
        blocked_issue_id: row.get(2)?,
    })
}

pub fn get_dependencies_for_dashboard_with_connection(
    connection: &Connection,
    dashboard_id: &str,
) -> Result<Vec<IssueDependency>, String> {
    let mut statement = connection
        .prepare(
            "SELECT d.id, d.blocker_issue_id, d.blocked_issue_id \
             FROM issue_dependencies d \
             JOIN issues i ON d.blocker_issue_id = i.id \
             WHERE i.dashboard_id = ?1",
        )
        .map_err(|error| format!("Failed to prepare query: {error}"))?;

    let results = statement
        .query_map([dashboard_id], |row| row_to_dependency(row))
        .map_err(|error| format!("Failed to query dependencies: {error}"))?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|error| format!("Failed to read dependency row: {error}"))?;
    Ok(results)
}

pub fn upsert_dependency(
    connection: &Connection,
    blocker_issue_id: &str,
    blocked_issue_id: &str,
) -> Result<IssueDependency, String> {
    let id = Uuid::new_v4().to_string();

    connection
        .execute(
            "INSERT OR IGNORE INTO issue_dependencies (id, blocker_issue_id, blocked_issue_id) \
             VALUES (?1, ?2, ?3)",
            rusqlite::params![id, blocker_issue_id, blocked_issue_id],
        )
        .map_err(|error| format!("Failed to upsert dependency: {error}"))?;

    connection
        .query_row(
            "SELECT id, blocker_issue_id, blocked_issue_id FROM issue_dependencies \
             WHERE blocker_issue_id = ?1 AND blocked_issue_id = ?2",
            rusqlite::params![blocker_issue_id, blocked_issue_id],
            |row| row_to_dependency(row),
        )
        .map_err(|error| format!("Failed to read upserted dependency: {error}"))
}

/// Atomically replaces all dependencies for a dashboard.
/// Scoped to issues whose blocker OR blocked side belongs to the dashboard.
pub fn replace_dependencies_for_dashboard(
    connection: &Connection,
    dashboard_id: &str,
    edges: &[(String, String)],
) -> Result<Vec<IssueDependency>, String> {
    let transaction = connection
        .unchecked_transaction()
        .map_err(|error| format!("Failed to start transaction: {error}"))?;

    transaction
        .execute(
            "DELETE FROM issue_dependencies WHERE blocker_issue_id IN \
             (SELECT id FROM issues WHERE dashboard_id = ?1) \
             OR blocked_issue_id IN \
             (SELECT id FROM issues WHERE dashboard_id = ?1)",
            rusqlite::params![dashboard_id],
        )
        .map_err(|error| format!("Failed to clear dependencies: {error}"))?;

    let mut results = Vec::with_capacity(edges.len());
    for (blocker_id, blocked_id) in edges {
        let id = Uuid::new_v4().to_string();
        transaction
            .execute(
                "INSERT OR IGNORE INTO issue_dependencies (id, blocker_issue_id, blocked_issue_id) \
                 VALUES (?1, ?2, ?3)",
                rusqlite::params![id, blocker_id, blocked_id],
            )
            .map_err(|error| format!("Failed to insert dependency: {error}"))?;

        let dep = transaction
            .query_row(
                "SELECT id, blocker_issue_id, blocked_issue_id FROM issue_dependencies \
                 WHERE blocker_issue_id = ?1 AND blocked_issue_id = ?2",
                rusqlite::params![blocker_id, blocked_id],
                |row| row_to_dependency(row),
            )
            .map_err(|error| format!("Failed to read dependency: {error}"))?;
        results.push(dep);
    }

    transaction
        .commit()
        .map_err(|error| format!("Failed to commit transaction: {error}"))?;

    Ok(results)
}

#[tauri::command]
pub fn get_issue_dependencies(
    state: State<DatabaseState>,
    dashboard_id: String,
) -> Result<Vec<IssueDependency>, String> {
    let connection = state.read()?;
    get_dependencies_for_dashboard_with_connection(&connection, &dashboard_id)
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::database::test_helpers::setup_test_database;

    fn insert_dashboard(connection: &Connection, id: &str) {
        connection
            .execute(
                "INSERT INTO dashboards (id, name, type) VALUES (?1, 'Test', 'repo')",
                [id],
            )
            .unwrap();
    }

    fn insert_issue(connection: &Connection, id: &str, dashboard_id: &str) {
        connection
            .execute(
                "INSERT INTO issues (id, dashboard_id, name) VALUES (?1, ?2, ?3)",
                rusqlite::params![id, dashboard_id, format!("Issue {id}")],
            )
            .unwrap();
    }

    #[test]
    fn upsert_creates_dependency() {
        let connection = setup_test_database();
        insert_dashboard(&connection, "d1");
        insert_issue(&connection, "i1", "d1");
        insert_issue(&connection, "i2", "d1");

        let dependency = upsert_dependency(&connection, "i1", "i2").unwrap();
        assert_eq!(dependency.blocker_issue_id, "i1");
        assert_eq!(dependency.blocked_issue_id, "i2");
    }

    #[test]
    fn upsert_is_idempotent() {
        let connection = setup_test_database();
        insert_dashboard(&connection, "d1");
        insert_issue(&connection, "i1", "d1");
        insert_issue(&connection, "i2", "d1");

        let first = upsert_dependency(&connection, "i1", "i2").unwrap();
        let second = upsert_dependency(&connection, "i1", "i2").unwrap();
        assert_eq!(first.id, second.id);
    }

    #[test]
    fn get_dependencies_returns_all_for_dashboard() {
        let connection = setup_test_database();
        insert_dashboard(&connection, "d1");
        insert_issue(&connection, "i1", "d1");
        insert_issue(&connection, "i2", "d1");
        insert_issue(&connection, "i3", "d1");

        upsert_dependency(&connection, "i1", "i2").unwrap();
        upsert_dependency(&connection, "i1", "i3").unwrap();

        let deps = get_dependencies_for_dashboard_with_connection(&connection, "d1").unwrap();
        assert_eq!(deps.len(), 2);
    }

    #[test]
    fn get_dependencies_excludes_other_dashboards() {
        let connection = setup_test_database();
        insert_dashboard(&connection, "d1");
        insert_dashboard(&connection, "d2");
        insert_issue(&connection, "i1", "d1");
        insert_issue(&connection, "i2", "d1");
        insert_issue(&connection, "i3", "d2");
        insert_issue(&connection, "i4", "d2");

        upsert_dependency(&connection, "i1", "i2").unwrap();
        upsert_dependency(&connection, "i3", "i4").unwrap();

        let d1_deps = get_dependencies_for_dashboard_with_connection(&connection, "d1").unwrap();
        assert_eq!(d1_deps.len(), 1);
        assert_eq!(d1_deps[0].blocker_issue_id, "i1");
    }

    #[test]
    fn get_dependencies_returns_empty_when_none_exist() {
        let connection = setup_test_database();
        insert_dashboard(&connection, "d1");
        insert_issue(&connection, "i1", "d1");

        let deps = get_dependencies_for_dashboard_with_connection(&connection, "d1").unwrap();
        assert!(deps.is_empty());
    }

    #[test]
    fn cascade_deletes_dependencies_when_issue_deleted() {
        let connection = setup_test_database();
        insert_dashboard(&connection, "d1");
        insert_issue(&connection, "i1", "d1");
        insert_issue(&connection, "i2", "d1");

        upsert_dependency(&connection, "i1", "i2").unwrap();

        connection
            .execute("DELETE FROM issues WHERE id = 'i1'", [])
            .unwrap();

        let deps = get_dependencies_for_dashboard_with_connection(&connection, "d1").unwrap();
        assert!(deps.is_empty());
    }

    #[test]
    fn cascade_deletes_dependencies_when_blocked_issue_deleted() {
        let connection = setup_test_database();
        insert_dashboard(&connection, "d1");
        insert_issue(&connection, "i1", "d1");
        insert_issue(&connection, "i2", "d1");

        upsert_dependency(&connection, "i1", "i2").unwrap();

        connection
            .execute("DELETE FROM issues WHERE id = 'i2'", [])
            .unwrap();

        let deps = get_dependencies_for_dashboard_with_connection(&connection, "d1").unwrap();
        assert!(deps.is_empty());
    }

    #[test]
    fn replace_clears_and_reinserts() {
        let connection = setup_test_database();
        insert_dashboard(&connection, "d1");
        insert_issue(&connection, "i1", "d1");
        insert_issue(&connection, "i2", "d1");
        insert_issue(&connection, "i3", "d1");

        upsert_dependency(&connection, "i1", "i2").unwrap();

        let new_edges = vec![("i2".to_string(), "i3".to_string())];
        let results = replace_dependencies_for_dashboard(&connection, "d1", &new_edges).unwrap();

        assert_eq!(results.len(), 1);
        assert_eq!(results[0].blocker_issue_id, "i2");
        assert_eq!(results[0].blocked_issue_id, "i3");

        let all_deps = get_dependencies_for_dashboard_with_connection(&connection, "d1").unwrap();
        assert_eq!(all_deps.len(), 1);
    }

    #[test]
    fn cross_dashboard_dependency_with_join_returns_via_blocker_dashboard() {
        let connection = setup_test_database();
        insert_dashboard(&connection, "d1");
        insert_dashboard(&connection, "d2");
        insert_issue(&connection, "i1", "d1");
        insert_issue(&connection, "i2", "d2");

        upsert_dependency(&connection, "i1", "i2").unwrap();

        let d1_deps = get_dependencies_for_dashboard_with_connection(&connection, "d1").unwrap();
        assert_eq!(d1_deps.len(), 1, "Should return when blocker is in queried dashboard");

        let d2_deps = get_dependencies_for_dashboard_with_connection(&connection, "d2").unwrap();
        assert_eq!(d2_deps.len(), 0, "Should not return when only blocked is in queried dashboard");
    }
}
