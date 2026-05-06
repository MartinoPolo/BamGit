use std::collections::HashMap;
use std::sync::{Arc, Mutex as StdMutex};

use async_trait::async_trait;
use serde_json::Value;
use tokio::io::{AsyncBufReadExt, AsyncWriteExt, BufReader};
use tokio::process::Command;
use tokio::sync::mpsc;

use super::acp_json_rpc;
use super::cursor_event_parser::{CursorEventParser, PendingAcpServerRequest};
use super::provider::{
    ApprovalDecision, ProviderAdapter, ProviderCapabilities, ProviderError, SessionEvent,
    SessionHandle, SessionTransport, SpawnConfig,
};

pub struct CursorProvider {
    pending_server_requests: Arc<StdMutex<HashMap<String, PendingAcpServerRequest>>>,
}

impl CursorProvider {
    pub fn new() -> Self {
        Self {
            pending_server_requests: Arc::new(StdMutex::new(HashMap::new())),
        }
    }

    fn build_spawn_command(working_directory: &std::path::Path) -> Command {
        let mut cmd = Command::new("agent");
        cmd.arg("acp");
        cmd.current_dir(working_directory);
        cmd.stdin(std::process::Stdio::piped());
        cmd.stdout(std::process::Stdio::piped());
        cmd.stderr(std::process::Stdio::piped());
        #[cfg(windows)]
        {
            cmd.creation_flags(0x08000000); // CREATE_NO_WINDOW
        }
        cmd
    }

    /// Map an ApprovalDecision to the corresponding ACP option kind string.
    fn decision_to_acp_kind(decision: &ApprovalDecision) -> &'static str {
        match decision {
            ApprovalDecision::Allow => "allow_once",
            ApprovalDecision::AllowForSession => "allow_always",
            ApprovalDecision::Deny => "reject_once",
        }
    }

    /// Extract stdin, session_id, and next_request_id from an AcpJsonRpc transport.
    fn get_acp_transport(
        handle: &mut SessionHandle,
    ) -> Result<(&mut tokio::process::ChildStdin, &str, &mut u64), ProviderError> {
        match &mut handle.transport {
            SessionTransport::AcpJsonRpc {
                stdin,
                acp_session_id,
                next_request_id,
            } => {
                let stdin_ref = stdin.as_mut().ok_or(ProviderError::NotRunning)?;
                Ok((stdin_ref, acp_session_id, next_request_id))
            }
            _ => Err(ProviderError::NotRunning),
        }
    }

    /// Write a string to stdin and flush immediately.
    async fn write_and_flush(
        stdin: &mut tokio::process::ChildStdin,
        data: &str,
    ) -> Result<(), ProviderError> {
        stdin.write_all(data.as_bytes()).await?;
        stdin.flush().await?;
        Ok(())
    }

    /// Remove and return a pending server request by its request ID.
    fn take_pending_request(
        &self,
        request_id: &str,
    ) -> Result<PendingAcpServerRequest, ProviderError> {
        let pending = self
            .pending_server_requests
            .lock()
            .map_err(|e| ProviderError::ParseError(format!("Lock poisoned: {e}")))?
            .remove(request_id);
        pending.ok_or(ProviderError::NotRunning)
    }

    /// Write a JSON-RPC request to stdin, incrementing the ID counter.
    async fn write_request(
        handle: &mut SessionHandle,
        method: &str,
        params: &Value,
    ) -> Result<String, ProviderError> {
        let (stdin, _session_id, next_id) = Self::get_acp_transport(handle)?;
        *next_id += 1;
        let id = next_id.to_string();
        let line = acp_json_rpc::encode_request(&id, method, params);
        stdin.write_all(line.as_bytes()).await?;
        stdin.flush().await?;
        Ok(id)
    }

    /// Write a JSON-RPC notification to stdin (no id, no response expected).
    async fn write_notification(
        handle: &mut SessionHandle,
        method: &str,
        params: &Value,
    ) -> Result<(), ProviderError> {
        let (stdin, _session_id, _next_id) = Self::get_acp_transport(handle)?;
        let line = acp_json_rpc::encode_notification(method, params);
        stdin.write_all(line.as_bytes()).await?;
        stdin.flush().await?;
        Ok(())
    }

    /// Write a JSON-RPC response to stdin (answering a server-initiated request).
    async fn write_response(
        handle: &mut SessionHandle,
        id: &Value,
        result: &Value,
    ) -> Result<(), ProviderError> {
        let (stdin, _session_id, _next_id) = Self::get_acp_transport(handle)?;
        let line = acp_json_rpc::encode_response(id, result);
        stdin.write_all(line.as_bytes()).await?;
        stdin.flush().await?;
        Ok(())
    }

    /// Read lines from stdout until we get a JSON-RPC response matching the expected ID.
    /// Skips notifications during the handshake phase.
    async fn read_handshake_response(
        reader: &mut BufReader<tokio::process::ChildStdout>,
        line_buf: &mut String,
        expected_id: &str,
    ) -> Result<Value, ProviderError> {
        loop {
            line_buf.clear();
            let bytes_read = reader.read_line(line_buf).await?;
            if bytes_read == 0 {
                return Err(ProviderError::SpawnFailed(
                    "Agent closed during handshake".into(),
                ));
            }
            if let Ok(raw) = serde_json::from_str::<Value>(line_buf.trim()) {
                let id_matches = raw
                    .get("id")
                    .map(|id| {
                        id.as_str() == Some(expected_id)
                            || id.as_u64()
                                .map(|n| n.to_string() == expected_id)
                                .unwrap_or(false)
                    })
                    .unwrap_or(false);

                if id_matches {
                    if let Some(error) = raw.get("error") {
                        return Err(ProviderError::SpawnFailed(format!(
                            "ACP handshake error: {error}"
                        )));
                    }
                    return Ok(raw
                        .get("result")
                        .cloned()
                        .unwrap_or(Value::Object(serde_json::Map::new())));
                }
                // Skip non-matching messages (notifications during handshake)
            }
        }
    }
}

#[async_trait]
impl ProviderAdapter for CursorProvider {
    async fn spawn(
        &self,
        config: SpawnConfig,
    ) -> Result<(SessionHandle, mpsc::Receiver<SessionEvent>), ProviderError> {
        let mut cmd = Self::build_spawn_command(&config.working_directory);

        for (key, value) in &config.env_vars {
            cmd.env(key, value);
        }

        let mut child = cmd.spawn().map_err(|e| {
            ProviderError::SpawnFailed(format!("Failed to spawn agent acp: {e}"))
        })?;

        let pid = child.id().unwrap_or(0);
        let mut stdin = child
            .stdin
            .take()
            .ok_or_else(|| ProviderError::SpawnFailed("Failed to capture stdin".into()))?;
        let stdout = child
            .stdout
            .take()
            .ok_or_else(|| ProviderError::SpawnFailed("Failed to capture stdout".into()))?;
        let stderr = child.stderr.take();

        // Handshake: initialize → authenticate → session/new (or session/load)
        let mut reader = BufReader::new(stdout);
        let mut request_id_counter: u64 = 0;
        let mut line_buf = String::new();

        // 1. Initialize
        request_id_counter += 1;
        let init_id = request_id_counter.to_string();
        let init_line = acp_json_rpc::encode_request(
            &init_id,
            "initialize",
            &serde_json::json!({
                "protocolVersion": 1,
                "clientInfo": { "name": "grovekeeper", "version": "0.1.0" },
                "clientCapabilities": { "elicitation": { "form": {} } }
            }),
        );
        Self::write_and_flush(&mut stdin, &init_line).await?;
        let _init_response =
            Self::read_handshake_response(&mut reader, &mut line_buf, &init_id).await?;

        // 2. Authenticate
        request_id_counter += 1;
        let auth_id = request_id_counter.to_string();
        let auth_line = acp_json_rpc::encode_request(
            &auth_id,
            "authenticate",
            &serde_json::json!({ "methodId": "cursor_login" }),
        );
        Self::write_and_flush(&mut stdin, &auth_line).await?;
        let _auth_response =
            Self::read_handshake_response(&mut reader, &mut line_buf, &auth_id).await?;

        // 3. Session new or load
        request_id_counter += 1;
        let session_req_id = request_id_counter.to_string();
        let (method, params) = if let Some(ref resume_id) = config.resume_session_id {
            (
                "session/load",
                serde_json::json!({
                    "sessionId": resume_id,
                    "cwd": config.working_directory.to_string_lossy(),
                    "mcpServers": []
                }),
            )
        } else {
            (
                "session/new",
                serde_json::json!({
                    "cwd": config.working_directory.to_string_lossy(),
                    "mcpServers": []
                }),
            )
        };
        let session_line = acp_json_rpc::encode_request(&session_req_id, method, &params);
        Self::write_and_flush(&mut stdin, &session_line).await?;
        let session_result =
            Self::read_handshake_response(&mut reader, &mut line_buf, &session_req_id).await?;

        let acp_session_id = session_result
            .get("sessionId")
            .and_then(|v| v.as_str())
            .unwrap_or("")
            .to_string();

        let current_model = session_result
            .get("models")
            .and_then(|m| m.get("currentModelId"))
            .and_then(|v| v.as_str())
            .unwrap_or("")
            .to_string();

        // Event channel
        let (event_sender, event_receiver) = mpsc::channel::<SessionEvent>(256);

        // Emit SessionInit + RunState
        let _ = event_sender
            .send(SessionEvent::SessionInit {
                session_id: acp_session_id.clone(),
                model: current_model,
                tools: vec![],
            })
            .await;
        let _ = event_sender
            .send(SessionEvent::RunState {
                state: "running".into(),
                error: None,
            })
            .await;

        // Background stdout reader
        let pending_requests = Arc::clone(&self.pending_server_requests);
        let stdout_sender = event_sender.clone();
        tokio::spawn(async move {
            let mut parser = CursorEventParser::new();
            let mut lines = reader.lines();
            while let Ok(Some(line)) = lines.next_line().await {
                if let Ok(raw) = serde_json::from_str::<Value>(&line) {
                    let events = parser.handle_message(&raw, &pending_requests);
                    for event in events {
                        if stdout_sender.send(event).await.is_err() {
                            return;
                        }
                    }
                }
            }
        });

        // Stderr reader
        if let Some(stderr) = stderr {
            let stderr_sender = event_sender;
            tokio::spawn(async move {
                let mut stderr_reader = BufReader::new(stderr).lines();
                while let Ok(Some(line)) = stderr_reader.next_line().await {
                    if stderr_sender
                        .send(SessionEvent::Raw {
                            source: "stderr".into(),
                            data: Value::String(line),
                        })
                        .await
                        .is_err()
                    {
                        return;
                    }
                }
            });
        }

        // Send initial prompt if non-empty
        if !config.prompt.is_empty() {
            request_id_counter += 1;
            let prompt_id = request_id_counter.to_string();
            let prompt_line = acp_json_rpc::encode_request(
                &prompt_id,
                "session/prompt",
                &serde_json::json!({
                    "sessionId": acp_session_id,
                    "prompt": [{ "type": "text", "text": config.prompt }]
                }),
            );
            Self::write_and_flush(&mut stdin, &prompt_line).await?;
        }

        // Set mode if specified
        if let Some(ref mode) = config.permission_mode {
            request_id_counter += 1;
            let mode_id = request_id_counter.to_string();
            let mode_line = acp_json_rpc::encode_request(
                &mode_id,
                "session/set_mode",
                &serde_json::json!({
                    "sessionId": acp_session_id,
                    "modeId": mode
                }),
            );
            Self::write_and_flush(&mut stdin, &mode_line).await?;
        }

        // Set model if specified
        if let Some(ref model) = config.model {
            request_id_counter += 1;
            let model_req_id = request_id_counter.to_string();
            let model_line = acp_json_rpc::encode_request(
                &model_req_id,
                "session/set_model",
                &serde_json::json!({
                    "sessionId": acp_session_id,
                    "modelId": model
                }),
            );
            Self::write_and_flush(&mut stdin, &model_line).await?;
        }

        let handle = SessionHandle {
            child,
            pid,
            transport: SessionTransport::AcpJsonRpc {
                stdin: Some(stdin),
                acp_session_id,
                next_request_id: request_id_counter,
            },
        };

        Ok((handle, event_receiver))
    }

    async fn send_turn(
        &self,
        handle: &mut SessionHandle,
        message: &str,
    ) -> Result<(), ProviderError> {
        let SessionTransport::AcpJsonRpc {
            ref acp_session_id, ..
        } = handle.transport
        else {
            return Err(ProviderError::NotRunning);
        };
        // clone needed: acp_session_id borrows handle, but write_request needs &mut handle
        let session_id = acp_session_id.clone();
        Self::write_request(
            handle,
            "session/prompt",
            &serde_json::json!({
                "sessionId": session_id,
                "prompt": [{ "type": "text", "text": message }]
            }),
        )
        .await?;
        Ok(())
    }

    async fn respond_to_request(
        &self,
        handle: &mut SessionHandle,
        request_id: &str,
        decision: &ApprovalDecision,
    ) -> Result<(), ProviderError> {
        let pending = self.take_pending_request(request_id)?;
        let target_kind = Self::decision_to_acp_kind(decision);

        let option_id = pending
            .permission_options
            .as_ref()
            .and_then(|opts| opts.iter().find(|o| o.kind == target_kind))
            .map(|o| o.option_id.clone())
            .unwrap_or_else(|| target_kind.replace('_', "-"));

        let result = serde_json::json!({
            "outcome": { "outcome": "selected", "optionId": option_id }
        });
        Self::write_response(handle, &pending.json_rpc_id, &result).await
    }

    async fn respond_to_user_input(
        &self,
        handle: &mut SessionHandle,
        request_id: &str,
        answers: &Value,
    ) -> Result<(), ProviderError> {
        let pending = self.take_pending_request(request_id)?;
        let result = serde_json::json!({
            "action": { "action": "accept", "content": answers }
        });
        Self::write_response(handle, &pending.json_rpc_id, &result).await
    }

    fn capabilities(&self) -> ProviderCapabilities {
        ProviderCapabilities {
            supports_spawn: true,
            supports_discovery: false,
            supports_mid_session_mode_switch: true,
            supports_mid_session_model_switch: true,
            supported_image_types: vec![
                "image/png".into(),
                "image/jpeg".into(),
                "image/webp".into(),
            ],
            available_permission_modes: vec![], // ACP modes are dynamic, returned at session creation
        }
    }

    async fn interrupt(&self, handle: &mut SessionHandle) -> Result<(), ProviderError> {
        let SessionTransport::AcpJsonRpc {
            ref acp_session_id, ..
        } = handle.transport
        else {
            return Err(ProviderError::NotRunning);
        };
        // clone needed: acp_session_id borrows handle, but write_notification needs &mut handle
        let session_id = acp_session_id.clone();
        Self::write_notification(
            handle,
            "session/cancel",
            &serde_json::json!({ "sessionId": session_id }),
        )
        .await
    }

    async fn terminate(&self, handle: &mut SessionHandle) -> Result<(), ProviderError> {
        if let SessionTransport::AcpJsonRpc { stdin, .. } = &mut handle.transport {
            stdin.take();
        }
        handle.child.kill().await?;
        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use super::super::cursor_event_parser::AcpPermissionOption;
    use serde_json::json;
    use std::path::PathBuf;
    use tokio::io::AsyncReadExt;

    struct EchoHandle {
        handle: SessionHandle,
        stdout: Option<tokio::process::ChildStdout>,
    }

    impl EchoHandle {
        async fn read_output(&mut self) -> String {
            if let SessionTransport::AcpJsonRpc { stdin, .. } = &mut self.handle.transport {
                stdin.take();
            }
            let mut output = String::new();
            if let Some(mut stdout) = self.stdout.take() {
                stdout.read_to_string(&mut output).await.unwrap();
            }
            output
        }
    }

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
                transport: SessionTransport::AcpJsonRpc {
                    stdin,
                    acp_session_id: "test-session-123".into(),
                    next_request_id: 0,
                },
            },
            stdout,
        }
    }

    fn dummy_child() -> tokio::process::Child {
        tokio::process::Command::new("cmd")
            .args(["/C", "echo test"])
            .stdin(std::process::Stdio::null())
            .stdout(std::process::Stdio::null())
            .stderr(std::process::Stdio::null())
            .spawn()
            .unwrap()
    }

    #[test]
    fn cursor_capabilities_returns_correct_values() {
        let provider = CursorProvider::new();
        let caps = provider.capabilities();
        assert!(caps.supports_spawn);
        assert!(!caps.supports_discovery);
        assert!(caps.supports_mid_session_mode_switch);
        assert!(caps.supports_mid_session_model_switch);
        assert_eq!(
            caps.supported_image_types,
            vec!["image/png", "image/jpeg", "image/webp"]
        );
        assert!(caps.available_permission_modes.is_empty());
    }

    #[test]
    fn build_spawn_command_uses_agent_acp_args() {
        let cmd = CursorProvider::build_spawn_command(&PathBuf::from("C:\\tmp"));
        let prog = cmd.as_std().get_program().to_str().unwrap();
        assert_eq!(prog, "agent");
        let args: Vec<&str> = cmd
            .as_std()
            .get_args()
            .filter_map(|a| a.to_str())
            .collect();
        assert_eq!(args, vec!["acp"]);
    }

    #[test]
    fn decision_to_acp_kind_maps_correctly() {
        assert_eq!(
            CursorProvider::decision_to_acp_kind(&ApprovalDecision::Allow),
            "allow_once"
        );
        assert_eq!(
            CursorProvider::decision_to_acp_kind(&ApprovalDecision::AllowForSession),
            "allow_always"
        );
        assert_eq!(
            CursorProvider::decision_to_acp_kind(&ApprovalDecision::Deny),
            "reject_once"
        );
    }

    #[tokio::test]
    async fn send_turn_writes_session_prompt_to_stdin() {
        let provider = CursorProvider::new();
        let mut eh = echo();

        provider
            .send_turn(&mut eh.handle, "fix the bug")
            .await
            .unwrap();

        let output = eh.read_output().await;
        let parsed: Value = serde_json::from_str(output.trim()).unwrap();
        assert_eq!(parsed["jsonrpc"], "2.0");
        assert_eq!(parsed["method"], "session/prompt");
        assert_eq!(parsed["params"]["sessionId"], "test-session-123");
        assert_eq!(parsed["params"]["prompt"][0]["type"], "text");
        assert_eq!(parsed["params"]["prompt"][0]["text"], "fix the bug");
    }

    #[tokio::test]
    async fn interrupt_writes_session_cancel_to_stdin() {
        let provider = CursorProvider::new();
        let mut eh = echo();

        provider.interrupt(&mut eh.handle).await.unwrap();

        let output = eh.read_output().await;
        let parsed: Value = serde_json::from_str(output.trim()).unwrap();
        assert_eq!(parsed["jsonrpc"], "2.0");
        assert_eq!(parsed["method"], "session/cancel");
        assert_eq!(parsed["params"]["sessionId"], "test-session-123");
        // Notifications should not have an id field
        assert!(
            parsed.get("id").is_none(),
            "Notification should not have id"
        );
    }

    #[tokio::test]
    async fn respond_to_request_writes_permission_response() {
        let provider = CursorProvider::new();
        let mut eh = echo();

        // Pre-populate pending request
        {
            let mut map = provider.pending_server_requests.lock().unwrap();
            map.insert(
                "srv-req-1".into(),
                PendingAcpServerRequest {
                    json_rpc_id: json!("srv-req-1"),
                    permission_options: Some(vec![
                        AcpPermissionOption {
                            option_id: "opt-allow".into(),
                            kind: "allow_once".into(),
                        },
                        AcpPermissionOption {
                            option_id: "opt-reject".into(),
                            kind: "reject_once".into(),
                        },
                    ]),
                },
            );
        }

        provider
            .respond_to_request(&mut eh.handle, "srv-req-1", &ApprovalDecision::Allow)
            .await
            .unwrap();

        let output = eh.read_output().await;
        let parsed: Value = serde_json::from_str(output.trim()).unwrap();
        assert_eq!(parsed["jsonrpc"], "2.0");
        assert_eq!(parsed["id"], "srv-req-1");
        assert_eq!(parsed["result"]["outcome"]["outcome"], "selected");
        assert_eq!(parsed["result"]["outcome"]["optionId"], "opt-allow");
    }

    #[tokio::test]
    async fn respond_to_request_returns_error_when_no_pending() {
        let provider = CursorProvider::new();
        let mut eh = echo();

        let result = provider
            .respond_to_request(&mut eh.handle, "nonexistent", &ApprovalDecision::Allow)
            .await;

        assert!(result.is_err());
        assert_eq!(result.unwrap_err().to_string(), "session not running");
    }

    #[tokio::test]
    async fn respond_to_user_input_returns_error_when_no_pending() {
        let provider = CursorProvider::new();
        let mut eh = echo();

        let result = provider
            .respond_to_user_input(&mut eh.handle, "nonexistent", &json!({}))
            .await;

        assert!(result.is_err());
        assert_eq!(result.unwrap_err().to_string(), "session not running");
    }

    #[tokio::test]
    async fn respond_to_user_input_writes_elicitation_response() {
        let provider = CursorProvider::new();
        let mut eh = echo();

        // Pre-populate pending request
        {
            let mut map = provider.pending_server_requests.lock().unwrap();
            map.insert(
                "srv-req-2".into(),
                PendingAcpServerRequest {
                    json_rpc_id: json!("srv-req-2"),
                    permission_options: None,
                },
            );
        }

        let answers = json!({"confirmed": true, "path": "/tmp"});
        provider
            .respond_to_user_input(&mut eh.handle, "srv-req-2", &answers)
            .await
            .unwrap();

        let output = eh.read_output().await;
        let parsed: Value = serde_json::from_str(output.trim()).unwrap();
        assert_eq!(parsed["jsonrpc"], "2.0");
        assert_eq!(parsed["id"], "srv-req-2");
        assert_eq!(parsed["result"]["action"]["action"], "accept");
        assert_eq!(parsed["result"]["action"]["content"]["confirmed"], true);
        assert_eq!(parsed["result"]["action"]["content"]["path"], "/tmp");
    }

    #[tokio::test]
    async fn terminate_kills_child_and_drops_stdin() {
        let provider = CursorProvider::new();
        let child = dummy_child();
        let pid = child.id().unwrap_or(0);
        let mut handle = SessionHandle {
            child,
            pid,
            transport: SessionTransport::AcpJsonRpc {
                stdin: None,
                acp_session_id: "test".into(),
                next_request_id: 0,
            },
        };

        let result = provider.terminate(&mut handle).await;
        assert!(result.is_ok());
        // After terminate, stdin should be None
        if let SessionTransport::AcpJsonRpc { stdin, .. } = &handle.transport {
            assert!(stdin.is_none());
        } else {
            panic!("Expected AcpJsonRpc transport");
        }
    }

    #[tokio::test]
    async fn get_acp_transport_returns_not_running_for_wrong_variant() {
        let child = dummy_child();
        let pid = child.id().unwrap_or(0);
        let mut handle = SessionHandle {
            child,
            pid,
            transport: SessionTransport::Stdio { stdin: None },
        };

        let result = CursorProvider::get_acp_transport(&mut handle);
        assert!(result.is_err());
        assert_eq!(result.unwrap_err().to_string(), "session not running");
    }
}
