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
    fn migration_sets_schema_version_to_current() {
        let connection = Connection::open_in_memory().unwrap();
        migrations::run_migrations(&connection).unwrap();

        let version = migrations::get_schema_version(&connection).unwrap();
        assert_eq!(version, 4);
    }

    #[test]
    fn migration_is_idempotent() {
        let connection = Connection::open_in_memory().unwrap();
        migrations::run_migrations(&connection).unwrap();
        migrations::run_migrations(&connection).unwrap();

        let version = migrations::get_schema_version(&connection).unwrap();
        assert_eq!(version, 4);
    }

    // --- Schema tests ---

    #[test]
    fn all_eight_tables_are_created() {
        let connection = setup_test_database();

        let expected_tables = [
            "color_palettes",
            "dashboards",
            "issues",
            "sessions",
            "actions",
            "notification_config",
            "git_status_cache",
            "portfolio_dashboard_pointers",
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

    // --- Issue CRUD tests ---

    fn insert_test_dashboard(connection: &Connection, id: &str, dashboard_type: &str) {
        connection
            .execute(
                "INSERT INTO dashboards (id, name, type) VALUES (?1, ?2, ?3)",
                rusqlite::params![id, format!("Dashboard {id}"), dashboard_type],
            )
            .unwrap();
    }

    fn insert_test_issue(connection: &Connection, id: &str, dashboard_id: &str, name: &str) {
        connection
            .execute(
                "INSERT INTO issues (id, dashboard_id, name) VALUES (?1, ?2, ?3)",
                rusqlite::params![id, dashboard_id, name],
            )
            .unwrap();
    }

    #[test]
    fn issue_crud_round_trip() {
        let connection = setup_test_database();
        insert_test_dashboard(&connection, "d1", "repo");

        // Create
        connection
            .execute(
                "INSERT INTO issues (id, dashboard_id, name, priority, color) VALUES ('i1', 'd1', 'Fix bug', 'high', '#ff0000')",
                [],
            )
            .unwrap();

        // Read
        let (name, priority, color, status): (String, Option<String>, Option<String>, String) =
            connection
                .query_row(
                    "SELECT name, priority, color, status FROM issues WHERE id = 'i1'",
                    [],
                    |row| Ok((row.get(0)?, row.get(1)?, row.get(2)?, row.get(3)?)),
                )
                .unwrap();

        assert_eq!(name, "Fix bug");
        assert_eq!(priority.as_deref(), Some("high"));
        assert_eq!(color.as_deref(), Some("#ff0000"));
        assert_eq!(status, "active");

        // Update
        connection
            .execute(
                "UPDATE issues SET name = 'Fix critical bug', priority = 'top' WHERE id = 'i1'",
                [],
            )
            .unwrap();

        let updated_name: String = connection
            .query_row("SELECT name FROM issues WHERE id = 'i1'", [], |row| {
                row.get(0)
            })
            .unwrap();
        assert_eq!(updated_name, "Fix critical bug");

        // Delete
        let rows_affected = connection
            .execute("DELETE FROM issues WHERE id = 'i1'", [])
            .unwrap();
        assert_eq!(rows_affected, 1);
    }

    #[test]
    fn issue_sort_order_defaults_to_zero() {
        let connection = setup_test_database();
        insert_test_dashboard(&connection, "d1", "repo");
        insert_test_issue(&connection, "i1", "d1", "Test");

        let sort_order: i64 = connection
            .query_row("SELECT sort_order FROM issues WHERE id = 'i1'", [], |row| {
                row.get(0)
            })
            .unwrap();

        assert_eq!(sort_order, 0);
    }

    #[test]
    fn issue_sort_order_persists_and_orders_correctly() {
        let connection = setup_test_database();
        insert_test_dashboard(&connection, "d1", "repo");

        connection
            .execute(
                "INSERT INTO issues (id, dashboard_id, name, sort_order) VALUES ('i1', 'd1', 'Third', 3)",
                [],
            )
            .unwrap();
        connection
            .execute(
                "INSERT INTO issues (id, dashboard_id, name, sort_order) VALUES ('i2', 'd1', 'First', 1)",
                [],
            )
            .unwrap();
        connection
            .execute(
                "INSERT INTO issues (id, dashboard_id, name, sort_order) VALUES ('i3', 'd1', 'Second', 2)",
                [],
            )
            .unwrap();

        let mut statement = connection
            .prepare("SELECT name FROM issues WHERE dashboard_id = 'd1' ORDER BY sort_order")
            .unwrap();
        let names: Vec<String> = statement
            .query_map([], |row| row.get(0))
            .unwrap()
            .collect::<Result<Vec<_>, _>>()
            .unwrap();

        assert_eq!(names, vec!["First", "Second", "Third"]);
    }

    #[test]
    fn issue_priority_constraint_accepts_all_valid_values() {
        let connection = setup_test_database();
        insert_test_dashboard(&connection, "d1", "repo");

        for (index, priority) in ["low", "medium", "high", "top"].iter().enumerate() {
            let id = format!("i{index}");
            let result = connection.execute(
                "INSERT INTO issues (id, dashboard_id, name, priority) VALUES (?1, 'd1', 'Test', ?2)",
                rusqlite::params![id, priority],
            );
            assert!(result.is_ok(), "Priority '{priority}' should be accepted");
        }
    }

    #[test]
    fn issue_priority_constraint_rejects_invalid_value() {
        let connection = setup_test_database();
        insert_test_dashboard(&connection, "d1", "repo");

        let result = connection.execute(
            "INSERT INTO issues (id, dashboard_id, name, priority) VALUES ('i1', 'd1', 'Test', 'urgent')",
            [],
        );

        assert!(result.is_err(), "Invalid priority should be rejected");
    }

    #[test]
    fn issue_archive_and_unarchive() {
        let connection = setup_test_database();
        insert_test_dashboard(&connection, "d1", "repo");
        insert_test_issue(&connection, "i1", "d1", "Test");

        // Archive
        connection
            .execute(
                "UPDATE issues SET status = 'archived' WHERE id = 'i1'",
                [],
            )
            .unwrap();

        let status: String = connection
            .query_row("SELECT status FROM issues WHERE id = 'i1'", [], |row| {
                row.get(0)
            })
            .unwrap();
        assert_eq!(status, "archived");

        // Unarchive
        connection
            .execute(
                "UPDATE issues SET status = 'active' WHERE id = 'i1'",
                [],
            )
            .unwrap();

        let status: String = connection
            .query_row("SELECT status FROM issues WHERE id = 'i1'", [], |row| {
                row.get(0)
            })
            .unwrap();
        assert_eq!(status, "active");
    }

    #[test]
    fn issue_archived_filter_excludes_archived() {
        let connection = setup_test_database();
        insert_test_dashboard(&connection, "d1", "repo");
        insert_test_issue(&connection, "i1", "d1", "Active Issue");

        connection
            .execute(
                "INSERT INTO issues (id, dashboard_id, name, status) VALUES ('i2', 'd1', 'Archived Issue', 'archived')",
                [],
            )
            .unwrap();

        // Without archived
        let count: i64 = connection
            .query_row(
                "SELECT COUNT(*) FROM issues WHERE dashboard_id = 'd1' AND status = 'active'",
                [],
                |row| row.get(0),
            )
            .unwrap();
        assert_eq!(count, 1);

        // With archived
        let count: i64 = connection
            .query_row(
                "SELECT COUNT(*) FROM issues WHERE dashboard_id = 'd1'",
                [],
                |row| row.get(0),
            )
            .unwrap();
        assert_eq!(count, 2);
    }

    #[test]
    fn issue_parent_child_foreign_key_valid() {
        let connection = setup_test_database();
        insert_test_dashboard(&connection, "d1", "repo");
        insert_test_issue(&connection, "i1", "d1", "Parent");

        let result = connection.execute(
            "INSERT INTO issues (id, dashboard_id, name, parent_issue_id) VALUES ('i2', 'd1', 'Child', 'i1')",
            [],
        );

        assert!(result.is_ok(), "Valid parent_issue_id should be accepted");
    }

    #[test]
    fn issue_parent_child_foreign_key_invalid() {
        let connection = setup_test_database();
        insert_test_dashboard(&connection, "d1", "repo");

        let result = connection.execute(
            "INSERT INTO issues (id, dashboard_id, name, parent_issue_id) VALUES ('i1', 'd1', 'Orphan', 'nonexistent')",
            [],
        );

        assert!(
            result.is_err(),
            "Invalid parent_issue_id should be rejected"
        );
    }

    #[test]
    fn delete_parent_issue_nullifies_child_parent_id() {
        let connection = setup_test_database();
        insert_test_dashboard(&connection, "d1", "repo");
        insert_test_issue(&connection, "i1", "d1", "Parent");

        connection
            .execute(
                "INSERT INTO issues (id, dashboard_id, name, parent_issue_id) VALUES ('i2', 'd1', 'Child', 'i1')",
                [],
            )
            .unwrap();

        connection
            .execute("DELETE FROM issues WHERE id = 'i1'", [])
            .unwrap();

        let parent_id: Option<String> = connection
            .query_row(
                "SELECT parent_issue_id FROM issues WHERE id = 'i2'",
                [],
                |row| row.get(0),
            )
            .unwrap();

        assert_eq!(parent_id, None, "Deleting parent should nullify child's parent_issue_id");
    }

    #[test]
    fn delete_dashboard_cascades_to_issues() {
        let connection = setup_test_database();
        insert_test_dashboard(&connection, "d1", "repo");
        insert_test_issue(&connection, "i1", "d1", "Issue 1");
        insert_test_issue(&connection, "i2", "d1", "Issue 2");

        connection
            .execute("DELETE FROM dashboards WHERE id = 'd1'", [])
            .unwrap();

        let count: i64 = connection
            .query_row(
                "SELECT COUNT(*) FROM issues WHERE dashboard_id = 'd1'",
                [],
                |row| row.get(0),
            )
            .unwrap();

        assert_eq!(count, 0, "Deleting dashboard should cascade to issues");
    }

    // --- Portfolio pointer tests ---

    #[test]
    fn portfolio_pointer_crud_round_trip() {
        let connection = setup_test_database();
        insert_test_dashboard(&connection, "p1", "portfolio");
        insert_test_dashboard(&connection, "r1", "repo");

        // Create
        connection
            .execute(
                "INSERT INTO portfolio_dashboard_pointers (id, portfolio_dashboard_id, repo_dashboard_id) VALUES ('ptr1', 'p1', 'r1')",
                [],
            )
            .unwrap();

        // Read
        let repo_id: String = connection
            .query_row(
                "SELECT repo_dashboard_id FROM portfolio_dashboard_pointers WHERE id = 'ptr1'",
                [],
                |row| row.get(0),
            )
            .unwrap();
        assert_eq!(repo_id, "r1");

        // Delete
        let rows_affected = connection
            .execute(
                "DELETE FROM portfolio_dashboard_pointers WHERE id = 'ptr1'",
                [],
            )
            .unwrap();
        assert_eq!(rows_affected, 1);
    }

    #[test]
    fn portfolio_pointer_rejects_invalid_dashboard_ids() {
        let connection = setup_test_database();

        let result = connection.execute(
            "INSERT INTO portfolio_dashboard_pointers (id, portfolio_dashboard_id, repo_dashboard_id) VALUES ('ptr1', 'bad1', 'bad2')",
            [],
        );

        assert!(result.is_err(), "Invalid dashboard IDs should be rejected");
    }

    #[test]
    fn portfolio_pointer_unique_constraint() {
        let connection = setup_test_database();
        insert_test_dashboard(&connection, "p1", "portfolio");
        insert_test_dashboard(&connection, "r1", "repo");

        connection
            .execute(
                "INSERT INTO portfolio_dashboard_pointers (id, portfolio_dashboard_id, repo_dashboard_id) VALUES ('ptr1', 'p1', 'r1')",
                [],
            )
            .unwrap();

        let result = connection.execute(
            "INSERT INTO portfolio_dashboard_pointers (id, portfolio_dashboard_id, repo_dashboard_id) VALUES ('ptr2', 'p1', 'r1')",
            [],
        );

        assert!(
            result.is_err(),
            "Duplicate portfolio-repo pair should be rejected"
        );
    }

    #[test]
    fn delete_dashboard_cascades_to_portfolio_pointers() {
        let connection = setup_test_database();
        insert_test_dashboard(&connection, "p1", "portfolio");
        insert_test_dashboard(&connection, "r1", "repo");

        connection
            .execute(
                "INSERT INTO portfolio_dashboard_pointers (id, portfolio_dashboard_id, repo_dashboard_id) VALUES ('ptr1', 'p1', 'r1')",
                [],
            )
            .unwrap();

        connection
            .execute("DELETE FROM dashboards WHERE id = 'p1'", [])
            .unwrap();

        let count: i64 = connection
            .query_row(
                "SELECT COUNT(*) FROM portfolio_dashboard_pointers",
                [],
                |row| row.get(0),
            )
            .unwrap();

        assert_eq!(count, 0, "Deleting portfolio should cascade to pointers");
    }

    // --- Migration v2 tests ---

    #[test]
    fn migration_v2_adds_sort_order_and_portfolio_table() {
        let connection = Connection::open_in_memory().unwrap();
        connection
            .execute_batch("PRAGMA foreign_keys = ON;")
            .unwrap();
        migrations::run_migrations(&connection).unwrap();

        let version = migrations::get_schema_version(&connection).unwrap();
        assert_eq!(version, 4);

        // portfolio_dashboard_pointers table exists
        let exists: bool = connection
            .query_row(
                "SELECT EXISTS(SELECT 1 FROM sqlite_master WHERE type='table' AND name='portfolio_dashboard_pointers')",
                [],
                |row| row.get(0),
            )
            .unwrap();
        assert!(exists, "portfolio_dashboard_pointers table should exist");
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

    // --- Git status cache tests ---

    #[test]
    fn git_status_cache_crud_round_trip() {
        let connection = setup_test_database();
        insert_test_dashboard(&connection, "d1", "repo");
        insert_test_issue(&connection, "i1", "d1", "Feature branch");

        // Insert
        connection
            .execute(
                "INSERT INTO git_status_cache (issue_id, branch_status, behind_base_count, merge_conflict, fetched_at) \
                 VALUES ('i1', 'active', 3, 0, datetime('now'))",
                [],
            )
            .unwrap();

        // Read
        let (branch_status, behind_count, merge_conflict): (
            Option<String>,
            Option<i64>,
            Option<bool>,
        ) = connection
            .query_row(
                "SELECT branch_status, behind_base_count, merge_conflict FROM git_status_cache WHERE issue_id = 'i1'",
                [],
                |row| Ok((row.get(0)?, row.get(1)?, row.get(2)?)),
            )
            .unwrap();

        assert_eq!(branch_status.as_deref(), Some("active"));
        assert_eq!(behind_count, Some(3));
        assert_eq!(merge_conflict, Some(false));

        // Update
        connection
            .execute(
                "UPDATE git_status_cache SET branch_status = 'remote-gone', behind_base_count = 5 WHERE issue_id = 'i1'",
                [],
            )
            .unwrap();

        let updated_status: String = connection
            .query_row(
                "SELECT branch_status FROM git_status_cache WHERE issue_id = 'i1'",
                [],
                |row| row.get(0),
            )
            .unwrap();
        assert_eq!(updated_status, "remote-gone");

        // Delete
        let rows_affected = connection
            .execute("DELETE FROM git_status_cache WHERE issue_id = 'i1'", [])
            .unwrap();
        assert_eq!(rows_affected, 1);
    }

    #[test]
    fn git_status_cache_rejects_invalid_issue_id() {
        let connection = setup_test_database();

        let result = connection.execute(
            "INSERT INTO git_status_cache (issue_id, branch_status) VALUES ('nonexistent', 'active')",
            [],
        );

        assert!(
            result.is_err(),
            "git_status_cache should reject invalid issue_id"
        );
    }

    #[test]
    fn git_status_cache_upsert_updates_existing_row() {
        let connection = setup_test_database();
        insert_test_dashboard(&connection, "d1", "repo");
        insert_test_issue(&connection, "i1", "d1", "Feature");

        // First insert
        connection
            .execute(
                "INSERT INTO git_status_cache (issue_id, branch_status, behind_base_count) \
                 VALUES ('i1', 'active', 2)",
                [],
            )
            .unwrap();

        // Upsert
        connection
            .execute(
                "INSERT INTO git_status_cache (issue_id, branch_status, behind_base_count, fetched_at) \
                 VALUES ('i1', 'local', 5, datetime('now')) \
                 ON CONFLICT(issue_id) DO UPDATE SET \
                    branch_status = excluded.branch_status, \
                    behind_base_count = excluded.behind_base_count, \
                    fetched_at = excluded.fetched_at",
                [],
            )
            .unwrap();

        let (status, count): (String, i64) = connection
            .query_row(
                "SELECT branch_status, behind_base_count FROM git_status_cache WHERE issue_id = 'i1'",
                [],
                |row| Ok((row.get(0)?, row.get(1)?)),
            )
            .unwrap();

        assert_eq!(status, "local");
        assert_eq!(count, 5);

        // Should still be one row
        let row_count: i64 = connection
            .query_row(
                "SELECT COUNT(*) FROM git_status_cache WHERE issue_id = 'i1'",
                [],
                |row| row.get(0),
            )
            .unwrap();
        assert_eq!(row_count, 1);
    }

    #[test]
    fn git_status_cache_returns_only_issues_with_branch_name() {
        let connection = setup_test_database();
        insert_test_dashboard(&connection, "d1", "repo");
        insert_test_issue(&connection, "i1", "d1", "With branch");
        insert_test_issue(&connection, "i2", "d1", "No branch");

        // Set branch_name only on i1
        connection
            .execute(
                "UPDATE issues SET branch_name = 'feature-x' WHERE id = 'i1'",
                [],
            )
            .unwrap();

        // Add cache entries for both
        connection
            .execute(
                "INSERT INTO git_status_cache (issue_id, branch_status) VALUES ('i1', 'active')",
                [],
            )
            .unwrap();
        connection
            .execute(
                "INSERT INTO git_status_cache (issue_id, branch_status) VALUES ('i2', 'unknown')",
                [],
            )
            .unwrap();

        // Query with branch_name filter
        let mut statement = connection
            .prepare(
                "SELECT g.issue_id FROM git_status_cache g \
                 JOIN issues i ON g.issue_id = i.id \
                 WHERE i.dashboard_id = 'd1' AND i.branch_name IS NOT NULL",
            )
            .unwrap();

        let ids: Vec<String> = statement
            .query_map([], |row| row.get(0))
            .unwrap()
            .collect::<Result<Vec<_>, _>>()
            .unwrap();

        assert_eq!(ids, vec!["i1"]);
    }

    // --- Migration v3 tests ---

    #[test]
    fn migration_v3_adds_session_source_and_working_directory() {
        let connection = Connection::open_in_memory().unwrap();
        connection
            .execute_batch("PRAGMA foreign_keys = ON;")
            .unwrap();
        migrations::run_migrations(&connection).unwrap();

        // source column exists with default 'spawned'
        connection
            .execute(
                "INSERT INTO sessions (id, state) VALUES ('s1', 'running')",
                [],
            )
            .unwrap();

        let source: String = connection
            .query_row(
                "SELECT source FROM sessions WHERE id = 's1'",
                [],
                |row| row.get(0),
            )
            .unwrap();
        assert_eq!(source, "spawned");

        // working_directory is nullable
        let working_directory: Option<String> = connection
            .query_row(
                "SELECT working_directory FROM sessions WHERE id = 's1'",
                [],
                |row| row.get(0),
            )
            .unwrap();
        assert_eq!(working_directory, None);
    }

    #[test]
    fn session_source_check_constraint_accepts_valid_values() {
        let connection = setup_test_database();

        for (index, source) in ["spawned", "adopted"].iter().enumerate() {
            let id = format!("s{index}");
            let result = connection.execute(
                "INSERT INTO sessions (id, state, source) VALUES (?1, 'running', ?2)",
                rusqlite::params![id, source],
            );
            assert!(result.is_ok(), "Source '{source}' should be accepted");
        }
    }

    #[test]
    fn session_source_check_constraint_rejects_invalid_value() {
        let connection = setup_test_database();

        let result = connection.execute(
            "INSERT INTO sessions (id, state, source) VALUES ('s1', 'running', 'external')",
            [],
        );

        assert!(result.is_err(), "Invalid source should be rejected");
    }

    // --- Action CRUD tests ---

    fn insert_test_action(
        connection: &Connection,
        id: &str,
        dashboard_id: Option<&str>,
        name: &str,
        command_template: &str,
    ) {
        connection
            .execute(
                "INSERT INTO actions (id, dashboard_id, name, command_template) VALUES (?1, ?2, ?3, ?4)",
                rusqlite::params![id, dashboard_id, name, command_template],
            )
            .unwrap();
    }

    #[test]
    fn action_crud_round_trip() {
        let connection = setup_test_database();
        insert_test_dashboard(&connection, "d1", "repo");

        // Create
        connection
            .execute(
                "INSERT INTO actions (id, dashboard_id, name, icon, command_template, sort_order, visible) \
                 VALUES ('a1', 'd1', 'Execute', 'play', 'claude \"/mp-execute #42\"', 0, 1)",
                [],
            )
            .unwrap();

        // Read
        let (name, icon, command_template, sort_order, visible): (
            String,
            Option<String>,
            String,
            i64,
            bool,
        ) = connection
            .query_row(
                "SELECT name, icon, command_template, sort_order, visible FROM actions WHERE id = 'a1'",
                [],
                |row| Ok((row.get(0)?, row.get(1)?, row.get(2)?, row.get(3)?, row.get(4)?)),
            )
            .unwrap();

        assert_eq!(name, "Execute");
        assert_eq!(icon.as_deref(), Some("play"));
        assert_eq!(command_template, "claude \"/mp-execute #42\"");
        assert_eq!(sort_order, 0);
        assert!(visible);

        // Update
        connection
            .execute(
                "UPDATE actions SET name = 'Run', icon = 'rocket' WHERE id = 'a1'",
                [],
            )
            .unwrap();

        let updated_name: String = connection
            .query_row("SELECT name FROM actions WHERE id = 'a1'", [], |row| {
                row.get(0)
            })
            .unwrap();
        assert_eq!(updated_name, "Run");

        // Delete
        let rows_affected = connection
            .execute("DELETE FROM actions WHERE id = 'a1'", [])
            .unwrap();
        assert_eq!(rows_affected, 1);
    }

    #[test]
    fn action_sort_order_defaults_to_zero() {
        let connection = setup_test_database();
        insert_test_dashboard(&connection, "d1", "repo");
        insert_test_action(&connection, "a1", Some("d1"), "Test", "echo hello");

        let sort_order: i64 = connection
            .query_row("SELECT sort_order FROM actions WHERE id = 'a1'", [], |row| {
                row.get(0)
            })
            .unwrap();

        assert_eq!(sort_order, 0);
    }

    #[test]
    fn action_visible_defaults_to_true() {
        let connection = setup_test_database();
        insert_test_dashboard(&connection, "d1", "repo");
        insert_test_action(&connection, "a1", Some("d1"), "Test", "echo hello");

        let visible: bool = connection
            .query_row("SELECT visible FROM actions WHERE id = 'a1'", [], |row| {
                row.get(0)
            })
            .unwrap();

        assert!(visible);
    }

    #[test]
    fn action_with_null_dashboard_id_is_global() {
        let connection = setup_test_database();

        // Global action (null dashboard_id)
        insert_test_action(&connection, "a1", None, "Global Action", "echo global");

        let dashboard_id: Option<String> = connection
            .query_row(
                "SELECT dashboard_id FROM actions WHERE id = 'a1'",
                [],
                |row| row.get(0),
            )
            .unwrap();

        assert_eq!(dashboard_id, None);
    }

    #[test]
    fn action_foreign_key_rejects_invalid_dashboard_id() {
        let connection = setup_test_database();

        let result = connection.execute(
            "INSERT INTO actions (id, dashboard_id, name, command_template) VALUES ('a1', 'nonexistent', 'Test', 'echo')",
            [],
        );

        assert!(
            result.is_err(),
            "Action with invalid dashboard_id should be rejected"
        );
    }

    #[test]
    fn action_sort_order_persists_and_orders_correctly() {
        let connection = setup_test_database();
        insert_test_dashboard(&connection, "d1", "repo");

        connection
            .execute(
                "INSERT INTO actions (id, dashboard_id, name, command_template, sort_order) VALUES ('a1', 'd1', 'Third', 'echo 3', 2)",
                [],
            )
            .unwrap();
        connection
            .execute(
                "INSERT INTO actions (id, dashboard_id, name, command_template, sort_order) VALUES ('a2', 'd1', 'First', 'echo 1', 0)",
                [],
            )
            .unwrap();
        connection
            .execute(
                "INSERT INTO actions (id, dashboard_id, name, command_template, sort_order) VALUES ('a3', 'd1', 'Second', 'echo 2', 1)",
                [],
            )
            .unwrap();

        let mut statement = connection
            .prepare("SELECT name FROM actions WHERE dashboard_id = 'd1' ORDER BY sort_order")
            .unwrap();
        let names: Vec<String> = statement
            .query_map([], |row| row.get(0))
            .unwrap()
            .collect::<Result<Vec<_>, _>>()
            .unwrap();

        assert_eq!(names, vec!["First", "Second", "Third"]);
    }

    #[test]
    fn delete_dashboard_cascades_to_actions() {
        let connection = setup_test_database();
        insert_test_dashboard(&connection, "d1", "repo");
        insert_test_action(&connection, "a1", Some("d1"), "Action 1", "echo 1");
        insert_test_action(&connection, "a2", Some("d1"), "Action 2", "echo 2");

        connection
            .execute("DELETE FROM dashboards WHERE id = 'd1'", [])
            .unwrap();

        let count: i64 = connection
            .query_row(
                "SELECT COUNT(*) FROM actions WHERE dashboard_id = 'd1'",
                [],
                |row| row.get(0),
            )
            .unwrap();

        assert_eq!(count, 0, "Deleting dashboard should cascade to actions");
    }

    #[test]
    fn global_actions_returned_alongside_dashboard_actions() {
        let connection = setup_test_database();
        insert_test_dashboard(&connection, "d1", "repo");

        // Global action
        insert_test_action(&connection, "a_global", None, "Global", "echo global");
        // Dashboard-specific action
        insert_test_action(&connection, "a_dash", Some("d1"), "Dashboard", "echo dash");

        let mut statement = connection
            .prepare(
                "SELECT name FROM actions WHERE dashboard_id IS NULL OR dashboard_id = 'd1' ORDER BY sort_order",
            )
            .unwrap();
        let names: Vec<String> = statement
            .query_map([], |row| row.get(0))
            .unwrap()
            .collect::<Result<Vec<_>, _>>()
            .unwrap();

        assert_eq!(names, vec!["Global", "Dashboard"]);
    }
}
