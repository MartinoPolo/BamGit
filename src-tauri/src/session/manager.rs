use std::collections::HashMap;
use std::sync::{Arc, Mutex as StdMutex};

use rusqlite::Connection;
use tauri::AppHandle;
use tokio::sync::{mpsc, Mutex};

use super::claude_code_provider::ClaudeCodeProvider;
use super::codex_provider::CodexProvider;
use super::opencode_provider::OpenCodeProvider;
use super::provider::{ActorCommand, ProviderAdapter, ProviderKind, SpawnConfig};
use super::session_actor;

/// Registry of active session actors. Managed as Tauri state.
pub struct SessionManager {
    actors: Arc<Mutex<HashMap<String, mpsc::Sender<ActorCommand>>>>,
}

impl SessionManager {
    pub fn new() -> Self {
        Self {
            actors: Arc::new(Mutex::new(HashMap::new())),
        }
    }

    fn create_provider(kind: ProviderKind) -> Box<dyn ProviderAdapter> {
        match kind {
            ProviderKind::ClaudeCode => Box::new(ClaudeCodeProvider::new()),
            ProviderKind::OpenCode => Box::new(OpenCodeProvider::new()),
            ProviderKind::Codex => Box::new(CodexProvider::new()),
        }
    }

    /// Spawn the provider process, start an actor task, and register it.
    /// Caller is responsible for creating the DB row first.
    pub async fn spawn_session(
        &self,
        session_id: String,
        config: SpawnConfig,
        provider_kind: ProviderKind,
        app_handle: AppHandle,
        database_connection: Arc<StdMutex<Connection>>,
    ) -> Result<String, String> {
        let provider = Self::create_provider(provider_kind);
        let (handle, event_receiver) = provider
            .spawn(config)
            .await
            .map_err(|e| format!("Failed to spawn session: {e}"))?;

        {
            let conn = database_connection.lock().map_err(|e| e.to_string())?;
            let _ = conn.execute(
                "UPDATE sessions SET pid = ?1 WHERE id = ?2",
                rusqlite::params![handle.pid as i64, session_id],
            );
        }

        let (command_sender, command_receiver) = mpsc::channel::<ActorCommand>(32);

        {
            let mut actors = self.actors.lock().await;
            actors.insert(session_id.clone(), command_sender);
        }

        let actor_session_id = session_id.clone();
        let actors_ref = Arc::clone(&self.actors);
        tauri::async_runtime::spawn(async move {
            session_actor::run_actor(
                actor_session_id.clone(),
                handle,
                provider,
                event_receiver,
                app_handle,
                database_connection,
                command_receiver,
            )
            .await;

            let mut actors = actors_ref.lock().await;
            actors.remove(&actor_session_id);
        });

        Ok(session_id)
    }

    /// Send a command to a running session actor.
    pub async fn send_command(
        &self,
        session_id: &str,
        command: ActorCommand,
    ) -> Result<(), String> {
        let actors = self.actors.lock().await;
        let sender = actors
            .get(session_id)
            .ok_or_else(|| format!("Session {session_id} not found in active actors"))?;

        sender
            .send(command)
            .await
            .map_err(|e| format!("Failed to send command to session {session_id}: {e}"))
    }

    /// Terminate all active sessions. Called on app exit.
    pub async fn cleanup_all(&self) {
        let actors = self.actors.lock().await;
        for (session_id, sender) in actors.iter() {
            if let Err(e) = sender.send(ActorCommand::Terminate).await {
                log::warn!("Failed to terminate session {session_id} during cleanup: {e}");
            }
        }
    }
}
