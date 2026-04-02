use std::collections::HashMap;
use std::path::PathBuf;
use std::sync::{Arc, Mutex as StdMutex};

use rusqlite::{Connection, Row};
use tauri::{AppHandle, Manager, State};

use crate::database::connection::DatabaseState;
use crate::models::session::{Session, SpawnSessionRequest};
use crate::session::manager::SessionManager;
use crate::session::provider::{ActorCommand, SpawnConfig};

const SESSION_SELECT_COLUMNS: &str =
    "id, issue_id, provider, state, pid, session_file_path, started_at, ended_at, \
     cost_usd, token_count, original_intent, last_prompt, last_response_summary";

fn row_to_session(row: &Row) -> Result<Session, rusqlite::Error> {
    Ok(Session {
        id: row.get(0)?,
        issue_id: row.get(1)?,
        provider: row.get(2)?,
        state: row.get(3)?,
        pid: row.get(4)?,
        session_file_path: row.get(5)?,
        started_at: row.get(6)?,
        ended_at: row.get(7)?,
        cost_usd: row.get(8)?,
        token_count: row.get(9)?,
        original_intent: row.get(10)?,
        last_prompt: row.get(11)?,
        last_response_summary: row.get(12)?,
    })
}

#[tauri::command]
pub async fn spawn_session(
    state: State<'_, DatabaseState>,
    manager: State<'_, SessionManager>,
    app_handle: AppHandle,
    request: SpawnSessionRequest,
) -> Result<String, String> {
    let session_id = uuid::Uuid::new_v4().to_string();

    let config = SpawnConfig {
        prompt: request.prompt,
        working_directory: PathBuf::from(&request.working_directory),
        resume_session_id: None,
        permission_mode: request.permission_mode,
        model: request.model,
        max_turns: None,
        env_vars: HashMap::new(),
    };

    // Clone the inner connection Arc for the actor
    // The DatabaseState wraps a Mutex<Connection> — we need an Arc for the actor
    let database_connection = {
        // We need to create an Arc<StdMutex<Connection>> from DatabaseState
        // Since DatabaseState owns the Mutex<Connection>, we need a different approach.
        // The actor needs its own connection for concurrent access.
        let app_data_dir = app_handle
            .path()
            .app_data_dir()
            .map_err(|e| e.to_string())?;
        let db_path = app_data_dir.join("bamgit.db");
        let connection =
            Connection::open(&db_path).map_err(|e| format!("Failed to open DB for actor: {e}"))?;
        connection
            .execute_batch("PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON;")
            .map_err(|e| format!("Failed to set pragmas: {e}"))?;
        Arc::new(StdMutex::new(connection))
    };

    // Also create the session row in the main DB connection (for immediate visibility)
    {
        let conn = state.0.lock().map_err(|e| e.to_string())?;
        conn.execute(
            "INSERT INTO sessions (id, issue_id, provider, state, original_intent) \
             VALUES (?1, ?2, 'claude-code', 'running', ?3)",
            rusqlite::params![session_id, request.issue_id, config.prompt],
        )
        .map_err(|e| format!("Failed to create session row: {e}"))?;
    }

    manager
        .spawn_session(session_id.clone(), config, app_handle, database_connection)
        .await?;

    Ok(session_id)
}

#[tauri::command]
pub async fn send_message(
    manager: State<'_, SessionManager>,
    session_id: String,
    message: String,
) -> Result<(), String> {
    manager
        .send_command(
            &session_id,
            ActorCommand::SendMessage { message },
        )
        .await
}

#[tauri::command]
pub async fn interrupt_session(
    manager: State<'_, SessionManager>,
    session_id: String,
) -> Result<(), String> {
    manager
        .send_command(&session_id, ActorCommand::Interrupt)
        .await
}

#[tauri::command]
pub async fn terminate_session(
    manager: State<'_, SessionManager>,
    session_id: String,
) -> Result<(), String> {
    manager
        .send_command(&session_id, ActorCommand::Terminate)
        .await
}

#[tauri::command]
pub fn get_sessions(state: State<DatabaseState>) -> Result<Vec<Session>, String> {
    let connection = state.0.lock().map_err(|e| e.to_string())?;

    let query = format!(
        "SELECT {SESSION_SELECT_COLUMNS} FROM sessions ORDER BY started_at DESC"
    );

    let mut statement = connection
        .prepare(&query)
        .map_err(|e| format!("Failed to prepare query: {e}"))?;

    let sessions = statement
        .query_map([], |row| row_to_session(row))
        .map_err(|e| format!("Failed to query sessions: {e}"))?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| format!("Failed to read session row: {e}"))?;

    Ok(sessions)
}

#[tauri::command]
pub fn get_session(state: State<DatabaseState>, id: String) -> Result<Session, String> {
    let connection = state.0.lock().map_err(|e| e.to_string())?;

    let query = format!("SELECT {SESSION_SELECT_COLUMNS} FROM sessions WHERE id = ?1");
    connection
        .query_row(&query, [&id], |row| row_to_session(row))
        .map_err(|e| format!("Session not found: {e}"))
}
