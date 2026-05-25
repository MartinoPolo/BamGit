#[cfg(test)]
mod tests {
    use rusqlite::Connection;

    use crate::database::test_helpers::setup_test_database;

    // --- Schema tests ---

    #[test]
    fn all_tables_are_created() {
        let connection = setup_test_database();

        let expected_tables = [
            "color_palettes",
            "dashboards",
            "issues",
            "issue_dependencies",
            "label_shape_mappings",
            "sessions",
            "actions",
            "notification_config",
            "git_status_cache",
            "keyboard_shortcuts",
            "window_workspace_bindings",
            "user_settings",
            "workspace_settings",
            "session_metrics",
            "turn_metrics",
            "tool_usage",
            "achievements",
            "import_history",
            "workspace_commands",
            "model_pricing_cache",
            "character_packs",
            "character_event_sounds",
            "sound_volume_overrides",
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
    fn dashboard_type_check_constraint_rejects_portfolio() {
        let connection = setup_test_database();

        let result = connection.execute(
            "INSERT INTO dashboards (id, name, type) VALUES ('d1', 'Test', 'portfolio')",
            [],
        );

        assert!(
            result.is_err(),
            "Dashboard type 'portfolio' should be rejected"
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

        for (index, priority) in ["lowest", "low", "medium", "high", "top"].iter().enumerate() {
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

    // --- Worktree state v6 CHECK constraint tests ---

    #[test]
    fn worktree_state_check_accepts_removing() {
        let connection = setup_test_database();
        insert_test_dashboard(&connection, "d1", "repo");

        let result = connection.execute(
            "INSERT INTO issues (id, dashboard_id, name, worktree_state) VALUES ('i1', 'd1', 'Test', 'removing')",
            [],
        );

        assert!(result.is_ok(), "worktree_state 'removing' should be accepted");
    }

    #[test]
    fn worktree_state_check_accepts_removed() {
        let connection = setup_test_database();
        insert_test_dashboard(&connection, "d1", "repo");

        let result = connection.execute(
            "INSERT INTO issues (id, dashboard_id, name, worktree_state) VALUES ('i1', 'd1', 'Test', 'removed')",
            [],
        );

        assert!(result.is_ok(), "worktree_state 'removed' should be accepted");
    }

    #[test]
    fn worktree_state_check_still_rejects_invalid() {
        let connection = setup_test_database();
        insert_test_dashboard(&connection, "d1", "repo");

        let result = connection.execute(
            "INSERT INTO issues (id, dashboard_id, name, worktree_state) VALUES ('i1', 'd1', 'Test', 'bogus')",
            [],
        );

        assert!(result.is_err(), "worktree_state 'bogus' should be rejected");
    }

    // --- PR state v6 CHECK constraint tests ---

    #[test]
    fn pr_state_check_accepts_all_valid_values() {
        let connection = setup_test_database();
        insert_test_dashboard(&connection, "d1", "repo");
        insert_test_issue(&connection, "i1", "d1", "Feature");

        let valid_states = [
            "draft",
            "open",
            "review-requested",
            "changes-requested",
            "approved",
            "ready-to-merge",
            "merged",
            "closed",
        ];

        for (index, pr_state) in valid_states.iter().enumerate() {
            let issue_id = format!("pr{index}");
            insert_test_issue(&connection, &issue_id, "d1", "PR test");

            let result = connection.execute(
                "INSERT INTO git_status_cache (issue_id, pr_state) VALUES (?1, ?2)",
                rusqlite::params![issue_id, pr_state],
            );
            assert!(result.is_ok(), "pr_state '{pr_state}' should be accepted");
        }
    }

    #[test]
    fn pr_state_check_rejects_invalid() {
        let connection = setup_test_database();
        insert_test_dashboard(&connection, "d1", "repo");
        insert_test_issue(&connection, "i1", "d1", "Feature");

        let result = connection.execute(
            "INSERT INTO git_status_cache (issue_id, pr_state) VALUES ('i1', 'invalid')",
            [],
        );

        assert!(result.is_err(), "pr_state 'invalid' should be rejected");
    }

    #[test]
    fn pr_state_check_allows_null() {
        let connection = setup_test_database();
        insert_test_dashboard(&connection, "d1", "repo");
        insert_test_issue(&connection, "i1", "d1", "Feature");

        let result = connection.execute(
            "INSERT INTO git_status_cache (issue_id, pr_state) VALUES ('i1', NULL)",
            [],
        );

        assert!(result.is_ok(), "pr_state NULL should be accepted");
    }

    // --- Execution phase v6 tests ---

    #[test]
    fn execution_phase_defaults_to_none() {
        let connection = setup_test_database();

        connection
            .execute(
                "INSERT INTO sessions (id, state) VALUES ('s1', 'running')",
                [],
            )
            .unwrap();

        let execution_phase: String = connection
            .query_row(
                "SELECT execution_phase FROM sessions WHERE id = 's1'",
                [],
                |row| row.get(0),
            )
            .unwrap();

        assert_eq!(execution_phase, "none");
    }

    #[test]
    fn execution_phase_accepts_all_valid_values() {
        let connection = setup_test_database();

        let valid_phases = [
            "none",
            "analyzing",
            "tdd",
            "reviewing",
            "verifying",
            "committing",
        ];

        for (index, phase) in valid_phases.iter().enumerate() {
            let id = format!("s{index}");
            let result = connection.execute(
                "INSERT INTO sessions (id, state, execution_phase) VALUES (?1, 'running', ?2)",
                rusqlite::params![id, phase],
            );
            assert!(result.is_ok(), "execution_phase '{phase}' should be accepted");
        }
    }

    #[test]
    fn execution_phase_rejects_invalid() {
        let connection = setup_test_database();

        let result = connection.execute(
            "INSERT INTO sessions (id, state, execution_phase) VALUES ('s1', 'running', 'building')",
            [],
        );

        assert!(result.is_err(), "execution_phase 'building' should be rejected");
    }

    // --- Idempotency tests ---

    #[test]
    fn create_tables_idempotent() {
        let connection = Connection::open_in_memory().unwrap();
        connection.execute_batch("PRAGMA foreign_keys = ON;").unwrap();
        crate::database::schema::create_tables(&connection).unwrap();
        crate::database::schema::create_tables(&connection).unwrap();
    }

    #[test]
    fn seed_defaults_idempotent() {
        let connection = setup_test_database();
        crate::database::defaults::seed_defaults(&connection).unwrap();

        let count_before: i64 = connection.query_row(
            "SELECT COUNT(*) FROM notification_config", [], |r| r.get(0)
        ).unwrap();

        crate::database::defaults::seed_defaults(&connection).unwrap();

        let count_after: i64 = connection.query_row(
            "SELECT COUNT(*) FROM notification_config", [], |r| r.get(0)
        ).unwrap();

        assert_eq!(count_before, count_after, "seed_defaults should be idempotent");
    }

    // --- Metrics cascade tests ---

    #[test]
    fn delete_session_cascades_to_session_metrics() {
        let connection = setup_test_database();
        connection.execute("INSERT INTO sessions (id, state) VALUES ('s1', 'finished')", []).unwrap();
        connection.execute(
            "INSERT INTO session_metrics (session_id, provider, started_at) VALUES ('s1', 'claude-code', '2026-01-01')",
            [],
        ).unwrap();
        connection.execute("DELETE FROM sessions WHERE id = 's1'", []).unwrap();
        let count: i64 = connection.query_row(
            "SELECT COUNT(*) FROM session_metrics WHERE session_id = 's1'", [], |r| r.get(0)
        ).unwrap();
        assert_eq!(count, 0, "Deleting session should cascade to session_metrics");
    }

    #[test]
    fn delete_session_cascades_to_turn_metrics() {
        let connection = setup_test_database();
        connection.execute("INSERT INTO sessions (id, state) VALUES ('s1', 'finished')", []).unwrap();
        connection.execute(
            "INSERT INTO turn_metrics (id, session_id, turn_index, timestamp) VALUES ('t1', 's1', 0, '2026-01-01')",
            [],
        ).unwrap();
        connection.execute("DELETE FROM sessions WHERE id = 's1'", []).unwrap();
        let count: i64 = connection.query_row(
            "SELECT COUNT(*) FROM turn_metrics WHERE session_id = 's1'", [], |r| r.get(0)
        ).unwrap();
        assert_eq!(count, 0, "Deleting session should cascade to turn_metrics");
    }

    #[test]
    fn delete_session_cascades_to_tool_usage() {
        let connection = setup_test_database();
        connection.execute("INSERT INTO sessions (id, state) VALUES ('s1', 'finished')", []).unwrap();
        connection.execute(
            "INSERT INTO tool_usage (id, session_id, tool_name, timestamp) VALUES ('tu1', 's1', 'Read', '2026-01-01')",
            [],
        ).unwrap();
        connection.execute("DELETE FROM sessions WHERE id = 's1'", []).unwrap();
        let count: i64 = connection.query_row(
            "SELECT COUNT(*) FROM tool_usage WHERE session_id = 's1'", [], |r| r.get(0)
        ).unwrap();
        assert_eq!(count, 0, "Deleting session should cascade to tool_usage");
    }

    // --- workspace_commands constraint tests ---

    #[test]
    fn workspace_commands_category_accepts_valid_values() {
        let connection = setup_test_database();
        insert_test_dashboard(&connection, "d1", "repo");
        for (idx, category) in ["server", "check"].iter().enumerate() {
            let id = format!("wc{idx}");
            let result = connection.execute(
                "INSERT INTO workspace_commands (id, dashboard_id, category, name, command) VALUES (?1, 'd1', ?2, 'test', 'echo')",
                rusqlite::params![id, category],
            );
            assert!(result.is_ok(), "Category '{category}' should be accepted");
        }
    }

    #[test]
    fn workspace_commands_category_rejects_invalid() {
        let connection = setup_test_database();
        insert_test_dashboard(&connection, "d1", "repo");
        let result = connection.execute(
            "INSERT INTO workspace_commands (id, dashboard_id, category, name, command) VALUES ('wc1', 'd1', 'invalid', 'test', 'echo')",
            [],
        );
        assert!(result.is_err(), "Invalid category should be rejected");
    }

    // --- workspace_commands mode constraint tests ---

    #[test]
    fn workspace_commands_mode_accepts_valid_values() {
        let connection = setup_test_database();
        insert_test_dashboard(&connection, "d1", "repo");
        for (idx, mode) in ["headless", "terminal"].iter().enumerate() {
            let id = format!("wc-mode-{idx}");
            let result = connection.execute(
                "INSERT INTO workspace_commands (id, dashboard_id, category, name, command, mode) VALUES (?1, 'd1', 'server', 'test', 'echo', ?2)",
                rusqlite::params![id, mode],
            );
            assert!(result.is_ok(), "Mode '{mode}' should be accepted");
        }
    }

    #[test]
    fn workspace_commands_mode_rejects_invalid() {
        let connection = setup_test_database();
        insert_test_dashboard(&connection, "d1", "repo");
        let result = connection.execute(
            "INSERT INTO workspace_commands (id, dashboard_id, category, name, command, mode) VALUES ('wc1', 'd1', 'server', 'test', 'echo', 'embedded')",
            [],
        );
        assert!(result.is_err(), "Invalid mode should be rejected");
    }

    #[test]
    fn workspace_commands_mode_defaults_to_headless() {
        let connection = setup_test_database();
        insert_test_dashboard(&connection, "d1", "repo");
        connection.execute(
            "INSERT INTO workspace_commands (id, dashboard_id, category, name, command) VALUES ('wc1', 'd1', 'server', 'test', 'echo')",
            [],
        ).unwrap();
        let mode: String = connection.query_row(
            "SELECT mode FROM workspace_commands WHERE id = 'wc1'", [], |r| r.get(0)
        ).unwrap();
        assert_eq!(mode, "headless");
    }

    // --- workspace_commands restart_policy constraint tests ---

    #[test]
    fn workspace_commands_restart_policy_accepts_valid_values() {
        let connection = setup_test_database();
        insert_test_dashboard(&connection, "d1", "repo");
        for (idx, policy) in ["never", "on_failure", "always"].iter().enumerate() {
            let id = format!("wc-rp-{idx}");
            let result = connection.execute(
                "INSERT INTO workspace_commands (id, dashboard_id, category, name, command, restart_policy) VALUES (?1, 'd1', 'server', 'test', 'echo', ?2)",
                rusqlite::params![id, policy],
            );
            assert!(result.is_ok(), "Restart policy '{policy}' should be accepted");
        }
    }

    #[test]
    fn workspace_commands_restart_policy_rejects_invalid() {
        let connection = setup_test_database();
        insert_test_dashboard(&connection, "d1", "repo");
        let result = connection.execute(
            "INSERT INTO workspace_commands (id, dashboard_id, category, name, command, restart_policy) VALUES ('wc1', 'd1', 'server', 'test', 'echo', 'retry')",
            [],
        );
        assert!(result.is_err(), "Invalid restart_policy should be rejected");
    }

    #[test]
    fn workspace_commands_restart_policy_defaults_to_never() {
        let connection = setup_test_database();
        insert_test_dashboard(&connection, "d1", "repo");
        connection.execute(
            "INSERT INTO workspace_commands (id, dashboard_id, category, name, command) VALUES ('wc1', 'd1', 'server', 'test', 'echo')",
            [],
        ).unwrap();
        let policy: String = connection.query_row(
            "SELECT restart_policy FROM workspace_commands WHERE id = 'wc1'", [], |r| r.get(0)
        ).unwrap();
        assert_eq!(policy, "never");
    }

    // --- workspace_commands timeout_seconds tests ---

    #[test]
    fn workspace_commands_timeout_seconds_accepts_null_and_integer() {
        let connection = setup_test_database();
        insert_test_dashboard(&connection, "d1", "repo");
        // Insert with null (default)
        connection.execute(
            "INSERT INTO workspace_commands (id, dashboard_id, category, name, command) VALUES ('wc-null', 'd1', 'server', 'test', 'echo')",
            [],
        ).unwrap();
        let timeout: Option<i64> = connection.query_row(
            "SELECT timeout_seconds FROM workspace_commands WHERE id = 'wc-null'", [], |r| r.get(0)
        ).unwrap();
        assert_eq!(timeout, None);

        // Insert with explicit value
        connection.execute(
            "INSERT INTO workspace_commands (id, dashboard_id, category, name, command, timeout_seconds) VALUES ('wc-30', 'd1', 'server', 'test', 'echo', 30)",
            [],
        ).unwrap();
        let timeout: Option<i64> = connection.query_row(
            "SELECT timeout_seconds FROM workspace_commands WHERE id = 'wc-30'", [], |r| r.get(0)
        ).unwrap();
        assert_eq!(timeout, Some(30));
    }

    // --- model_pricing_cache constraint tests ---

    #[test]
    fn model_pricing_cache_source_accepts_valid_values() {
        let connection = setup_test_database();
        for (idx, source) in ["user", "litellm", "openrouter"].iter().enumerate() {
            let id = format!("model-{idx}");
            let result = connection.execute(
                "INSERT INTO model_pricing_cache (model_id, input_cost_per_token, output_cost_per_token, source) VALUES (?1, 0.001, 0.002, ?2)",
                rusqlite::params![id, source],
            );
            assert!(result.is_ok(), "Source '{source}' should be accepted");
        }
    }

    #[test]
    fn model_pricing_cache_source_rejects_invalid() {
        let connection = setup_test_database();
        let result = connection.execute(
            "INSERT INTO model_pricing_cache (model_id, input_cost_per_token, output_cost_per_token, source) VALUES ('m1', 0.001, 0.002, 'invalid')",
            [],
        );
        assert!(result.is_err(), "Invalid source should be rejected");
    }

    // --- character_packs constraint tests ---

    #[test]
    fn character_packs_unique_name_constraint() {
        let connection = setup_test_database();
        connection.execute(
            "INSERT INTO character_packs (id, name, display_name) VALUES ('cp1', 'grove', 'Grove')",
            [],
        ).unwrap();
        let result = connection.execute(
            "INSERT INTO character_packs (id, name, display_name) VALUES ('cp2', 'grove', 'Grove Duplicate')",
            [],
        );
        assert!(result.is_err(), "Duplicate character pack name should be rejected");
    }

    #[test]
    fn character_event_sounds_cascade_on_pack_delete() {
        let connection = setup_test_database();
        connection.execute(
            "INSERT INTO character_packs (id, name, display_name) VALUES ('cp1', 'grove', 'Grove')",
            [],
        ).unwrap();
        connection.execute(
            "INSERT INTO character_event_sounds (id, character_pack_id, event_type, sound_file) VALUES ('ces1', 'cp1', 'session_start', 'start.wav')",
            [],
        ).unwrap();
        connection.execute("DELETE FROM character_packs WHERE id = 'cp1'", []).unwrap();
        let count: i64 = connection.query_row(
            "SELECT COUNT(*) FROM character_event_sounds WHERE character_pack_id = 'cp1'", [], |r| r.get(0)
        ).unwrap();
        assert_eq!(count, 0, "Deleting character pack should cascade to event sounds");
    }

    // --- Session FK tests ---

    #[test]
    fn session_allows_null_issue_id() {
        let connection = setup_test_database();
        let result = connection.execute(
            "INSERT INTO sessions (id, state, issue_id) VALUES ('s1', 'running', NULL)",
            [],
        );
        assert!(result.is_ok(), "Session with NULL issue_id should be accepted");
    }

    #[test]
    fn session_rejects_invalid_issue_id() {
        let connection = setup_test_database();
        let result = connection.execute(
            "INSERT INTO sessions (id, state, issue_id) VALUES ('s1', 'running', 'nonexistent')",
            [],
        );
        assert!(result.is_err(), "Session with invalid issue_id should be rejected by FK constraint");
    }

    #[test]
    fn delete_issue_nullifies_session_issue_id() {
        let connection = setup_test_database();
        insert_test_dashboard(&connection, "d1", "repo");
        insert_test_issue(&connection, "i1", "d1", "Issue with session");
        connection
            .execute(
                "INSERT INTO sessions (id, state, issue_id) VALUES ('s1', 'running', 'i1')",
                [],
            )
            .unwrap();

        connection
            .execute("DELETE FROM issues WHERE id = 'i1'", [])
            .unwrap();

        let issue_id: Option<String> = connection
            .query_row(
                "SELECT issue_id FROM sessions WHERE id = 's1'",
                [],
                |row| row.get(0),
            )
            .unwrap();
        assert_eq!(issue_id, None, "Session issue_id should be NULL after issue deletion");
    }

    // --- Dashboard status constraint tests ---

    #[test]
    fn dashboard_status_defaults_to_active() {
        let connection = setup_test_database();
        connection.execute(
            "INSERT INTO dashboards (id, name, type) VALUES ('d1', 'Test', 'repo')",
            [],
        ).unwrap();
        let status: String = connection.query_row(
            "SELECT status FROM dashboards WHERE id = 'd1'", [], |r| r.get(0)
        ).unwrap();
        assert_eq!(status, "active");
    }

    #[test]
    fn dashboard_status_accepts_all_valid_values() {
        let connection = setup_test_database();
        for (idx, status) in ["active", "archived", "deleted"].iter().enumerate() {
            let id = format!("d{idx}");
            let result = connection.execute(
                "INSERT INTO dashboards (id, name, type, status) VALUES (?1, 'Test', 'repo', ?2)",
                rusqlite::params![id, status],
            );
            assert!(result.is_ok(), "Dashboard status '{status}' should be accepted");
        }
    }

    #[test]
    fn dashboard_status_rejects_invalid() {
        let connection = setup_test_database();
        let result = connection.execute(
            "INSERT INTO dashboards (id, name, type, status) VALUES ('d1', 'Test', 'repo', 'suspended')",
            [],
        );
        assert!(result.is_err(), "Invalid dashboard status should be rejected");
    }

    // --- git_status_cache FK tests ---

    #[test]
    fn delete_issue_cascades_git_status_cache() {
        let connection = setup_test_database();
        insert_test_dashboard(&connection, "d1", "repo");
        insert_test_issue(&connection, "i1", "d1", "Issue with cache");
        connection
            .execute(
                "INSERT INTO git_status_cache (issue_id, branch_status) VALUES ('i1', 'active')",
                [],
            )
            .unwrap();

        connection
            .execute("DELETE FROM issues WHERE id = 'i1'", [])
            .unwrap();

        let count: i64 = connection
            .query_row(
                "SELECT COUNT(*) FROM git_status_cache WHERE issue_id = 'i1'",
                [],
                |r| r.get(0),
            )
            .unwrap();
        assert_eq!(count, 0, "git_status_cache should cascade on issue delete");
    }

    #[test]
    fn delete_issue_with_sessions_and_cache_succeeds() {
        let connection = setup_test_database();
        insert_test_dashboard(&connection, "d1", "repo");
        insert_test_issue(&connection, "i1", "d1", "Issue with deps");

        connection
            .execute(
                "INSERT INTO sessions (id, state, issue_id) VALUES ('s1', 'finished', 'i1')",
                [],
            )
            .unwrap();
        connection
            .execute(
                "INSERT INTO git_status_cache (issue_id, branch_status) VALUES ('i1', 'active')",
                [],
            )
            .unwrap();

        connection
            .execute("DELETE FROM issues WHERE id = 'i1'", [])
            .unwrap();

        let session_issue: Option<String> = connection
            .query_row("SELECT issue_id FROM sessions WHERE id = 's1'", [], |r| {
                r.get(0)
            })
            .unwrap();
        assert_eq!(session_issue, None, "Session issue_id should be NULLed");

        let cache_count: i64 = connection
            .query_row(
                "SELECT COUNT(*) FROM git_status_cache WHERE issue_id = 'i1'",
                [],
                |r| r.get(0),
            )
            .unwrap();
        assert_eq!(cache_count, 0, "git_status_cache should be cascade-deleted");
    }

}
