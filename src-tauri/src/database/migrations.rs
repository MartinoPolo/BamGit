use rusqlite::Connection;

use super::schema;

const CURRENT_VERSION: i32 = 1;

type MigrationFunction = fn(&Connection) -> Result<(), rusqlite::Error>;

static MIGRATIONS: &[MigrationFunction] = &[migrate_v1];

fn migrate_v1(connection: &Connection) -> Result<(), rusqlite::Error> {
    schema::create_tables(connection)
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
