use rusqlite::Connection;

use super::schema;

const CURRENT_VERSION: i32 = 5;

type MigrationFunction = fn(&Connection) -> Result<(), rusqlite::Error>;

static MIGRATIONS: &[MigrationFunction] = &[migrate_v1, migrate_v2, migrate_v3, migrate_v4, migrate_v5];

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
}
