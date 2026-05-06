use async_trait::async_trait;
use serde_json::Value;
use tokio::io::{AsyncBufReadExt, AsyncWriteExt, BufReader};
use tokio::process::Command;
use tokio::sync::mpsc;

use super::protocol_parser::ProtocolState;
use super::provider::{
    ApprovalDecision, ProviderAdapter, ProviderCapabilities, ProviderError, SessionEvent,
    SessionHandle, SessionTransport, SpawnConfig,
};

pub struct ClaudeCodeProvider;

impl ClaudeCodeProvider {
    pub fn new() -> Self {
        Self
    }

    fn get_stdin(
        handle: &mut SessionHandle,
    ) -> Result<&mut tokio::process::ChildStdin, ProviderError> {
        match &mut handle.transport {
            SessionTransport::Stdio { stdin } => stdin.as_mut().ok_or(ProviderError::NotRunning),
            _ => Err(ProviderError::NotRunning),
        }
    }

    async fn write_json(
        handle: &mut SessionHandle,
        payload: &Value,
    ) -> Result<(), ProviderError> {
        let stdin = Self::get_stdin(handle)?;
        let mut line = serde_json::to_string(payload)
            .map_err(|e| ProviderError::IoError(std::io::Error::other(e)))?;
        line.push('\n');
        stdin.write_all(line.as_bytes()).await?;
        stdin.flush().await?;
        Ok(())
    }
}

#[async_trait]
impl ProviderAdapter for ClaudeCodeProvider {
    async fn spawn(
        &self,
        config: SpawnConfig,
    ) -> Result<(SessionHandle, mpsc::Receiver<SessionEvent>), ProviderError> {
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
        let stdout = child
            .stdout
            .take()
            .ok_or_else(|| ProviderError::SpawnFailed("Failed to capture stdout".into()))?;
        let stderr = child.stderr.take();

        let (event_sender, event_receiver) = mpsc::channel::<SessionEvent>(256);

        // Spawn stdout reader — parses stream-JSON into SessionEvents
        let stdout_sender = event_sender.clone();
        tokio::spawn(async move {
            let mut protocol_state = ProtocolState::new();
            let mut reader = BufReader::new(stdout).lines();
            while let Ok(Some(line)) = reader.next_line().await {
                if let Ok(raw) = serde_json::from_str::<Value>(&line) {
                    match protocol_state.map_event(&raw) {
                        Ok(events) => {
                            for event in events {
                                if stdout_sender.send(event).await.is_err() {
                                    return;
                                }
                            }
                        }
                        Err(e) => log::warn!("Parse error: {e}"),
                    }
                }
            }
        });

        if let Some(stderr) = stderr {
            tokio::spawn(async move {
                let mut reader = BufReader::new(stderr).lines();
                while let Ok(Some(line)) = reader.next_line().await {
                    let raw_event = SessionEvent::Raw {
                        source: "stderr".into(),
                        data: Value::String(line),
                    };
                    if event_sender.send(raw_event).await.is_err() {
                        return;
                    }
                }
            });
        }

        let handle = SessionHandle {
            child,
            pid,
            transport: SessionTransport::Stdio { stdin },
        };

        Ok((handle, event_receiver))
    }

    async fn send_turn(
        &self,
        handle: &mut SessionHandle,
        message: &str,
    ) -> Result<(), ProviderError> {
        let payload = serde_json::json!({
            "type": "user_message",
            "message": message
        });
        Self::write_json(handle, &payload).await
    }

    async fn respond_to_request(
        &self,
        handle: &mut SessionHandle,
        request_id: &str,
        decision: &ApprovalDecision,
    ) -> Result<(), ProviderError> {
        let payload = serde_json::json!({
            "type": "control_response",
            "request_id": request_id,
            "response": {
                "subtype": "can_use_tool",
                "decision": decision.as_str()
            }
        });
        Self::write_json(handle, &payload).await
    }

    async fn respond_to_user_input(
        &self,
        handle: &mut SessionHandle,
        request_id: &str,
        answers: &Value,
    ) -> Result<(), ProviderError> {
        let payload = serde_json::json!({
            "type": "control_response",
            "request_id": request_id,
            "response": {
                "subtype": "elicitation",
                "answers": answers
            }
        });
        Self::write_json(handle, &payload).await
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
        let request_id = format!("grovekeeper_ctrl_{}", uuid::Uuid::new_v4());
        let payload = serde_json::json!({
            "type": "control_request",
            "request_id": request_id,
            "request": { "subtype": "interrupt" }
        });
        Self::write_json(handle, &payload).await
    }

    async fn terminate(&self, handle: &mut SessionHandle) -> Result<(), ProviderError> {
        if let SessionTransport::Stdio { stdin } = &mut handle.transport {
            stdin.take();
        }
        handle.child.kill().await?;
        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use super::super::provider::{ApprovalDecision, ProviderAdapter};
    use serde_json::json;
    use tokio::io::AsyncReadExt;

    struct EchoHandle {
        handle: SessionHandle,
        stdout: Option<tokio::process::ChildStdout>,
    }

    impl From<(SessionHandle, Option<tokio::process::ChildStdout>)> for EchoHandle {
        fn from((handle, stdout): (SessionHandle, Option<tokio::process::ChildStdout>)) -> Self {
            Self { handle, stdout }
        }
    }

    impl EchoHandle {
        async fn read_output(&mut self) -> String {
            if let SessionTransport::Stdio { stdin } = &mut self.handle.transport {
                stdin.take();
            }
            let mut output = String::new();
            if let Some(mut stdout) = self.stdout.take() {
                stdout.read_to_string(&mut output).await.unwrap();
            }
            output
        }
    }

    // Re-wrap spawn_echo_process to return EchoHandle
    fn echo() -> EchoHandle {
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

        EchoHandle {
            handle: SessionHandle {
                child,
                pid,
                transport: SessionTransport::Stdio { stdin },
            },
            stdout,
        }
    }

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

    #[tokio::test]
    async fn respond_to_request_sends_control_response_allow() {
        let provider = ClaudeCodeProvider::new();
        let mut eh = echo();

        provider
            .respond_to_request(&mut eh.handle, "req_123", &ApprovalDecision::Allow)
            .await
            .unwrap();

        let output = eh.read_output().await;
        let parsed: serde_json::Value = serde_json::from_str(output.trim()).unwrap();
        assert_eq!(parsed["type"], "control_response");
        assert_eq!(parsed["request_id"], "req_123");
        assert_eq!(parsed["response"]["subtype"], "can_use_tool");
        assert_eq!(parsed["response"]["decision"], "allow");
    }

    #[tokio::test]
    async fn respond_to_request_sends_deny_decision() {
        let provider = ClaudeCodeProvider::new();
        let mut eh = echo();

        provider
            .respond_to_request(&mut eh.handle, "req_456", &ApprovalDecision::Deny)
            .await
            .unwrap();

        let output = eh.read_output().await;
        let parsed: serde_json::Value = serde_json::from_str(output.trim()).unwrap();
        assert_eq!(parsed["response"]["decision"], "deny");
    }

    #[tokio::test]
    async fn respond_to_request_sends_allow_for_session_decision() {
        let provider = ClaudeCodeProvider::new();
        let mut eh = echo();

        provider
            .respond_to_request(&mut eh.handle, "req_789", &ApprovalDecision::AllowForSession)
            .await
            .unwrap();

        let output = eh.read_output().await;
        let parsed: serde_json::Value = serde_json::from_str(output.trim()).unwrap();
        assert_eq!(parsed["response"]["decision"], "allow_for_session");
    }

    #[tokio::test]
    async fn respond_to_user_input_sends_elicitation_response() {
        let provider = ClaudeCodeProvider::new();
        let mut eh = echo();

        let answers = json!({"name": "test", "confirmed": true});
        provider
            .respond_to_user_input(&mut eh.handle, "req_eli_1", &answers)
            .await
            .unwrap();

        let output = eh.read_output().await;
        let parsed: serde_json::Value = serde_json::from_str(output.trim()).unwrap();
        assert_eq!(parsed["type"], "control_response");
        assert_eq!(parsed["request_id"], "req_eli_1");
        assert_eq!(parsed["response"]["subtype"], "elicitation");
        assert_eq!(parsed["response"]["answers"]["name"], "test");
        assert_eq!(parsed["response"]["answers"]["confirmed"], true);
    }

    #[tokio::test]
    async fn send_turn_sends_user_message_format() {
        let provider = ClaudeCodeProvider::new();
        let mut eh = echo();

        provider.send_turn(&mut eh.handle, "hello world").await.unwrap();

        let output = eh.read_output().await;
        let parsed: serde_json::Value = serde_json::from_str(output.trim()).unwrap();
        assert_eq!(parsed["type"], "user_message");
        assert_eq!(parsed["message"], "hello world");
    }

    #[tokio::test]
    async fn respond_to_request_returns_not_running_when_stdin_gone() {
        let provider = ClaudeCodeProvider::new();
        let mut eh = echo();
        if let SessionTransport::Stdio { stdin } = &mut eh.handle.transport {
            stdin.take();
        }

        let result = provider
            .respond_to_request(&mut eh.handle, "req_x", &ApprovalDecision::Allow)
            .await;

        assert!(result.is_err());
        assert_eq!(result.unwrap_err().to_string(), "session not running");
    }

    #[tokio::test]
    async fn respond_to_user_input_returns_not_running_when_stdin_gone() {
        let provider = ClaudeCodeProvider::new();
        let mut eh = echo();
        if let SessionTransport::Stdio { stdin } = &mut eh.handle.transport {
            stdin.take();
        }

        let result = provider
            .respond_to_user_input(&mut eh.handle, "req_y", &json!({}))
            .await;

        assert!(result.is_err());
        assert_eq!(result.unwrap_err().to_string(), "session not running");
    }
}
