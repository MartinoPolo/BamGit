#[cfg(test)]
mod tests {
    use rusqlite::Connection;

    use crate::database::migrations;
    use crate::database::schema;

    fn setup_test_database() -> Connection {
        let connection = Connection::open_in_memory().unwrap();
        connection
            .execute_batch("PRAGMA foreign_keys = ON;")
            .unwrap();
        schema::create_tables(&connection).unwrap();
        connection
    }

    // --- Migration tests ---

    #[test]
    fn migration_sets_schema_version_to_one() {
        let connection = Connection::open_in_memory().unwrap();
        migrations::run_migrations(&connection).unwrap();

        let version = migrations::get_schema_version(&connection).unwrap();
        assert_eq!(version, 1);
    }

    #[test]
    fn migration_is_idempotent() {
        let connection = Connection::open_in_memory().unwrap();
        migrations::run_migrations(&connection).unwrap();
        migrations::run_migrations(&connection).unwrap();

        let version = migrations::get_schema_version(&connection).unwrap();
        assert_eq!(version, 1);
    }

    // --- Schema tests ---

    #[test]
    fn all_seven_tables_are_created() {
        let connection = setup_test_database();

        let expected_tables = [
            "color_palettes",
            "dashboards",
            "issues",
            "sessions",
            "actions",
            "notification_config",
            "git_status_cache",
        ];

        for table_name in &expected_tables {
            let exists: bool = connection
                .query_row(
                    "SELECT EXISTS(SELECT 1 FROM sqlite_master WHERE type='table' AND name=?1)",
                    [table_name],
                    |row| row.get(0),
                )
                .unwrap();
            assert!(exists, "Table '{table_name}' should exist");
        }
    }

    #[test]
    fn dashboard_type_check_constraint_rejects_invalid_values() {
        let connection = setup_test_database();

        let result = connection.execute(
            "INSERT INTO dashboards (id, name, type) VALUES ('d1', 'Test', 'invalid')",
            [],
        );

        assert!(result.is_err(), "Invalid dashboard type should be rejected");
    }

    #[test]
    fn dashboard_type_check_constraint_accepts_repo() {
        let connection = setup_test_database();

        let result = connection.execute(
            "INSERT INTO dashboards (id, name, type) VALUES ('d1', 'Test', 'repo')",
            [],
        );

        assert!(result.is_ok(), "Dashboard type 'repo' should be accepted");
    }

    #[test]
    fn dashboard_type_check_constraint_accepts_portfolio() {
        let connection = setup_test_database();

        let result = connection.execute(
            "INSERT INTO dashboards (id, name, type) VALUES ('d1', 'Test', 'portfolio')",
            [],
        );

        assert!(
            result.is_ok(),
            "Dashboard type 'portfolio' should be accepted"
        );
    }

    #[test]
    fn issue_foreign_key_rejects_invalid_dashboard_id() {
        let connection = setup_test_database();

        let result = connection.execute(
            "INSERT INTO issues (id, dashboard_id, name) VALUES ('i1', 'nonexistent', 'Test Issue')",
            [],
        );

        assert!(
            result.is_err(),
            "Issue with invalid dashboard_id should be rejected"
        );
    }

    #[test]
    fn issue_foreign_key_accepts_valid_dashboard_id() {
        let connection = setup_test_database();

        connection
            .execute(
                "INSERT INTO dashboards (id, name, type) VALUES ('d1', 'Test', 'repo')",
                [],
            )
            .unwrap();

        let result = connection.execute(
            "INSERT INTO issues (id, dashboard_id, name) VALUES ('i1', 'd1', 'Test Issue')",
            [],
        );

        assert!(
            result.is_ok(),
            "Issue with valid dashboard_id should be accepted"
        );
    }

    #[test]
    fn issue_status_check_constraint_rejects_invalid_values() {
        let connection = setup_test_database();

        connection
            .execute(
                "INSERT INTO dashboards (id, name, type) VALUES ('d1', 'Test', 'repo')",
                [],
            )
            .unwrap();

        let result = connection.execute(
            "INSERT INTO issues (id, dashboard_id, name, status) VALUES ('i1', 'd1', 'Test', 'deleted')",
            [],
        );

        assert!(
            result.is_err(),
            "Invalid issue status should be rejected"
        );
    }

    #[test]
    fn session_state_check_constraint_rejects_invalid_values() {
        let connection = setup_test_database();

        let result = connection.execute(
            "INSERT INTO sessions (id, state) VALUES ('s1', 'invalid')",
            [],
        );

        assert!(
            result.is_err(),
            "Invalid session state should be rejected"
        );
    }

    #[test]
    fn session_state_check_constraint_accepts_all_valid_states() {
        let connection = setup_test_database();

        let valid_states = [
            "running",
            "needs-input",
            "needs-review",
            "paused",
            "finished",
            "errored",
        ];

        for (index, state) in valid_states.iter().enumerate() {
            let id = format!("s{index}");
            let result = connection.execute(
                "INSERT INTO sessions (id, state) VALUES (?1, ?2)",
                rusqlite::params![id, state],
            );
            assert!(result.is_ok(), "Session state '{state}' should be accepted");
        }
    }

    // --- Dashboard CRUD tests ---

    #[test]
    fn dashboard_crud_round_trip() {
        let connection = setup_test_database();

        // Create
        connection
            .execute(
                "INSERT INTO dashboards (id, name, type, github_repo) VALUES ('d1', 'My Repo', 'repo', 'user/repo')",
                [],
            )
            .unwrap();

        // Read
        let (name, dashboard_type, github_repo): (String, String, Option<String>) = connection
            .query_row(
                "SELECT name, type, github_repo FROM dashboards WHERE id = 'd1'",
                [],
                |row| Ok((row.get(0)?, row.get(1)?, row.get(2)?)),
            )
            .unwrap();

        assert_eq!(name, "My Repo");
        assert_eq!(dashboard_type, "repo");
        assert_eq!(github_repo.as_deref(), Some("user/repo"));

        // Update
        connection
            .execute(
                "UPDATE dashboards SET name = 'Updated Repo' WHERE id = 'd1'",
                [],
            )
            .unwrap();

        let updated_name: String = connection
            .query_row(
                "SELECT name FROM dashboards WHERE id = 'd1'",
                [],
                |row| row.get(0),
            )
            .unwrap();
        assert_eq!(updated_name, "Updated Repo");

        // Delete
        let rows_affected = connection
            .execute("DELETE FROM dashboards WHERE id = 'd1'", [])
            .unwrap();
        assert_eq!(rows_affected, 1);

        let count: i64 = connection
            .query_row("SELECT COUNT(*) FROM dashboards", [], |row| row.get(0))
            .unwrap();
        assert_eq!(count, 0);
    }

    #[test]
    fn issue_worktree_state_defaults_to_none() {
        let connection = setup_test_database();

        connection
            .execute(
                "INSERT INTO dashboards (id, name, type) VALUES ('d1', 'Test', 'repo')",
                [],
            )
            .unwrap();

        connection
            .execute(
                "INSERT INTO issues (id, dashboard_id, name) VALUES ('i1', 'd1', 'Test Issue')",
                [],
            )
            .unwrap();

        let worktree_state: String = connection
            .query_row(
                "SELECT worktree_state FROM issues WHERE id = 'i1'",
                [],
                |row| row.get(0),
            )
            .unwrap();

        assert_eq!(worktree_state, "none");
    }

    #[test]
    fn issue_status_defaults_to_active() {
        let connection = setup_test_database();

        connection
            .execute(
                "INSERT INTO dashboards (id, name, type) VALUES ('d1', 'Test', 'repo')",
                [],
            )
            .unwrap();

        connection
            .execute(
                "INSERT INTO issues (id, dashboard_id, name) VALUES ('i1', 'd1', 'Test Issue')",
                [],
            )
            .unwrap();

        let status: String = connection
            .query_row(
                "SELECT status FROM issues WHERE id = 'i1'",
                [],
                |row| row.get(0),
            )
            .unwrap();

        assert_eq!(status, "active");
    }
}
