use rusqlite::Connection;

use super::schema;

const CURRENT_VERSION: i32 = 2;

type MigrationFunction = fn(&Connection) -> Result<(), rusqlite::Error>;

static MIGRATIONS: &[MigrationFunction] = &[migrate_v1, migrate_v2];

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
