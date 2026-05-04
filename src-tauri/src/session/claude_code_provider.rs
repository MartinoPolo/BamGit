use async_trait::async_trait;
use serde_json::Value;
use tokio::io::AsyncWriteExt;
use tokio::process::Command;

use super::protocol_parser::ProtocolState;
use super::provider::{
    ApprovalDecision, ProviderAdapter, ProviderCapabilities, ProviderError, SessionEvent,
    SessionHandle, SpawnConfig,
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
impl ProviderAdapter for ClaudeCodeProvider {
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

    async fn send_turn(
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

    async fn respond_to_request(
        &self,
        handle: &mut SessionHandle,
        request_id: &str,
        decision: &ApprovalDecision,
    ) -> Result<(), ProviderError> {
        let stdin = handle.stdin.as_mut().ok_or(ProviderError::NotRunning)?;

        let payload = serde_json::json!({
            "type": "control_response",
            "request_id": request_id,
            "response": {
                "subtype": "can_use_tool",
                "decision": decision.as_str()
            }
        });

        let mut line = serde_json::to_string(&payload)
            .map_err(|e| ProviderError::IoError(std::io::Error::other(e)))?;
        line.push('\n');

        stdin.write_all(line.as_bytes()).await?;
        stdin.flush().await?;

        Ok(())
    }

    async fn respond_to_user_input(
        &self,
        handle: &mut SessionHandle,
        request_id: &str,
        answers: &Value,
    ) -> Result<(), ProviderError> {
        let stdin = handle.stdin.as_mut().ok_or(ProviderError::NotRunning)?;

        let payload = serde_json::json!({
            "type": "control_response",
            "request_id": request_id,
            "response": {
                "subtype": "elicitation",
                "answers": answers
            }
        });

        let mut line = serde_json::to_string(&payload)
            .map_err(|e| ProviderError::IoError(std::io::Error::other(e)))?;
        line.push('\n');

        stdin.write_all(line.as_bytes()).await?;
        stdin.flush().await?;

        Ok(())
    }

    fn capabilities(&self) -> ProviderCapabilities {
        ProviderCapabilities {
            supports_spawn: true,
            supports_discovery: true,
            supports_mid_session_mode_switch: true,
            supports_mid_session_model_switch: true,
            supported_image_types: vec![
                "image/gif".into(),
                "image/jpeg".into(),
                "image/png".into(),
                "image/webp".into(),
            ],
            available_permission_modes: vec![
                "default".into(),
                "plan".into(),
                "bypassPermissions".into(),
            ],
        }
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

#[cfg(test)]
mod tests {
    use super::*;
    use super::super::provider::{ApprovalDecision, ProviderAdapter};
    use serde_json::json;
    use tokio::io::AsyncReadExt;

    // Helper: spawn a subprocess whose stdout echoes stdin lines,
    // giving us a real ChildStdin/ChildStdout pair for integration tests.
    fn spawn_echo_process() -> SessionHandle {
        let mut child = tokio::process::Command::new("findstr")
            .arg(".")
            .stdin(std::process::Stdio::piped())
            .stdout(std::process::Stdio::piped())
            .stderr(std::process::Stdio::null())
            .spawn()
            .expect("findstr must be available on Windows");

        let pid = child.id().unwrap_or(0);
        let stdin = child.stdin.take();
        let stdout = child.stdout.take();

        SessionHandle {
            child,
            stdin,
            stdout,
            stderr: None,
            pid,
        }
    }

    // ─── Behavior 2: ApprovalDecision::as_str ──────────────────────────────

    #[test]
    fn approval_decision_allow_as_str() {
        assert_eq!(ApprovalDecision::Allow.as_str(), "allow");
    }

    #[test]
    fn approval_decision_deny_as_str() {
        assert_eq!(ApprovalDecision::Deny.as_str(), "deny");
    }

    #[test]
    fn approval_decision_allow_for_session_as_str() {
        assert_eq!(ApprovalDecision::AllowForSession.as_str(), "allow_for_session");
    }

    // ─── Behavior 6: ClaudeCodeProvider capabilities ───────────────────────

    #[test]
    fn capabilities_returns_all_true_for_claude_code() {
        let provider = ClaudeCodeProvider::new();
        let capabilities = provider.capabilities();
        assert!(capabilities.supports_spawn);
        assert!(capabilities.supports_discovery);
        assert!(capabilities.supports_mid_session_mode_switch);
        assert!(capabilities.supports_mid_session_model_switch);
        assert_eq!(
            capabilities.supported_image_types,
            vec!["image/gif", "image/jpeg", "image/png", "image/webp"]
        );
        assert_eq!(
            capabilities.available_permission_modes,
            vec!["default", "plan", "bypassPermissions"]
        );
    }

    // ─── Behavior 4: respond_to_request sends correct JSON ─────────────────

    #[tokio::test]
    async fn respond_to_request_sends_control_response_allow() {
        let provider = ClaudeCodeProvider::new();
        let mut handle = spawn_echo_process();

        provider
            .respond_to_request(&mut handle, "req_123", &ApprovalDecision::Allow)
            .await
            .unwrap();

        // Close stdin so the echo process exits and we can read stdout
        handle.stdin.take();

        let mut output = String::new();
        if let Some(mut stdout) = handle.stdout.take() {
            stdout.read_to_string(&mut output).await.unwrap();
        }

        let parsed: serde_json::Value = serde_json::from_str(output.trim()).unwrap();
        assert_eq!(parsed["type"], "control_response");
        assert_eq!(parsed["request_id"], "req_123");
        assert_eq!(parsed["response"]["subtype"], "can_use_tool");
        assert_eq!(parsed["response"]["decision"], "allow");
    }

    #[tokio::test]
    async fn respond_to_request_sends_deny_decision() {
        let provider = ClaudeCodeProvider::new();
        let mut handle = spawn_echo_process();

        provider
            .respond_to_request(&mut handle, "req_456", &ApprovalDecision::Deny)
            .await
            .unwrap();

        handle.stdin.take();

        let mut output = String::new();
        if let Some(mut stdout) = handle.stdout.take() {
            stdout.read_to_string(&mut output).await.unwrap();
        }

        let parsed: serde_json::Value = serde_json::from_str(output.trim()).unwrap();
        assert_eq!(parsed["response"]["decision"], "deny");
    }

    #[tokio::test]
    async fn respond_to_request_sends_allow_for_session_decision() {
        let provider = ClaudeCodeProvider::new();
        let mut handle = spawn_echo_process();

        provider
            .respond_to_request(&mut handle, "req_789", &ApprovalDecision::AllowForSession)
            .await
            .unwrap();

        handle.stdin.take();

        let mut output = String::new();
        if let Some(mut stdout) = handle.stdout.take() {
            stdout.read_to_string(&mut output).await.unwrap();
        }

        let parsed: serde_json::Value = serde_json::from_str(output.trim()).unwrap();
        assert_eq!(parsed["response"]["decision"], "allow_for_session");
    }

    // ─── Behavior 5: respond_to_user_input sends correct JSON ──────────────

    #[tokio::test]
    async fn respond_to_user_input_sends_elicitation_response() {
        let provider = ClaudeCodeProvider::new();
        let mut handle = spawn_echo_process();

        let answers = json!({"name": "test", "confirmed": true});
        provider
            .respond_to_user_input(&mut handle, "req_eli_1", &answers)
            .await
            .unwrap();

        handle.stdin.take();

        let mut output = String::new();
        if let Some(mut stdout) = handle.stdout.take() {
            stdout.read_to_string(&mut output).await.unwrap();
        }

        let parsed: serde_json::Value = serde_json::from_str(output.trim()).unwrap();
        assert_eq!(parsed["type"], "control_response");
        assert_eq!(parsed["request_id"], "req_eli_1");
        assert_eq!(parsed["response"]["subtype"], "elicitation");
        assert_eq!(parsed["response"]["answers"]["name"], "test");
        assert_eq!(parsed["response"]["answers"]["confirmed"], true);
    }

    // ─── Behavior 7: send_turn (renamed from send_message) ─────────────────

    #[tokio::test]
    async fn send_turn_sends_user_message_format() {
        let provider = ClaudeCodeProvider::new();
        let mut handle = spawn_echo_process();

        provider
            .send_turn(&mut handle, "hello world")
            .await
            .unwrap();

        handle.stdin.take();

        let mut output = String::new();
        if let Some(mut stdout) = handle.stdout.take() {
            stdout.read_to_string(&mut output).await.unwrap();
        }

        let parsed: serde_json::Value = serde_json::from_str(output.trim()).unwrap();
        assert_eq!(parsed["type"], "user_message");
        assert_eq!(parsed["message"], "hello world");
    }

    // ─── Behavior 8: NotRunning when stdin is None ──────────────────────────

    #[tokio::test]
    async fn respond_to_request_returns_not_running_when_stdin_gone() {
        let provider = ClaudeCodeProvider::new();
        let mut handle = spawn_echo_process();
        handle.stdin.take(); // Remove stdin

        let result = provider
            .respond_to_request(&mut handle, "req_x", &ApprovalDecision::Allow)
            .await;

        assert!(result.is_err());
        let error_message = result.unwrap_err().to_string();
        assert_eq!(error_message, "session not running");
    }

    #[tokio::test]
    async fn respond_to_user_input_returns_not_running_when_stdin_gone() {
        let provider = ClaudeCodeProvider::new();
        let mut handle = spawn_echo_process();
        handle.stdin.take(); // Remove stdin

        let result = provider
            .respond_to_user_input(&mut handle, "req_y", &json!({}))
            .await;

        assert!(result.is_err());
        let error_message = result.unwrap_err().to_string();
        assert_eq!(error_message, "session not running");
    }
}
