use rusqlite::Connection;

use super::schema;

pub(crate) const CURRENT_VERSION: i32 = 3;

type MigrationFunction = fn(&Connection) -> Result<(), rusqlite::Error>;

static MIGRATIONS: &[MigrationFunction] = &[migrate_v1, migrate_v2, migrate_v3];

fn migrate_v1(connection: &Connection) -> Result<(), rusqlite::Error> {
    schema::create_tables(connection)?;

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

    crate::commands::color_palette_commands::seed_built_in_palettes_with_connection(connection)
        .map_err(|error| {
            rusqlite::Error::SqliteFailure(
                rusqlite::ffi::Error::new(rusqlite::ffi::SQLITE_ERROR),
                Some(error),
            )
        })?;

    connection.execute_batch(
        "INSERT OR IGNORE INTO app_settings (key, value) VALUES ('startup_behavior', 'overview');",
    )?;

    Ok(())
}

fn migrate_v2(connection: &Connection) -> Result<(), rusqlite::Error> {
    // SQLite cannot ALTER CHECK constraints, so we recreate the issues table
    // with the updated priority constraint that includes 'lowest'.
    connection.execute_batch("PRAGMA foreign_keys=OFF;")?;
    connection.execute_batch(
        "
        BEGIN;

        CREATE TABLE issues_new (
            id TEXT PRIMARY KEY,
            dashboard_id TEXT NOT NULL REFERENCES dashboards(id) ON DELETE CASCADE,
            name TEXT NOT NULL,
            priority TEXT CHECK (priority IN ('lowest', 'low', 'medium', 'high', 'top')),
            color TEXT,
            status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived')),
            github_issue_url TEXT,
            github_issue_number INTEGER,
            branch_name TEXT,
            base_branch TEXT,
            worktree_folder TEXT,
            worktree_state TEXT DEFAULT 'none' CHECK (worktree_state IN ('none', 'pending', 'active', 'failed', 'removing', 'removed')),
            parent_issue_id TEXT REFERENCES issues_new(id) ON DELETE SET NULL,
            editor_folder TEXT,
            dev_server_command TEXT,
            dev_server_port INTEGER,
            dev_server_pid INTEGER,
            browser_url TEXT,
            labels TEXT,
            sort_order INTEGER NOT NULL DEFAULT 0,
            created_at TEXT NOT NULL DEFAULT (datetime('now'))
        );

        INSERT INTO issues_new SELECT * FROM issues;
        DROP TABLE issues;
        ALTER TABLE issues_new RENAME TO issues;

        CREATE INDEX IF NOT EXISTS idx_issues_dashboard_id ON issues(dashboard_id);

        COMMIT;
        ",
    )?;
    connection.execute_batch("PRAGMA foreign_keys=ON;")?;
    Ok(())
}

fn migrate_v3(connection: &Connection) -> Result<(), rusqlite::Error> {
    connection.execute_batch(
        "CREATE TABLE IF NOT EXISTS deleted_assigned_issues (
            id TEXT PRIMARY KEY,
            dashboard_id TEXT NOT NULL REFERENCES dashboards(id) ON DELETE CASCADE,
            github_issue_number INTEGER NOT NULL,
            deleted_at TEXT NOT NULL DEFAULT (datetime('now')),
            UNIQUE(dashboard_id, github_issue_number)
        );
        CREATE INDEX IF NOT EXISTS idx_deleted_assigned_issues_dashboard
            ON deleted_assigned_issues(dashboard_id);",
    )?;
    Ok(())
}

pub const DEFAULT_TREE_SHAPE: &str = "cherry";

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
    fn schema_version_reaches_current() {
        let connection = fresh_db();
        run_migrations(&connection).unwrap();
        let version = get_schema_version(&connection).unwrap();
        assert_eq!(version, CURRENT_VERSION);
    }

    #[test]
    fn migration_is_idempotent() {
        let connection = fresh_db();
        run_migrations(&connection).unwrap();
        run_migrations(&connection).unwrap();
        let version = get_schema_version(&connection).unwrap();
        assert_eq!(version, CURRENT_VERSION);
    }

    #[test]
    fn migration_seeds_notification_config_defaults() {
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
    fn migration_seeds_app_settings_default() {
        let connection = fresh_db();
        run_migrations(&connection).unwrap();

        let value: String = connection
            .query_row(
                "SELECT value FROM app_settings WHERE key = 'startup_behavior'",
                [],
                |row| row.get(0),
            )
            .unwrap();
        assert_eq!(value, "overview");
    }

    #[test]
    fn migration_v2_allows_lowest_priority() {
        let connection = fresh_db();
        run_migrations(&connection).unwrap();

        // Create dashboard first (FK requirement)
        connection
            .execute(
                "INSERT INTO dashboards (id, name, type) VALUES ('d1', 'Test', 'repo')",
                [],
            )
            .unwrap();

        // Insert issue with 'lowest' priority — should succeed after migration
        connection
            .execute(
                "INSERT INTO issues (id, dashboard_id, name, priority) VALUES ('i1', 'd1', 'Test Issue', 'lowest')",
                [],
            )
            .unwrap();

        let priority: String = connection
            .query_row("SELECT priority FROM issues WHERE id = 'i1'", [], |row| {
                row.get(0)
            })
            .unwrap();
        assert_eq!(priority, "lowest");
    }

    #[test]
    fn migration_v2_preserves_existing_issues() {
        let connection = fresh_db();
        // Run v1 only
        migrate_v1(&connection).unwrap();
        set_schema_version(&connection, 1).unwrap();

        // Create dashboard and issue with old priority
        connection
            .execute(
                "INSERT INTO dashboards (id, name, type) VALUES ('d1', 'Test', 'repo')",
                [],
            )
            .unwrap();
        connection
            .execute(
                "INSERT INTO issues (id, dashboard_id, name, priority) VALUES ('i1', 'd1', 'Old Issue', 'high')",
                [],
            )
            .unwrap();

        // Now run v2
        run_migrations(&connection).unwrap();

        // Verify the issue survived
        let (name, priority): (String, String) = connection
            .query_row(
                "SELECT name, priority FROM issues WHERE id = 'i1'",
                [],
                |row| Ok((row.get(0)?, row.get(1)?)),
            )
            .unwrap();
        assert_eq!(name, "Old Issue");
        assert_eq!(priority, "high");
    }

    #[test]
    fn migration_seeds_label_shape_mappings_for_existing_dashboards() {
        let connection = fresh_db();
        run_migrations(&connection).unwrap();

        connection
            .execute(
                "INSERT INTO dashboards (id, name, type) VALUES ('d1', 'Test', 'repo')",
                [],
            )
            .unwrap();

        seed_label_shape_mappings_for_dashboard(&connection, "d1").unwrap();

        let count: i64 = connection
            .query_row(
                "SELECT COUNT(*) FROM label_shape_mappings WHERE dashboard_id = 'd1'",
                [],
                |row| row.get(0),
            )
            .unwrap();
        assert_eq!(count, 9, "should seed 9 default label->shape mappings");
    }
}
