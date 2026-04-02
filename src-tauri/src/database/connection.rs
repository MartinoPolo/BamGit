use std::path::PathBuf;
use std::sync::{Arc, Mutex};

use rusqlite::Connection;

use super::migrations;

pub struct DatabaseState(pub Mutex<Connection>);

pub fn initialize_database(app_data_directory: PathBuf) -> Result<DatabaseState, String> {
    std::fs::create_dir_all(&app_data_directory)
        .map_err(|error| format!("Failed to create app data directory: {error}"))?;

    let database_path = app_data_directory.join("bamgit.db");

    let connection = Connection::open(&database_path)
        .map_err(|error| format!("Failed to open database: {error}"))?;

    connection
        .execute_batch("PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON;")
        .map_err(|error| format!("Failed to set database pragmas: {error}"))?;

    migrations::run_migrations(&connection)
        .map_err(|error| format!("Failed to run migrations: {error}"))?;

    Ok(DatabaseState(Mutex::new(connection)))
}

/// Open a separate database connection for background actors (session actors, etc.).
/// Uses WAL mode so it can coexist with the main DatabaseState connection.
pub fn open_actor_connection(app_data_directory: PathBuf) -> Result<Arc<Mutex<Connection>>, String> {
    let db_path = app_data_directory.join("bamgit.db");
    let connection =
        Connection::open(&db_path).map_err(|error| format!("Failed to open DB for actor: {error}"))?;
    connection
        .execute_batch("PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON;")
        .map_err(|error| format!("Failed to set pragmas: {error}"))?;
    Ok(Arc::new(Mutex::new(connection)))
}
