use std::time::Duration;

use async_trait::async_trait;
use futures_util::StreamExt;
use serde_json::Value;
use tokio::io::{AsyncBufReadExt, BufReader};
use tokio::process::Command;
use tokio::sync::mpsc;

use super::opencode_event_parser::{
    approval_to_opencode_reply, parse_model_slug, parse_opencode_event,
    parse_server_url_from_output,
};
use super::provider::{
    ApprovalDecision, ProviderAdapter, ProviderCapabilities, ProviderError, SessionEvent,
    SessionHandle, SessionTransport, SpawnConfig,
};

const SERVER_STARTUP_TIMEOUT: Duration = Duration::from_secs(10);

pub struct OpenCodeProvider;

impl OpenCodeProvider {
    pub fn new() -> Self {
        Self
    }

    fn get_http(
        handle: &SessionHandle,
    ) -> Result<(&str, &str, &reqwest::Client), ProviderError> {
        match &handle.transport {
            SessionTransport::Http {
                base_url,
                opencode_session_id,
                http_client,
            } => Ok((base_url, opencode_session_id, http_client)),
            _ => Err(ProviderError::NotRunning),
        }
    }
}

async fn check_response(
    response: reqwest::Response,
    context: &str,
) -> Result<reqwest::Response, ProviderError> {
    if !response.status().is_success() {
        let status = response.status();
        let body = response.text().await.unwrap_or_default();
        return Err(ProviderError::HttpError(format!(
            "{context} returned {status}: {body}"
        )));
    }
    Ok(response)
}

async fn post_json(
    client: &reqwest::Client,
    url: &str,
    body: &Value,
    context: &str,
) -> Result<reqwest::Response, ProviderError> {
    let response = client
        .post(url)
        .json(body)
        .send()
        .await
        .map_err(|e| ProviderError::HttpError(format!("{context} failed: {e}")))?;
    check_response(response, context).await
}

#[async_trait]
impl ProviderAdapter for OpenCodeProvider {
    async fn spawn(
        &self,
        config: SpawnConfig,
    ) -> Result<(SessionHandle, mpsc::Receiver<SessionEvent>), ProviderError> {
        let port = portpicker::pick_unused_port()
            .ok_or_else(|| ProviderError::SpawnFailed("No available port".into()))?;

        let hostname = "127.0.0.1";
        let mut cmd = Command::new("opencode");
        cmd.arg("serve")
            .arg(format!("--hostname={hostname}"))
            .arg(format!("--port={port}"));

        cmd.current_dir(&config.working_directory);
        cmd.stdin(std::process::Stdio::null());
        cmd.stdout(std::process::Stdio::piped());
        cmd.stderr(std::process::Stdio::null());

        #[cfg(windows)]
        {
            cmd.creation_flags(0x08000000); // CREATE_NO_WINDOW
        }

        let mut child = cmd.spawn().map_err(|e| {
            ProviderError::SpawnFailed(format!("Failed to spawn opencode: {e}"))
        })?;

        let pid = child.id().unwrap_or(0);
        let stdout = child
            .stdout
            .take()
            .ok_or_else(|| ProviderError::SpawnFailed("Failed to capture stdout".into()))?;

        let base_url = match wait_for_server_ready(stdout, SERVER_STARTUP_TIMEOUT).await {
            Ok(url) => url,
            Err(e) => {
                let _ = child.kill().await;
                return Err(e);
            }
        };

        let http_client = reqwest::Client::new();

        let setup_result =
            setup_opencode_session(&http_client, &base_url, &config).await;

        let (opencode_session_id, event_sender, event_receiver) = match setup_result {
            Ok(result) => result,
            Err(e) => {
                let _ = child.kill().await;
                return Err(e);
            }
        };

        // Emit SessionInit so the actor persists the cli_session_id
        let _ = event_sender
            .send(SessionEvent::SessionInit {
                session_id: opencode_session_id.clone(),
                model: config.model.clone().unwrap_or_default(),
                tools: vec![],
            })
            .await;

        let sse_url = format!("{base_url}/event");
        let sse_client = http_client.clone();
        let filter_session_id = opencode_session_id.clone();

        tokio::spawn(async move {
            if let Err(e) = run_sse_event_loop(
                &sse_client,
                &sse_url,
                &filter_session_id,
                &event_sender,
            )
            .await
            {
                log::error!("SSE event loop error: {e}");
                let _ = event_sender
                    .send(SessionEvent::RunState {
                        state: "errored".into(),
                        error: Some(e.to_string()),
                    })
                    .await;
            }
        });

        let handle = SessionHandle {
            child,
            pid,
            transport: SessionTransport::Http {
                base_url,
                opencode_session_id,
                http_client,
            },
        };

        Ok((handle, event_receiver))
    }

    async fn send_turn(
        &self,
        handle: &mut SessionHandle,
        message: &str,
    ) -> Result<(), ProviderError> {
        let (base_url, session_id, client) = Self::get_http(handle)?;
        let url = format!("{base_url}/session/{session_id}/prompt_async");
        let body = serde_json::json!({
            "parts": [{ "type": "text", "text": message }]
        });
        post_json(client, &url, &body, "promptAsync").await?;
        Ok(())
    }

    async fn respond_to_request(
        &self,
        handle: &mut SessionHandle,
        request_id: &str,
        decision: &ApprovalDecision,
    ) -> Result<(), ProviderError> {
        let (base_url, _, client) = Self::get_http(handle)?;
        let url = format!("{base_url}/permission/{request_id}/reply");
        let body = serde_json::json!({ "reply": approval_to_opencode_reply(decision) });
        post_json(client, &url, &body, "permission.reply").await?;
        Ok(())
    }

    async fn respond_to_user_input(
        &self,
        handle: &mut SessionHandle,
        request_id: &str,
        answers: &Value,
    ) -> Result<(), ProviderError> {
        let (base_url, _, client) = Self::get_http(handle)?;
        let url = format!("{base_url}/question/{request_id}/reply");
        let body = serde_json::json!({ "answers": format_question_answers(answers) });
        post_json(client, &url, &body, "question.reply").await?;
        Ok(())
    }

    fn capabilities(&self) -> ProviderCapabilities {
        ProviderCapabilities {
            supports_spawn: true,
            supports_discovery: false,
            supports_mid_session_mode_switch: false,
            supports_mid_session_model_switch: true,
            supported_image_types: vec!["*/*".into()],
            available_permission_modes: vec!["default".into(), "full-access".into()],
        }
    }

    async fn interrupt(&self, handle: &mut SessionHandle) -> Result<(), ProviderError> {
        let (base_url, session_id, client) = Self::get_http(handle)?;
        let url = format!("{base_url}/session/{session_id}/abort");
        post_json(client, &url, &serde_json::json!({}), "session.abort").await?;
        Ok(())
    }

    async fn terminate(&self, handle: &mut SessionHandle) -> Result<(), ProviderError> {
        if let Ok((base_url, session_id, client)) = Self::get_http(handle) {
            let _ = client
                .post(format!("{base_url}/session/{session_id}/abort"))
                .send()
                .await;
        }
        handle.child.kill().await?;
        Ok(())
    }
}

async fn setup_opencode_session(
    http_client: &reqwest::Client,
    base_url: &str,
    config: &SpawnConfig,
) -> Result<(String, mpsc::Sender<SessionEvent>, mpsc::Receiver<SessionEvent>), ProviderError> {
    let permission_rules = build_permission_rules(config.permission_mode.as_deref());
    let create_body = serde_json::json!({
        "title": "Grovekeeper session",
        "permission": permission_rules,
    });

    let create_response =
        post_json(http_client, &format!("{base_url}/session"), &create_body, "session.create")
            .await?;

    let create_data: Value = create_response
        .json()
        .await
        .map_err(|e| ProviderError::HttpError(format!("session.create parse failed: {e}")))?;

    let opencode_session_id = create_data
        .pointer("/data/id")
        .or_else(|| create_data.get("id"))
        .and_then(|v| v.as_str())
        .ok_or_else(|| {
            ProviderError::HttpError("session.create returned no session ID".into())
        })?
        .to_string();

    if !config.prompt.is_empty() {
        let prompt_body = build_prompt_body(config);
        let url = format!("{base_url}/session/{opencode_session_id}/prompt_async");
        post_json(http_client, &url, &prompt_body, "session.promptAsync").await?;
    }

    let (event_sender, event_receiver) = mpsc::channel::<SessionEvent>(256);
    Ok((opencode_session_id, event_sender, event_receiver))
}

async fn wait_for_server_ready(
    stdout: tokio::process::ChildStdout,
    timeout: Duration,
) -> Result<String, ProviderError> {
    let mut reader = BufReader::new(stdout).lines();
    let mut accumulated = String::new();

    let result = tokio::time::timeout(timeout, async {
        while let Ok(Some(line)) = reader.next_line().await {
            accumulated.push_str(&line);
            accumulated.push('\n');
            if let Some(url) = parse_server_url_from_output(&accumulated) {
                return Ok(url.to_string());
            }
        }
        Err(ProviderError::SpawnFailed(format!(
            "opencode server exited before startup completed. Output:\n{accumulated}"
        )))
    })
    .await;

    match result {
        Ok(inner) => inner,
        Err(_) => Err(ProviderError::SpawnFailed(format!(
            "Timed out waiting for opencode server after {}s. Output:\n{accumulated}",
            timeout.as_secs()
        ))),
    }
}

/// Find the next SSE message boundary (\n\n or \r\n\r\n).
fn find_sse_boundary(buffer: &str) -> Option<(usize, usize)> {
    if let Some(pos) = buffer.find("\r\n\r\n") {
        return Some((pos, pos + 4));
    }
    if let Some(pos) = buffer.find("\n\n") {
        return Some((pos, pos + 2));
    }
    None
}

async fn run_sse_event_loop(
    client: &reqwest::Client,
    sse_url: &str,
    filter_session_id: &str,
    event_sender: &mpsc::Sender<SessionEvent>,
) -> Result<(), ProviderError> {
    let response = client
        .get(sse_url)
        .header("Accept", "text/event-stream")
        .send()
        .await
        .map_err(|e| ProviderError::HttpError(format!("SSE subscribe failed: {e}")))?;

    if !response.status().is_success() {
        return Err(ProviderError::HttpError(format!(
            "SSE subscribe returned {}",
            response.status()
        )));
    }

    let mut stream = response.bytes_stream();
    let mut buffer = String::new();
    let mut current_event_type = String::new();
    let mut current_data = String::new();

    while let Some(chunk) = stream.next().await {
        let chunk = chunk
            .map_err(|e| ProviderError::HttpError(format!("SSE stream error: {e}")))?;
        buffer.push_str(&String::from_utf8_lossy(&chunk));

        while let Some((boundary_start, boundary_end)) = find_sse_boundary(&buffer) {
            let message_bytes = &buffer[..boundary_start];

            for line in message_bytes.lines() {
                if let Some(value) = line.strip_prefix("event: ") {
                    current_event_type = value.trim().to_string();
                } else if let Some(value) = line.strip_prefix("data: ") {
                    if !current_data.is_empty() {
                        current_data.push('\n');
                    }
                    current_data.push_str(value);
                }
            }

            if !current_data.is_empty() {
                if let Ok(properties) = serde_json::from_str::<Value>(&current_data) {
                    let event_session_id = properties
                        .pointer("/properties/sessionID")
                        .or_else(|| properties.get("sessionID"))
                        .and_then(|v| v.as_str());

                    let matches = event_session_id
                        .map(|id| id == filter_session_id)
                        .unwrap_or(true);

                    if matches {
                        let event_type = if current_event_type.is_empty() {
                            properties
                                .get("type")
                                .and_then(|v| v.as_str())
                                .unwrap_or("unknown")
                        } else {
                            &current_event_type
                        };

                        let props = properties.get("properties").unwrap_or(&properties);

                        for event in parse_opencode_event(event_type, props) {
                            if event_sender.send(event).await.is_err() {
                                return Ok(());
                            }
                        }
                    }
                }
            }

            current_event_type.clear();
            current_data.clear();
            buffer.drain(..boundary_end);
        }
    }

    // Stream ended unexpectedly — the server may have restarted or the connection dropped
    Err(ProviderError::HttpError(
        "SSE event stream ended unexpectedly".into(),
    ))
}

fn build_permission_rules(permission_mode: Option<&str>) -> Value {
    if permission_mode == Some("full-access") {
        return serde_json::json!([
            { "permission": "*", "pattern": "*", "action": "allow" }
        ]);
    }

    serde_json::json!([
        { "permission": "*", "pattern": "*", "action": "ask" },
        { "permission": "bash", "pattern": "*", "action": "ask" },
        { "permission": "edit", "pattern": "*", "action": "ask" },
        { "permission": "question", "pattern": "*", "action": "allow" },
    ])
}

fn build_prompt_body(config: &SpawnConfig) -> Value {
    let mut body = serde_json::json!({
        "parts": [{ "type": "text", "text": config.prompt }]
    });

    if let Some(ref model) = config.model {
        if let Some((provider_id, model_id)) = parse_model_slug(model) {
            body["model"] = serde_json::json!({
                "providerID": provider_id,
                "modelID": model_id,
            });
        }
    }

    body
}

fn format_question_answers(answers: &Value) -> Value {
    match answers {
        Value::Array(arr) => Value::Array(
            arr.iter()
                .map(|a| match a {
                    Value::Array(inner) => Value::Array(inner.clone()),
                    Value::String(s) => Value::Array(vec![Value::String(s.clone())]),
                    other => Value::Array(vec![Value::String(other.to_string())]),
                })
                .collect(),
        ),
        Value::Object(map) => Value::Array(
            map.values()
                .map(|v| match v {
                    Value::String(s) => Value::Array(vec![Value::String(s.clone())]),
                    Value::Array(arr) => Value::Array(arr.clone()),
                    other => Value::Array(vec![Value::String(other.to_string())]),
                })
                .collect(),
        ),
        _ => Value::Array(vec![]),
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn opencode_capabilities_no_mid_session_mode_switch() {
        let provider = OpenCodeProvider::new();
        let caps = provider.capabilities();
        assert!(caps.supports_spawn);
        assert!(!caps.supports_discovery);
        assert!(!caps.supports_mid_session_mode_switch);
        assert!(caps.supports_mid_session_model_switch);
        assert_eq!(caps.supported_image_types, vec!["*/*"]);
        assert_eq!(
            caps.available_permission_modes,
            vec!["default", "full-access"]
        );
    }

    #[test]
    fn build_permission_rules_default_mode() {
        let rules = build_permission_rules(None);
        let arr = rules.as_array().unwrap();
        assert!(arr.len() >= 3);
        assert_eq!(arr[0]["action"], "ask");
    }

    #[test]
    fn build_permission_rules_full_access() {
        let rules = build_permission_rules(Some("full-access"));
        let arr = rules.as_array().unwrap();
        assert_eq!(arr.len(), 1);
        assert_eq!(arr[0]["action"], "allow");
    }

    #[test]
    fn format_question_answers_from_object() {
        let answers = serde_json::json!({ "q1": "yes", "q2": "no" });
        let result = format_question_answers(&answers);
        let arr = result.as_array().unwrap();
        assert_eq!(arr.len(), 2);
        for item in arr {
            assert!(item.is_array());
            assert_eq!(item.as_array().unwrap().len(), 1);
        }
    }

    #[test]
    fn format_question_answers_from_array() {
        let answers = serde_json::json!([["yes"], ["no", "maybe"]]);
        let result = format_question_answers(&answers);
        let arr = result.as_array().unwrap();
        assert_eq!(arr.len(), 2);
        assert_eq!(arr[0].as_array().unwrap().len(), 1);
        assert_eq!(arr[1].as_array().unwrap().len(), 2);
    }

    #[test]
    fn build_prompt_body_includes_model_when_set() {
        let config = SpawnConfig {
            prompt: "hello".into(),
            working_directory: ".".into(),
            resume_session_id: None,
            permission_mode: None,
            model: Some("anthropic/claude-sonnet-4-20250514".into()),
            max_turns: None,
            env_vars: Default::default(),
        };
        let body = build_prompt_body(&config);
        assert_eq!(body["model"]["providerID"], "anthropic");
        assert_eq!(body["model"]["modelID"], "claude-sonnet-4-20250514");
    }

    #[test]
    fn build_prompt_body_no_model_when_unset() {
        let config = SpawnConfig {
            prompt: "hello".into(),
            working_directory: ".".into(),
            resume_session_id: None,
            permission_mode: None,
            model: None,
            max_turns: None,
            env_vars: Default::default(),
        };
        let body = build_prompt_body(&config);
        assert!(body.get("model").is_none());
    }

    #[test]
    fn find_sse_boundary_lf() {
        assert_eq!(find_sse_boundary("data: hello\n\ndata: world"), Some((11, 13)));
    }

    #[test]
    fn find_sse_boundary_crlf() {
        assert_eq!(
            find_sse_boundary("data: hello\r\n\r\ndata: world"),
            Some((11, 15))
        );
    }

    #[test]
    fn find_sse_boundary_none() {
        assert_eq!(find_sse_boundary("data: hello\ndata: world"), None);
    }
}
