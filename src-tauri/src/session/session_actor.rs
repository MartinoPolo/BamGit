use std::sync::Mutex as StdMutex;

use rusqlite::Connection;
use serde::Serialize;
use ts_rs::TS;
use tauri::{AppHandle, Emitter, Manager};
use tokio::sync::mpsc;

use super::provider::{ActorCommand, ProviderAdapter, SessionEvent, SessionHandle};
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
/// Reads parsed events from the provider's event channel (transport-agnostic).
pub async fn run_actor(
    session_id: String,
    mut handle: SessionHandle,
    provider: Box<dyn ProviderAdapter>,
    mut event_receiver: mpsc::Receiver<SessionEvent>,
    app_handle: AppHandle,
    database_connection: std::sync::Arc<StdMutex<Connection>>,
    mut command_receiver: mpsc::Receiver<ActorCommand>,
) {
    loop {
        tokio::select! {
            event = event_receiver.recv() => {
                match event {
                    Some(event) => {
                        handle_event(&session_id, &event, &app_handle, &database_connection);
                    }
                    None => {
                        let exit_event = SessionEvent::RunState {
                            state: "finished".into(),
                            error: None,
                        };
                        handle_event(&session_id, &exit_event, &app_handle, &database_connection);
                        update_session_ended(&session_id, &database_connection);
                        break;
                    }
                }
            }

            command = command_receiver.recv() => {
                match command {
                    Some(ActorCommand::SendMessage { message }) => {
                        update_last_prompt(&session_id, &message, &database_connection);

                        if let Err(e) = provider.send_turn(&mut handle, &message).await {
                            log::error!("Failed to send message to session {session_id}: {e}");
                        }
                    }
                    Some(ActorCommand::RespondToRequest { request_id, decision }) => {
                        if let Err(e) = provider.respond_to_request(&mut handle, &request_id, &decision).await {
                            log::error!("Failed to respond to request for session {session_id}: {e}");
                        }
                    }
                    Some(ActorCommand::RespondToUserInput { request_id, answers }) => {
                        if let Err(e) = provider.respond_to_user_input(&mut handle, &request_id, &answers).await {
                            log::error!("Failed to respond to user input for session {session_id}: {e}");
                        }
                    }
                    Some(ActorCommand::Interrupt) => {
                        if let Err(e) = provider.interrupt(&mut handle).await {
                            log::error!("Failed to interrupt session {session_id}: {e}");
                        } else {
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
                        let term_event = SessionEvent::RunState {
                            state: "finished".into(),
                            error: None,
                        };
                        handle_event(&session_id, &term_event, &app_handle, &database_connection);
                        update_session_ended(&session_id, &database_connection);
                        break;
                    }
                    None => {
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
            cache_read_tokens,
            cache_write_tokens,
            cost_usd,
            duration_ms,
            num_turns,
        } => {
            update_session_usage(
                session_id,
                *cost_usd,
                (*input_tokens + *output_tokens) as i64,
                database_connection,
            );
            upsert_session_metrics(
                session_id,
                *input_tokens,
                *output_tokens,
                *cache_read_tokens,
                *cache_write_tokens,
                *cost_usd,
                *duration_ms,
                *num_turns,
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

fn upsert_session_metrics(
    session_id: &str,
    input_tokens: u64,
    output_tokens: u64,
    cache_read_tokens: u64,
    cache_write_tokens: u64,
    cost_usd: f64,
    duration_ms: Option<u64>,
    num_turns: Option<u32>,
    connection: &std::sync::Arc<StdMutex<Connection>>,
) {
    if let Ok(conn) = connection.lock() {
        let duration_seconds = duration_ms.map(|ms| ms as f64 / 1000.0);
        if let Err(e) = conn.execute(
            "INSERT INTO session_metrics \
             (session_id, provider, input_tokens, output_tokens, cache_read_tokens, cache_write_tokens, \
              cost_usd, duration_seconds, turn_count, started_at) \
             VALUES (?1, \
                     COALESCE((SELECT provider FROM sessions WHERE id = ?1), 'unknown'), \
                     ?2, ?3, ?4, ?5, ?6, ?7, COALESCE(?8, 0), \
                     COALESCE((SELECT started_at FROM sessions WHERE id = ?1), datetime('now'))) \
             ON CONFLICT(session_id) DO UPDATE SET \
                 input_tokens = ?2, output_tokens = ?3, \
                 cache_read_tokens = ?4, cache_write_tokens = ?5, \
                 cost_usd = ?6, \
                 duration_seconds = COALESCE(?7, session_metrics.duration_seconds), \
                 turn_count = COALESCE(?8, session_metrics.turn_count)",
            rusqlite::params![
                session_id,
                input_tokens as i64,
                output_tokens as i64,
                cache_read_tokens as i64,
                cache_write_tokens as i64,
                cost_usd,
                duration_seconds,
                num_turns.map(|n| n as i64),
            ],
        ) {
            log::error!("Failed to upsert session_metrics for {session_id}: {e}");
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

