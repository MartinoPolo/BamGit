use std::path::PathBuf;
use std::sync::{Arc, Mutex};

use r2d2::Pool;
use r2d2_sqlite::SqliteConnectionManager;
use rusqlite::Connection;

use super::migrations;

pub struct DatabaseState {
    pub read_pool: Pool<SqliteConnectionManager>,
    pub write_conn: Mutex<Connection>,
}

impl DatabaseState {
    pub fn read(&self) -> Result<r2d2::PooledConnection<SqliteConnectionManager>, String> {
        self.read_pool
            .get()
            .map_err(|error| format!("Failed to get read connection from pool: {error}"))
    }

    pub fn write(&self) -> Result<std::sync::MutexGuard<'_, Connection>, String> {
        self.write_conn
            .lock()
            .map_err(|error| format!("Failed to lock write connection: {error}"))
    }
}

pub fn initialize_database(app_data_directory: PathBuf) -> Result<DatabaseState, String> {
    std::fs::create_dir_all(&app_data_directory)
        .map_err(|error| format!("Failed to create app data directory: {error}"))?;

    let database_path = app_data_directory.join("grovekeeper.db");

    // Dedicated write connection
    let connection = Connection::open(&database_path)
        .map_err(|error| format!("Failed to open database: {error}"))?;

    connection
        .execute_batch("PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON;")
        .map_err(|error| format!("Failed to set database pragmas: {error}"))?;

    migrations::run_migrations(&connection)
        .map_err(|error| format!("Failed to run migrations: {error}"))?;

    // Read pool: 4 concurrent reader connections, each configured with WAL + foreign keys
    let manager = SqliteConnectionManager::file(&database_path)
        .with_init(|connection| {
            connection.execute_batch("PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON;")?;
            Ok(())
        });

    let read_pool = Pool::builder()
        .max_size(4)
        .build(manager)
        .map_err(|error| format!("Failed to build read connection pool: {error}"))?;

    Ok(DatabaseState {
        read_pool,
        write_conn: Mutex::new(connection),
    })
}

/// Open a separate database connection for background actors (session actors, etc.).
/// Uses WAL mode so it can coexist with the main DatabaseState connection.
pub fn open_actor_connection(app_data_directory: PathBuf) -> Result<Arc<Mutex<Connection>>, String> {
    let db_path = app_data_directory.join("grovekeeper.db");
    let connection =
        Connection::open(&db_path).map_err(|error| format!("Failed to open DB for actor: {error}"))?;
    connection
        .execute_batch("PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON;")
        .map_err(|error| format!("Failed to set pragmas: {error}"))?;
    Ok(Arc::new(Mutex::new(connection)))
}
