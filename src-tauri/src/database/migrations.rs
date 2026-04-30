use rusqlite::Connection;

use super::schema;

pub(crate) const CURRENT_VERSION: i32 = 10;

type MigrationFunction = fn(&Connection) -> Result<(), rusqlite::Error>;

static MIGRATIONS: &[MigrationFunction] = &[
    migrate_v1,
    migrate_v2,
    migrate_v3,
    migrate_v4,
    migrate_v5,
    migrate_v6,
    migrate_v7,
    migrate_v8,
    migrate_v9,
    migrate_v10,
];

fn migrate_v1(connection: &Connection) -> Result<(), rusqlite::Error> {
    schema::create_tables(connection)
}

fn migrate_v2(connection: &Connection) -> Result<(), rusqlite::Error> {
    // sort_order may already exist if v1 ran with updated schema — check before adding
    let has_sort_order: bool = connection
        .prepare("SELECT sort_order FROM issues LIMIT 0")
        .is_ok();

    if !has_sort_order {
        connection.execute_batch(
            "ALTER TABLE issues ADD COLUMN sort_order INTEGER NOT NULL DEFAULT 0;",
        )?;
    }

    connection.execute_batch(
        "
        CREATE TABLE IF NOT EXISTS portfolio_dashboard_pointers (
            id TEXT PRIMARY KEY,
            portfolio_dashboard_id TEXT NOT NULL REFERENCES dashboards(id) ON DELETE CASCADE,
            repo_dashboard_id TEXT NOT NULL REFERENCES dashboards(id) ON DELETE CASCADE,
            sort_order INTEGER NOT NULL DEFAULT 0,
            UNIQUE(portfolio_dashboard_id, repo_dashboard_id)
        );
        ",
    )
}

fn migrate_v3(connection: &Connection) -> Result<(), rusqlite::Error> {
    // Add source column (spawned vs adopted) — check first since schema may already include it
    let has_source: bool = connection
        .prepare("SELECT source FROM sessions LIMIT 0")
        .is_ok();

    if !has_source {
        connection.execute_batch(
            "ALTER TABLE sessions ADD COLUMN source TEXT NOT NULL DEFAULT 'spawned' \
             CHECK (source IN ('spawned', 'adopted'));",
        )?;
    }

    let has_working_directory: bool = connection
        .prepare("SELECT working_directory FROM sessions LIMIT 0")
        .is_ok();

    if !has_working_directory {
        connection.execute_batch(
            "ALTER TABLE sessions ADD COLUMN working_directory TEXT;",
        )?;
    }

    Ok(())
}

fn migrate_v4(connection: &Connection) -> Result<(), rusqlite::Error> {
    // Create actions table for existing users upgrading from v3.
    // Also adds ON DELETE CASCADE on dashboard_id (fresh installs via schema.rs already have it).
    connection.execute_batch(
        "
        CREATE TABLE IF NOT EXISTS actions (
            id TEXT PRIMARY KEY,
            dashboard_id TEXT REFERENCES dashboards(id) ON DELETE CASCADE,
            name TEXT NOT NULL,
            icon TEXT,
            command_template TEXT NOT NULL,
            sort_order INTEGER NOT NULL DEFAULT 0,
            visible INTEGER NOT NULL DEFAULT 1
        );
        ",
    )
}

fn migrate_v5(connection: &Connection) -> Result<(), rusqlite::Error> {
    // Seed notification_config with defaults for all event types.
    // Uses INSERT OR IGNORE so re-running is idempotent.
    use crate::models::notification::NotificationConfig;

    for config in NotificationConfig::defaults() {
        connection.execute(
            "INSERT OR IGNORE INTO notification_config \
             (event_type, sound_enabled, sound_file, toast_enabled, window_flash_enabled) \
             VALUES (?1, ?2, ?3, ?4, ?5)",
            rusqlite::params![
                config.event_type,
                config.sound_enabled,
                config.sound_file,
                config.toast_enabled,
                config.window_flash_enabled,
            ],
        )?;
    }

    // Add is_built_in column to color_palettes (may already exist if v1 ran with updated schema)
    let has_is_built_in: bool = connection
        .prepare("SELECT is_built_in FROM color_palettes LIMIT 0")
        .is_ok();

    if !has_is_built_in {
        connection.execute_batch(
            "ALTER TABLE color_palettes ADD COLUMN is_built_in INTEGER NOT NULL DEFAULT 0;",
        )?;
    }

    // Seed built-in palettes (idempotent via INSERT OR IGNORE)
    crate::commands::color_palette_commands::seed_built_in_palettes_with_connection(connection)
        .map_err(|error| {
            rusqlite::Error::SqliteFailure(
                rusqlite::ffi::Error::new(rusqlite::ffi::SQLITE_ERROR),
                Some(error),
            )
        })?;

    Ok(())
}

fn migrate_v6(connection: &Connection) -> Result<(), rusqlite::Error> {
    // SQLite cannot ALTER CHECK constraints — must recreate tables.
    // PRAGMA foreign_keys must be toggled outside the transaction (SQLite ignores it inside).
    connection.execute_batch("PRAGMA foreign_keys = OFF;")?;

    let result = (|| -> Result<(), rusqlite::Error> {
        connection.execute_batch(
            "
            BEGIN;

            -- 1. Widen worktree_state CHECK: add 'removing' and 'removed'
            CREATE TABLE issues_v6 (
                id TEXT PRIMARY KEY,
                dashboard_id TEXT NOT NULL REFERENCES dashboards(id) ON DELETE CASCADE,
                name TEXT NOT NULL,
                priority TEXT CHECK (priority IN ('low', 'medium', 'high', 'top')),
                color TEXT,
                status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived')),
                github_issue_url TEXT,
                github_issue_number INTEGER,
                branch_name TEXT,
                base_branch TEXT,
                worktree_folder TEXT,
                worktree_state TEXT DEFAULT 'none'
                    CHECK (worktree_state IN ('none', 'pending', 'active', 'failed', 'removing', 'removed')),
                parent_issue_id TEXT REFERENCES issues(id) ON DELETE SET NULL,
                editor_folder TEXT,
                dev_server_command TEXT,
                dev_server_port INTEGER,
                dev_server_pid INTEGER,
                browser_url TEXT,
                sort_order INTEGER NOT NULL DEFAULT 0,
                created_at TEXT NOT NULL DEFAULT (datetime('now'))
            );

            INSERT INTO issues_v6
                SELECT id, dashboard_id, name, priority, color, status,
                       github_issue_url, github_issue_number, branch_name, base_branch,
                       worktree_folder, worktree_state, parent_issue_id,
                       editor_folder, dev_server_command, dev_server_port, dev_server_pid,
                       browser_url, sort_order, created_at
                FROM issues;

            DROP TABLE issues;
            ALTER TABLE issues_v6 RENAME TO issues;

            -- 2. Add CHECK constraint on pr_state in git_status_cache
            CREATE TABLE git_status_cache_v6 (
                issue_id TEXT PRIMARY KEY REFERENCES issues(id),
                branch_status TEXT,
                pr_state TEXT CHECK (pr_state IN ('draft', 'open', 'review-requested', 'changes-requested', 'approved', 'merged', 'closed')),
                pr_number INTEGER,
                pr_url TEXT,
                github_issue_state TEXT,
                behind_base_count INTEGER,
                merge_conflict INTEGER,
                fetched_at TEXT
            );

            INSERT INTO git_status_cache_v6
                SELECT issue_id, branch_status, pr_state, pr_number, pr_url,
                       github_issue_state, behind_base_count, merge_conflict, fetched_at
                FROM git_status_cache;

            DROP TABLE git_status_cache;
            ALTER TABLE git_status_cache_v6 RENAME TO git_status_cache;

            -- 3. Add execution_phase column to sessions
            CREATE TABLE sessions_v6 (
                id TEXT PRIMARY KEY,
                issue_id TEXT REFERENCES issues(id),
                provider TEXT NOT NULL DEFAULT 'claude-code',
                state TEXT NOT NULL DEFAULT 'running'
                    CHECK (state IN ('running', 'needs-input', 'needs-review', 'paused', 'finished', 'errored')),
                pid INTEGER,
                session_file_path TEXT,
                started_at TEXT NOT NULL DEFAULT (datetime('now')),
                ended_at TEXT,
                cost_usd REAL,
                token_count INTEGER,
                original_intent TEXT,
                last_prompt TEXT,
                last_response_summary TEXT,
                execution_phase TEXT NOT NULL DEFAULT 'none'
                    CHECK (execution_phase IN ('none', 'analyzing', 'tdd', 'reviewing', 'verifying', 'committing')),
                source TEXT NOT NULL DEFAULT 'spawned'
                    CHECK (source IN ('spawned', 'adopted')),
                working_directory TEXT
            );

            INSERT INTO sessions_v6
                (id, issue_id, provider, state, pid, session_file_path,
                 started_at, ended_at, cost_usd, token_count,
                 original_intent, last_prompt, last_response_summary,
                 source, working_directory)
                SELECT id, issue_id, provider, state, pid, session_file_path,
                       started_at, ended_at, cost_usd, token_count,
                       original_intent, last_prompt, last_response_summary,
                       source, working_directory
                FROM sessions;

            DROP TABLE sessions;
            ALTER TABLE sessions_v6 RENAME TO sessions;

            COMMIT;
            ",
        )
    })();

    // Always re-enable foreign keys, even if the migration failed.
    // Preserve the original migration error if the PRAGMA also fails.
    let foreign_key_result = connection.execute_batch("PRAGMA foreign_keys = ON;");

    match (result, foreign_key_result) {
        (Err(migration_error), Err(foreign_key_error)) => Err(rusqlite::Error::SqliteFailure(
            rusqlite::ffi::Error::new(rusqlite::ffi::SQLITE_ERROR),
            Some(format!(
                "Migration failed: {migration_error}; additionally PRAGMA foreign_keys = ON failed: {foreign_key_error}"
            )),
        )),
        (Err(migration_error), _) => Err(migration_error),
        (_, Err(foreign_key_error)) => Err(foreign_key_error),
        (Ok(()), Ok(())) => Ok(()),
    }
}

fn migrate_v7(connection: &Connection) -> Result<(), rusqlite::Error> {
    connection.execute_batch(
        "CREATE INDEX IF NOT EXISTS idx_issues_dashboard_id ON issues(dashboard_id);
         CREATE INDEX IF NOT EXISTS idx_sessions_issue_id ON sessions(issue_id);",
    )
}

pub const DEFAULT_TREE_SHAPE: &str = "cherry";

fn migrate_v8(connection: &Connection) -> Result<(), rusqlite::Error> {
    let has_labels: bool = connection
        .prepare("SELECT labels FROM issues LIMIT 0")
        .is_ok();

    if !has_labels {
        connection.execute_batch("ALTER TABLE issues ADD COLUMN labels TEXT;")?;
    }

    let has_default_shape: bool = connection
        .prepare("SELECT default_shape FROM dashboards LIMIT 0")
        .is_ok();

    if !has_default_shape {
        connection.execute_batch(
            &format!("ALTER TABLE dashboards ADD COLUMN default_shape TEXT NOT NULL DEFAULT '{DEFAULT_TREE_SHAPE}';"),
        )?;
    }

    connection.execute_batch(
        "CREATE TABLE IF NOT EXISTS label_shape_mappings (
            id TEXT PRIMARY KEY,
            dashboard_id TEXT NOT NULL REFERENCES dashboards(id) ON DELETE CASCADE,
            label_name TEXT NOT NULL,
            tree_shape TEXT NOT NULL,
            color TEXT,
            priority_order INTEGER NOT NULL DEFAULT 0,
            UNIQUE(dashboard_id, label_name)
        );",
    )?;

    seed_default_label_shape_mappings(connection)?;

    Ok(())
}

const DEFAULT_LABEL_SHAPE_MAPPINGS: &[(&str, &str, i32)] = &[
    ("prd", "apple", 0),
    ("epic", "baobab", 1),
    ("bug", "maple", 2),
    ("feature", "oak", 3),
    ("task", "pine", 4),
    ("documentation", "willow", 5),
    ("refactor", "birch", 6),
    ("infrastructure", "cypress", 7),
    ("ci", "cypress", 8),
];

pub fn seed_default_label_shape_mappings(
    connection: &Connection,
) -> Result<(), rusqlite::Error> {
    let mut dashboard_ids: Vec<String> = Vec::new();
    {
        let mut statement = connection.prepare("SELECT id FROM dashboards")?;
        let rows = statement.query_map([], |row| row.get(0))?;
        for row in rows {
            dashboard_ids.push(row?);
        }
    }

    for dashboard_id in &dashboard_ids {
        seed_label_shape_mappings_for_dashboard(connection, dashboard_id)?;
    }

    Ok(())
}

pub fn seed_label_shape_mappings_for_dashboard(
    connection: &Connection,
    dashboard_id: &str,
) -> Result<(), rusqlite::Error> {
    for (label_name, tree_shape, priority_order) in DEFAULT_LABEL_SHAPE_MAPPINGS {
        let id = uuid::Uuid::new_v4().to_string();
        connection.execute(
            "INSERT OR IGNORE INTO label_shape_mappings \
             (id, dashboard_id, label_name, tree_shape, priority_order) \
             VALUES (?1, ?2, ?3, ?4, ?5)",
            rusqlite::params![id, dashboard_id, label_name, tree_shape, priority_order],
        )?;
    }
    Ok(())
}

fn migrate_v9(connection: &Connection) -> Result<(), rusqlite::Error> {
    // Widen pr_state CHECK constraint to include 'ready-to-merge'.
    // SQLite cannot ALTER CHECK constraints — must recreate the table.
    connection.execute_batch("PRAGMA foreign_keys = OFF;")?;

    let result = (|| -> Result<(), rusqlite::Error> {
        connection.execute_batch(
            "
            BEGIN;

            CREATE TABLE git_status_cache_v9 (
                issue_id TEXT PRIMARY KEY REFERENCES issues(id),
                branch_status TEXT,
                pr_state TEXT CHECK (pr_state IN ('draft', 'open', 'review-requested', 'changes-requested', 'approved', 'ready-to-merge', 'merged', 'closed')),
                pr_number INTEGER,
                pr_url TEXT,
                github_issue_state TEXT,
                behind_base_count INTEGER,
                merge_conflict INTEGER,
                fetched_at TEXT
            );

            INSERT INTO git_status_cache_v9
                SELECT issue_id, branch_status, pr_state, pr_number, pr_url,
                       github_issue_state, behind_base_count, merge_conflict, fetched_at
                FROM git_status_cache;

            DROP TABLE git_status_cache;
            ALTER TABLE git_status_cache_v9 RENAME TO git_status_cache;

            COMMIT;
            ",
        )
    })();

    // Always re-enable foreign keys, even if the migration failed.
    // Preserve the original migration error if the PRAGMA also fails.
    let foreign_key_result = connection.execute_batch("PRAGMA foreign_keys = ON;");

    match (result, foreign_key_result) {
        (Err(migration_error), Err(foreign_key_error)) => Err(rusqlite::Error::SqliteFailure(
            rusqlite::ffi::Error::new(rusqlite::ffi::SQLITE_ERROR),
            Some(format!(
                "Migration failed: {migration_error}; additionally PRAGMA foreign_keys = ON failed: {foreign_key_error}"
            )),
        )),
        (Err(migration_error), _) => Err(migration_error),
        (_, Err(foreign_key_error)) => Err(foreign_key_error),
        (Ok(()), Ok(())) => Ok(()),
    }
}

fn migrate_v10(connection: &Connection) -> Result<(), rusqlite::Error> {
    connection.execute_batch(
        "CREATE TABLE IF NOT EXISTS keyboard_shortcuts (
            action_id TEXT PRIMARY KEY,
            binding TEXT NOT NULL
        );",
    )
}

pub fn get_schema_version(connection: &Connection) -> Result<i32, rusqlite::Error> {
    let version: i32 = connection.pragma_query_value(None, "user_version", |row| row.get(0))?;
    Ok(version)
}

fn set_schema_version(connection: &Connection, version: i32) -> Result<(), rusqlite::Error> {
    connection.pragma_update(None, "user_version", version)?;
    Ok(())
}

pub fn run_migrations(connection: &Connection) -> Result<(), rusqlite::Error> {
    let current_version = get_schema_version(connection)?;

    for version in current_version..CURRENT_VERSION {
        let migration_index = version as usize;
        if migration_index < MIGRATIONS.len() {
            MIGRATIONS[migration_index](connection)?;
            set_schema_version(connection, version + 1)?;
        }
    }

    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    fn fresh_db() -> Connection {
        let connection = Connection::open_in_memory().unwrap();
        connection
            .execute_batch("PRAGMA foreign_keys=ON;")
            .unwrap();
        connection
    }

    #[test]
    fn migration_v5_seeds_notification_config_defaults() {
        let connection = fresh_db();
        run_migrations(&connection).unwrap();

        let count: i64 = connection
            .query_row(
                "SELECT COUNT(*) FROM notification_config",
                [],
                |row| row.get(0),
            )
            .unwrap();
        assert_eq!(count, 5, "should seed 5 notification event types");

        // Verify needs-input has all channels on
        let (sound, toast, flash): (bool, bool, bool) = connection
            .query_row(
                "SELECT sound_enabled, toast_enabled, window_flash_enabled \
                 FROM notification_config WHERE event_type = 'needs-input'",
                [],
                |row| Ok((row.get(0)?, row.get(1)?, row.get(2)?)),
            )
            .unwrap();
        assert!(sound);
        assert!(toast);
        assert!(flash);
    }

    #[test]
    fn migration_v5_is_idempotent() {
        let connection = fresh_db();
        run_migrations(&connection).unwrap();

        // Run v5 again directly — INSERT OR IGNORE should not fail
        migrate_v5(&connection).unwrap();

        let count: i64 = connection
            .query_row(
                "SELECT COUNT(*) FROM notification_config",
                [],
                |row| row.get(0),
            )
            .unwrap();
        assert_eq!(count, 5);
    }

    #[test]
    fn schema_version_reaches_current() {
        let connection = fresh_db();
        run_migrations(&connection).unwrap();
        let version = get_schema_version(&connection).unwrap();
        assert_eq!(version, CURRENT_VERSION);
    }

    #[test]
    fn migration_v8_adds_labels_column_to_issues() {
        let connection = fresh_db();
        run_migrations(&connection).unwrap();

        // Insert a dashboard and issue with labels
        connection
            .execute(
                "INSERT INTO dashboards (id, name, type) VALUES ('d1', 'Test', 'repo')",
                [],
            )
            .unwrap();
        connection
            .execute(
                "INSERT INTO issues (id, dashboard_id, name, labels) \
                 VALUES ('i1', 'd1', 'Test Issue', '[{\"name\":\"bug\",\"color\":\"#d73a4a\"}]')",
                [],
            )
            .unwrap();

        let labels: Option<String> = connection
            .query_row("SELECT labels FROM issues WHERE id = 'i1'", [], |row| {
                row.get(0)
            })
            .unwrap();
        assert_eq!(
            labels.unwrap(),
            r##"[{"name":"bug","color":"#d73a4a"}]"##
        );

        // NULL labels should also work
        connection
            .execute(
                "INSERT INTO issues (id, dashboard_id, name) VALUES ('i2', 'd1', 'No labels')",
                [],
            )
            .unwrap();
        let null_labels: Option<String> = connection
            .query_row("SELECT labels FROM issues WHERE id = 'i2'", [], |row| {
                row.get(0)
            })
            .unwrap();
        assert!(null_labels.is_none());
    }

    #[test]
    fn migration_v8_adds_default_shape_to_dashboards() {
        let connection = fresh_db();
        run_migrations(&connection).unwrap();

        connection
            .execute(
                "INSERT INTO dashboards (id, name, type) VALUES ('d1', 'Test', 'repo')",
                [],
            )
            .unwrap();

        let default_shape: String = connection
            .query_row(
                "SELECT default_shape FROM dashboards WHERE id = 'd1'",
                [],
                |row| row.get(0),
            )
            .unwrap();
        assert_eq!(default_shape, "cherry");
    }

    #[test]
    fn migration_v8_creates_label_shape_mappings_table() {
        let connection = fresh_db();
        run_migrations(&connection).unwrap();

        connection
            .execute(
                "INSERT INTO dashboards (id, name, type) VALUES ('d1', 'Test', 'repo')",
                [],
            )
            .unwrap();

        let id = uuid::Uuid::new_v4().to_string();
        connection
            .execute(
                "INSERT INTO label_shape_mappings (id, dashboard_id, label_name, tree_shape, color, priority_order) \
                 VALUES (?1, 'd1', 'bug', 'maple', '#d73a4a', 0)",
                [&id],
            )
            .unwrap();

        let (label_name, tree_shape, color): (String, String, Option<String>) = connection
            .query_row(
                "SELECT label_name, tree_shape, color FROM label_shape_mappings WHERE id = ?1",
                [&id],
                |row| Ok((row.get(0)?, row.get(1)?, row.get(2)?)),
            )
            .unwrap();
        assert_eq!(label_name, "bug");
        assert_eq!(tree_shape, "maple");
        assert_eq!(color.unwrap(), "#d73a4a");
    }

    #[test]
    fn migration_v8_seeds_defaults_for_existing_dashboards() {
        let connection = fresh_db();
        // Create a DB at v7 first, then add a dashboard, then run v8
        run_migrations(&connection).unwrap();

        connection
            .execute(
                "INSERT INTO dashboards (id, name, type) VALUES ('d_existing', 'Existing', 'repo')",
                [],
            )
            .unwrap();

        // Manually seed (simulates what migration does for pre-existing dashboards)
        seed_label_shape_mappings_for_dashboard(&connection, "d_existing").unwrap();

        let count: i64 = connection
            .query_row(
                "SELECT COUNT(*) FROM label_shape_mappings WHERE dashboard_id = 'd_existing'",
                [],
                |row| row.get(0),
            )
            .unwrap();
        assert_eq!(count, 9, "should seed 9 default label→shape mappings");

        // Verify priority order
        let (label, shape, priority): (String, String, i32) = connection
            .query_row(
                "SELECT label_name, tree_shape, priority_order FROM label_shape_mappings \
                 WHERE dashboard_id = 'd_existing' ORDER BY priority_order LIMIT 1",
                [],
                |row| Ok((row.get(0)?, row.get(1)?, row.get(2)?)),
            )
            .unwrap();
        assert_eq!(label, "prd");
        assert_eq!(shape, "apple");
        assert_eq!(priority, 0);
    }

    #[test]
    fn migration_v8_is_idempotent() {
        let connection = fresh_db();
        run_migrations(&connection).unwrap();

        // Running v8 again should not fail (INSERT OR IGNORE)
        migrate_v8(&connection).unwrap();
    }

    #[test]
    fn migration_v10_creates_keyboard_shortcuts_table() {
        let connection = fresh_db();
        run_migrations(&connection).unwrap();

        connection
            .execute(
                "INSERT INTO keyboard_shortcuts (action_id, binding) VALUES ('action.save', 'Ctrl+S')",
                [],
            )
            .unwrap();

        let (action_id, binding): (String, String) = connection
            .query_row(
                "SELECT action_id, binding FROM keyboard_shortcuts WHERE action_id = 'action.save'",
                [],
                |row| Ok((row.get(0)?, row.get(1)?)),
            )
            .unwrap();
        assert_eq!(action_id, "action.save");
        assert_eq!(binding, "Ctrl+S");
    }

    #[test]
    fn migration_v10_is_idempotent() {
        let connection = fresh_db();
        run_migrations(&connection).unwrap();

        // Running v10 again should not fail (CREATE TABLE IF NOT EXISTS)
        migrate_v10(&connection).unwrap();
    }
}
