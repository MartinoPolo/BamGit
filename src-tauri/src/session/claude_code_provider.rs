use async_trait::async_trait;
use serde_json::Value;
use tokio::io::AsyncWriteExt;
use tokio::process::Command;

use super::protocol_parser::ProtocolState;
use super::provider::{
    ProviderError, SessionEvent, SessionHandle, SessionProvider, SpawnConfig,
};

pub struct ClaudeCodeProvider {
    /// Each provider instance owns a protocol parser for stateful event tracking.
    protocol_state: std::sync::Mutex<ProtocolState>,
}

impl ClaudeCodeProvider {
    pub fn new() -> Self {
        Self {
            protocol_state: std::sync::Mutex::new(ProtocolState::new()),
        }
    }
}

#[async_trait]
impl SessionProvider for ClaudeCodeProvider {
    async fn spawn(&self, config: SpawnConfig) -> Result<SessionHandle, ProviderError> {
        let mut cmd = Command::new("claude");

        cmd.arg("-p")
            .arg(&config.prompt)
            .arg("--output-format")
            .arg("stream-json")
            .arg("--verbose");

        if let Some(ref session_id) = config.resume_session_id {
            cmd.arg("--resume").arg(session_id);
        }

        if let Some(ref model) = config.model {
            cmd.arg("--model").arg(model);
        }

        if let Some(ref permission_mode) = config.permission_mode {
            cmd.arg("--permission-mode").arg(permission_mode);
        }

        if let Some(max_turns) = config.max_turns {
            cmd.arg("--max-turns").arg(max_turns.to_string());
        }

        cmd.current_dir(&config.working_directory);

        for (key, value) in &config.env_vars {
            cmd.env(key, value);
        }

        cmd.stdin(std::process::Stdio::piped());
        cmd.stdout(std::process::Stdio::piped());
        cmd.stderr(std::process::Stdio::piped());

        let mut child = cmd.spawn().map_err(|e| {
            ProviderError::SpawnFailed(format!("Failed to spawn claude CLI: {e}"))
        })?;

        let pid = child.id().unwrap_or(0);
        let stdin = child.stdin.take();
        let stdout = child.stdout.take();
        let stderr = child.stderr.take();

        if stdout.is_none() {
            return Err(ProviderError::SpawnFailed("Failed to capture stdout".into()));
        }

        Ok(SessionHandle {
            child,
            stdin,
            stdout,
            stderr,
            pid,
        })
    }

    async fn send_message(
        &self,
        handle: &mut SessionHandle,
        message: &str,
    ) -> Result<(), ProviderError> {
        let stdin = handle.stdin.as_mut().ok_or(ProviderError::NotRunning)?;

        let payload = serde_json::json!({
            "type": "user_message",
            "message": message
        });

        let mut line = serde_json::to_string(&payload)
            .map_err(|e| ProviderError::IoError(std::io::Error::other(e)))?;
        line.push('\n');

        stdin.write_all(line.as_bytes()).await?;
        stdin.flush().await?;

        Ok(())
    }

    async fn interrupt(&self, handle: &mut SessionHandle) -> Result<(), ProviderError> {
        let stdin = handle.stdin.as_mut().ok_or(ProviderError::NotRunning)?;

        let request_id = format!("grovekeeper_ctrl_{}", uuid::Uuid::new_v4());
        let payload = serde_json::json!({
            "type": "control_request",
            "request_id": request_id,
            "request": { "subtype": "interrupt" }
        });

        let mut line = serde_json::to_string(&payload)
            .map_err(|e| ProviderError::IoError(std::io::Error::other(e)))?;
        line.push('\n');

        stdin.write_all(line.as_bytes()).await?;
        stdin.flush().await?;

        Ok(())
    }

    async fn terminate(&self, handle: &mut SessionHandle) -> Result<(), ProviderError> {
        // Drop stdin to send EOF, then kill
        handle.stdin.take();
        handle.child.kill().await?;
        Ok(())
    }

    fn parse_event(&self, raw: &Value) -> Result<Vec<SessionEvent>, ProviderError> {
        let mut state = self
            .protocol_state
            .lock()
            .map_err(|e| ProviderError::ParseError(e.to_string()))?;
        state.map_event(raw)
    }
}
