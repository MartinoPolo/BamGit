use std::collections::HashMap;
use std::path::PathBuf;
use std::sync::{Arc, Mutex as StdMutex};

use rusqlite::{Connection, Row};
use tauri::{AppHandle, Manager, State};

use serde::Deserialize;

use crate::database::connection::DatabaseState;
use crate::models::session::{Session, SpawnSessionRequest};
use crate::session::discovery::DiscoveredSession;
use crate::session::discovery_polling::DiscoveryPoller;
use crate::session::manager::SessionManager;
use crate::session::provider::{ActorCommand, SpawnConfig};

const SESSION_SELECT_COLUMNS: &str =
    "id, issue_id, provider, state, pid, session_file_path, started_at, ended_at, \
     cost_usd, token_count, original_intent, last_prompt, last_response_summary, \
     execution_phase, source, working_directory";

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
        execution_phase: row.get(13)?,
        source: row.get(14)?,
        working_directory: row.get(15)?,
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

    let database_connection = open_actor_database_connection(&app_handle)?;

    // Also create the session row in the main DB connection (for immediate visibility)
    {
        let conn = state.write();
        conn.execute(
            "INSERT INTO sessions (id, issue_id, provider, state, original_intent, source, working_directory) \
             VALUES (?1, ?2, 'claude-code', 'running', ?3, 'spawned', ?4)",
            rusqlite::params![session_id, request.issue_id, config.prompt, request.working_directory],
        )
        .map_err(|e| format!("Failed to create session row: {e}"))?;
    }

    if let Err(e) = manager
        .spawn_session(session_id.clone(), config, app_handle, database_connection)
        .await
    {
        {
            let conn = state.write();
            let _ = conn.execute(
                "UPDATE sessions SET state = 'errored', ended_at = datetime('now') WHERE id = ?1",
                [&session_id],
            );
        }
        return Err(e);
    }

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
    let connection = state.read();

    let query = format!(
        "SELECT {SESSION_SELECT_COLUMNS} FROM sessions ORDER BY started_at DESC LIMIT 500"
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
    let connection = state.read();

    let query = format!("SELECT {SESSION_SELECT_COLUMNS} FROM sessions WHERE id = ?1");
    connection
        .query_row(&query, [&id], |row| row_to_session(row))
        .map_err(|e| format!("Session not found: {e}"))
}

// ─── Discovery & Adoption Commands ──────────────────────────────────────────

#[derive(Debug, Deserialize)]
pub struct AdoptSessionRequest {
    pub cli_session_id: String,
    pub working_directory: String,
    pub issue_id: Option<String>,
    pub original_intent: Option<String>,
    pub cost_usd: Option<f64>,
    pub token_count: Option<i64>,
}

/// One-shot discovery of external Claude Code sessions.
#[tauri::command]
pub async fn discover_external_sessions(
    state: State<'_, DatabaseState>,
) -> Result<Vec<DiscoveredSession>, String> {
    let excluded_pids = get_managed_pids(&state)?;
    let mut discoverer = crate::session::discovery::SessionDiscoverer::new();
    Ok(discoverer.discover_sessions(&excluded_pids))
}

/// Query PIDs of sessions currently managed by Grovekeeper (running/needs-input/needs-review).
fn get_managed_pids(state: &State<DatabaseState>) -> Result<Vec<u32>, String> {
    let connection = state.read();
    let mut statement = connection
        .prepare(crate::session::discovery::MANAGED_PIDS_QUERY)
        .map_err(|e| format!("Failed to query managed PIDs: {e}"))?;

    let pids = statement
        .query_map([], |row| {
            let pid: i64 = row.get(0)?;
            Ok(pid as u32)
        })
        .map_err(|e| format!("Failed to read PIDs: {e}"))?
        .filter_map(|r| r.ok())
        .collect();

    Ok(pids)
}

/// Adopt an external session: create a DB row and spawn it with --resume.
#[tauri::command]
pub async fn adopt_session(
    state: State<'_, DatabaseState>,
    manager: State<'_, SessionManager>,
    app_handle: AppHandle,
    request: AdoptSessionRequest,
) -> Result<String, String> {
    let session_id = uuid::Uuid::new_v4().to_string();

    let config = SpawnConfig {
        prompt: String::new(),
        working_directory: PathBuf::from(&request.working_directory),
        resume_session_id: Some(request.cli_session_id.clone()),
        permission_mode: None,
        model: None,
        max_turns: None,
        env_vars: HashMap::new(),
    };

    let database_connection = open_actor_database_connection(&app_handle)?;

    // Create the adopted session row
    {
        let conn = state.write();
        conn.execute(
            "INSERT INTO sessions (id, issue_id, provider, state, session_file_path, \
             original_intent, cost_usd, token_count, source, working_directory) \
             VALUES (?1, ?2, 'claude-code', 'running', ?3, ?4, ?5, ?6, 'adopted', ?7)",
            rusqlite::params![
                session_id,
                request.issue_id,
                request.cli_session_id,
                request.original_intent,
                request.cost_usd,
                request.token_count,
                request.working_directory,
            ],
        )
        .map_err(|e| format!("Failed to create adopted session row: {e}"))?;
    }

    manager
        .spawn_session(session_id.clone(), config, app_handle, database_connection)
        .await?;

    Ok(session_id)
}

/// Start the background discovery polling loop.
#[tauri::command]
pub async fn start_discovery_polling(
    poller: State<'_, DiscoveryPoller>,
    app_handle: AppHandle,
    interval_milliseconds: Option<u64>,
) -> Result<(), String> {
    let interval = interval_milliseconds.unwrap_or(3000);
    poller.start(app_handle, interval);
    Ok(())
}

/// Stop the background discovery polling loop.
#[tauri::command]
pub async fn stop_discovery_polling(
    poller: State<'_, DiscoveryPoller>,
) -> Result<(), String> {
    poller.stop();
    Ok(())
}

/// Helper: open a separate DB connection for a session actor.
fn open_actor_database_connection(
    app_handle: &AppHandle,
) -> Result<Arc<StdMutex<Connection>>, String> {
    let app_data_directory = app_handle
        .path()
        .app_data_dir()
        .map_err(|e| e.to_string())?;
    crate::database::connection::open_actor_connection(app_data_directory)
}
