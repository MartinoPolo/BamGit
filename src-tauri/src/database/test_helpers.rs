use rusqlite::Connection;

use super::schema;

/// Shared test helper: creates an in-memory SQLite database with foreign keys enabled
/// and all tables created via the current schema. Used across multiple test modules
/// to avoid duplicating setup logic.
pub(crate) fn setup_test_database() -> Connection {
    let connection = Connection::open_in_memory().unwrap();
    connection
        .execute_batch("PRAGMA foreign_keys = ON;")
        .unwrap();
    schema::create_tables(&connection).unwrap();
    connection
}
