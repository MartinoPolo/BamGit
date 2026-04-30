use std::sync::Mutex as StdMutex;

use rusqlite::Connection;
use serde::Serialize;
use serde_json::Value;
use ts_rs::TS;
use tauri::{AppHandle, Emitter, Manager};
use tokio::io::{AsyncBufReadExt, BufReader};
use tokio::sync::mpsc;

use super::provider::{ActorCommand, SessionEvent, SessionHandle, SessionProvider};
use crate::models::session::SessionState;
use crate::notification::service::{session_state_to_event_type, NotificationService};

/// Payload emitted to the frontend via Tauri events.
#[derive(Debug, Clone, Serialize, TS)]
#[ts(export)]
pub struct SessionEventPayload {
    pub session_id: String,
    pub event: SessionEvent,
    pub resolved_state: Option<SessionState>,
}

/// Runs the session actor loop as a tokio task.
/// Reads stdout line-by-line, parses events, emits to frontend, updates DB.
pub async fn run_actor(
    session_id: String,
    mut handle: SessionHandle,
    provider: Box<dyn SessionProvider>,
    app_handle: AppHandle,
    database_connection: std::sync::Arc<StdMutex<Connection>>,
    mut command_receiver: mpsc::Receiver<ActorCommand>,
) {
    // Take stdout/stderr from handle — actor owns them for reading.
    // handle retains stdin + child for provider methods.
    let stdout = match handle.stdout.take() {
        Some(s) => s,
        None => {
            log::error!("Session {session_id}: no stdout available");
            return;
        }
    };

    let mut stdout_reader = BufReader::new(stdout).lines();

    // stderr is optional — if not available, we just skip it
    let mut stderr_reader = handle.stderr.take().map(|s| BufReader::new(s).lines());

    let mut has_ended = false;

    loop {
        tokio::select! {
            line = stdout_reader.next_line() => {
                match line {
                    Ok(Some(line)) => {
                        if let Ok(raw) = serde_json::from_str::<Value>(&line) {
                            match provider.parse_event(&raw) {
                                Ok(events) => {
                                    for event in events {
                                        handle_event(
                                            &session_id,
                                            &event,
                                            &app_handle,
                                            &database_connection,
                                        );
                                    }
                                }
                                Err(e) => {
                                    log::warn!("Parse error for session {session_id}: {e}");
                                }
                            }
                        }
                    }
                    Ok(None) => {
                        if !has_ended {
                            has_ended = true;
                            let exit_event = SessionEvent::RunState {
                                state: "finished".into(),
                                error: None,
                            };
                            handle_event(&session_id, &exit_event, &app_handle, &database_connection);
                            update_session_ended(&session_id, &database_connection);
                        }
                        break;
                    }
                    Err(e) => {
                        log::error!("Stdout read error for session {session_id}: {e}");
                        if !has_ended {
                            has_ended = true;
                            let error_event = SessionEvent::RunState {
                                state: "errored".into(),
                                error: Some(e.to_string()),
                            };
                            handle_event(&session_id, &error_event, &app_handle, &database_connection);
                            update_session_ended(&session_id, &database_connection);
                        }
                        break;
                    }
                }
            }

            // Read stderr lines (for debug/raw events) — only if stderr is available
            line = async {
                match stderr_reader.as_mut() {
                    Some(reader) => reader.next_line().await,
                    None => std::future::pending().await,
                }
            } => {
                if let Ok(Some(line)) = line {
                    let raw_event = SessionEvent::Raw {
                        source: "stderr".into(),
                        data: Value::String(line),
                    };
                    emit_event(&session_id, &raw_event, &app_handle, None);
                }
            }

            command = command_receiver.recv() => {
                match command {
                    Some(ActorCommand::SendMessage { message }) => {
                        update_last_prompt(&session_id, &message, &database_connection);

                        if let Err(e) = provider.send_message(&mut handle, &message).await {
                            log::error!("Failed to send message to session {session_id}: {e}");
                        }
                    }
                    Some(ActorCommand::Interrupt) => {
                        if let Err(e) = provider.interrupt(&mut handle).await {
                            log::error!("Failed to interrupt session {session_id}: {e}");
                        } else {
                            // Set paused state immediately — the CLI will emit
                            // result(idle) later which transitions to needs-review
                            update_session_state(&session_id, &SessionState::Paused, &database_connection);
                            let pause_event = SessionEvent::RunState {
                                state: "paused".into(),
                                error: None,
                            };
                            emit_event(&session_id, &pause_event, &app_handle, Some(SessionState::Paused));
                        }
                    }
                    Some(ActorCommand::Terminate) => {
                        if let Err(e) = provider.terminate(&mut handle).await {
                            log::error!("Failed to terminate session {session_id}: {e}");
                        }
                        if !has_ended {
                            has_ended = true;
                            let term_event = SessionEvent::RunState {
                                state: "finished".into(),
                                error: None,
                            };
                            handle_event(&session_id, &term_event, &app_handle, &database_connection);
                            update_session_ended(&session_id, &database_connection);
                        }
                        break;
                    }
                    None => {
                        // Channel closed — manager dropped
                        break;
                    }
                }
            }
        }
    }
}

fn emit_event(session_id: &str, event: &SessionEvent, app_handle: &AppHandle, resolved_state: Option<SessionState>) {
    let payload = SessionEventPayload {
        session_id: session_id.to_string(),
        event: event.clone(),
        resolved_state,
    };
    let _ = app_handle.emit("session-event", &payload);
}

fn handle_event(
    session_id: &str,
    event: &SessionEvent,
    app_handle: &AppHandle,
    database_connection: &std::sync::Arc<StdMutex<Connection>>,
) {
    // Compute resolved_state so frontend doesn't need its own state mapping
    let resolved_state = match event {
        SessionEvent::RunState { state, .. } => {
            match state.as_str() {
                "running" => Some(SessionState::Running),
                "idle" => Some(SessionState::NeedsReview),
                "failed" => Some(SessionState::Errored),
                "completed" => Some(SessionState::Finished),
                "stopped" => Some(SessionState::Finished),
                _ => None,
            }
        }
        SessionEvent::PermissionPrompt { .. } | SessionEvent::ElicitationPrompt { .. } => {
            Some(SessionState::NeedsInput)
        }
        _ => None,
    };

    emit_event(session_id, event, app_handle, resolved_state.clone());

    match event {
        SessionEvent::RunState { error, .. } => {
            if let Some(ref db_state) = resolved_state {
                update_session_state(session_id, db_state, database_connection);
                fire_notification(
                    session_id,
                    db_state,
                    error.as_deref().unwrap_or(db_state.as_str()),
                    app_handle,
                    database_connection,
                );
            }
        }
        SessionEvent::UsageUpdate {
            input_tokens,
            output_tokens,
            cost_usd,
        } => {
            update_session_usage(
                session_id,
                *cost_usd,
                (*input_tokens + *output_tokens) as i64,
                database_connection,
            );
        }
        SessionEvent::MessageComplete { text, .. } => {
            let summary = super::truncate_utf8(text, 500);
            update_last_response_summary(session_id, &summary, database_connection);
        }
        SessionEvent::SessionInit {
            session_id: cli_session_id,
            ..
        } => {
            update_cli_session_id(session_id, cli_session_id, database_connection);
        }
        SessionEvent::PermissionPrompt { .. } | SessionEvent::ElicitationPrompt { .. } => {
            if let Some(ref db_state) = resolved_state {
                update_session_state(session_id, db_state, database_connection);
                fire_notification(
                    session_id,
                    db_state,
                    "NOTIFICATION_SESSION_WAITING",
                    app_handle,
                    database_connection,
                );
            }
        }
        _ => {}
    }
}

fn fire_notification(
    session_id: &str,
    state: &SessionState,
    message: &str,
    app_handle: &AppHandle,
    database_connection: &std::sync::Arc<StdMutex<Connection>>,
) {
    if let Some(event_type) = session_state_to_event_type(state) {
        if let Some(service) = app_handle.try_state::<NotificationService>() {
            service.notify(event_type, session_id, message, app_handle, database_connection);
        }
    }
}

// --- DB helpers (lock briefly, never across await) ---

fn update_session_state(
    session_id: &str,
    state: &SessionState,
    connection: &std::sync::Arc<StdMutex<Connection>>,
) {
    if let Ok(conn) = connection.lock() {
        if let Err(e) = conn.execute(
            "UPDATE sessions SET state = ?1 WHERE id = ?2",
            rusqlite::params![state, session_id],
        ) {
            log::error!("Failed to update session state for {session_id}: {e}");
        }
    }
}

fn update_session_usage(
    session_id: &str,
    cost_usd: f64,
    token_count: i64,
    connection: &std::sync::Arc<StdMutex<Connection>>,
) {
    if let Ok(conn) = connection.lock() {
        if let Err(e) = conn.execute(
            "UPDATE sessions SET cost_usd = ?1, token_count = ?2 WHERE id = ?3",
            rusqlite::params![cost_usd, token_count, session_id],
        ) {
            log::error!("Failed to update session usage for {session_id}: {e}");
        }
    }
}

fn update_session_ended(
    session_id: &str,
    connection: &std::sync::Arc<StdMutex<Connection>>,
) {
    if let Ok(conn) = connection.lock() {
        if let Err(e) = conn.execute(
            "UPDATE sessions SET ended_at = datetime('now') WHERE id = ?1",
            [session_id],
        ) {
            log::error!("Failed to update session ended_at for {session_id}: {e}");
        }
    }
}

fn update_last_prompt(
    session_id: &str,
    message: &str,
    connection: &std::sync::Arc<StdMutex<Connection>>,
) {
    if let Ok(conn) = connection.lock() {
        if let Err(e) = conn.execute(
            "UPDATE sessions SET last_prompt = ?1 WHERE id = ?2",
            rusqlite::params![message, session_id],
        ) {
            log::error!("Failed to update last_prompt for {session_id}: {e}");
        }
    }
}

fn update_last_response_summary(
    session_id: &str,
    summary: &str,
    connection: &std::sync::Arc<StdMutex<Connection>>,
) {
    if let Ok(conn) = connection.lock() {
        if let Err(e) = conn.execute(
            "UPDATE sessions SET last_response_summary = ?1 WHERE id = ?2",
            rusqlite::params![summary, session_id],
        ) {
            log::error!("Failed to update last_response_summary for {session_id}: {e}");
        }
    }
}

fn update_cli_session_id(
    session_id: &str,
    cli_session_id: &str,
    connection: &std::sync::Arc<StdMutex<Connection>>,
) {
    if let Ok(conn) = connection.lock() {
        if let Err(e) = conn.execute(
            "UPDATE sessions SET cli_session_id = ?1 WHERE id = ?2",
            rusqlite::params![cli_session_id, session_id],
        ) {
            log::error!("Failed to update cli_session_id for {session_id}: {e}");
        }
    }
}

