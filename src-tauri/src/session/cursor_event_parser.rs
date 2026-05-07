use std::collections::HashMap;
use std::sync::{Arc, Mutex as StdMutex};

use serde_json::Value;

use super::acp_json_rpc::{self, JsonRpcMessage, MessageKind};
use super::provider::SessionEvent;

/// A pending server-initiated JSON-RPC request that we must respond to.
pub struct PendingAcpServerRequest {
    pub json_rpc_id: Value,
    pub permission_options: Option<Vec<AcpPermissionOption>>,
}

/// An option presented in a permission request from the ACP agent.
pub struct AcpPermissionOption {
    pub option_id: String,
    pub kind: String,
}

/// Extract the text string from an ACP content object (`{ "text": "..." }`).
fn extract_content_text(update: &Value) -> String {
    update
        .get("content")
        .and_then(|c| c.get("text"))
        .and_then(|v| v.as_str())
        .unwrap_or("")
        .to_string()
}

/// Convert a JSON-RPC id Value to a plain String for use as a map key.
fn value_to_request_id(id: &Value) -> String {
    id.as_str()
        .map(|s| s.to_string())
        .unwrap_or_else(|| id.to_string())
}

/// Stateful parser that maps ACP JSON-RPC events to unified SessionEvents.
///
/// Tracks tool call IDs to correlate tool_call with tool_call_update events,
/// and stores pending server requests for later response.
pub struct CursorEventParser {
    tool_names: HashMap<String, String>,
}

impl CursorEventParser {
    pub fn new() -> Self {
        Self {
            tool_names: HashMap::new(),
        }
    }

    /// Handle a raw JSON message from stdout.
    /// Returns events to emit; may store pending server requests.
    pub fn handle_message(
        &mut self,
        raw: &Value,
        pending_requests: &Arc<StdMutex<HashMap<String, PendingAcpServerRequest>>>,
    ) -> Vec<SessionEvent> {
        let msg: JsonRpcMessage = match serde_json::from_value(raw.clone()) {
            Ok(m) => m,
            Err(_) => {
                return vec![SessionEvent::Raw {
                    source: "acp_unparseable".into(),
                    data: raw.clone(),
                }];
            }
        };

        let kind = match acp_json_rpc::classify_message(&msg) {
            Some(k) => k,
            None => {
                return vec![SessionEvent::Raw {
                    source: "acp_unclassified".into(),
                    data: raw.clone(),
                }];
            }
        };

        match kind {
            MessageKind::Notification { method, params } => {
                if method == "session/update" {
                    self.parse_session_update(&params)
                } else {
                    vec![SessionEvent::Raw {
                        source: "acp_notification".into(),
                        data: raw.clone(),
                    }]
                }
            }
            MessageKind::ServerRequest { id, method, params } => match method.as_str() {
                "session/request_permission" => {
                    self.parse_permission_request(&id, &params, pending_requests)
                }
                "session/elicitation" => {
                    self.parse_elicitation_request(&id, &params, pending_requests)
                }
                _ => vec![SessionEvent::Raw {
                    source: "acp_server_request".into(),
                    data: raw.clone(),
                }],
            },
            MessageKind::Response { result, .. } => {
                if let Some(ref res) = result {
                    if res.get("stopReason").is_some() {
                        return self.parse_prompt_response(res);
                    }
                }
                // Other responses (initialize, authenticate, etc.) are handled
                // by the handshake in cursor_provider, not here.
                vec![]
            }
        }
    }

    /// Parse a session/update notification's params.
    fn parse_session_update(&mut self, params: &Value) -> Vec<SessionEvent> {
        let update = match params.get("update") {
            Some(u) => u,
            None => {
                return vec![SessionEvent::Raw {
                    source: "acp_update_missing".into(),
                    data: params.clone(),
                }];
            }
        };

        let session_update_type = update
            .get("sessionUpdate")
            .and_then(|v| v.as_str())
            .unwrap_or("unknown");

        match session_update_type {
            "agent_message_chunk" => self.parse_agent_message_chunk(update),
            "agent_thought_chunk" => self.parse_agent_thought_chunk(update),
            "tool_call" => self.parse_tool_call(update),
            "tool_call_update" => self.parse_tool_call_update(update),
            "plan" => self.parse_plan_update(update),
            "usage_update" => self.parse_usage_update(update),
            "current_mode_update" => self.parse_current_mode_update(update),
            "user_message_chunk" => vec![], // ignore echo of our own message
            "session_info_update" | "available_commands_update" | "config_option_update" => {
                vec![SessionEvent::Raw {
                    source: "acp_session_update".into(),
                    data: update.clone(),
                }]
            }
            _ => vec![SessionEvent::Raw {
                source: "acp_unknown_update".into(),
                data: update.clone(),
            }],
        }
    }

    fn parse_agent_message_chunk(&self, update: &Value) -> Vec<SessionEvent> {
        vec![SessionEvent::MessageDelta {
            text: extract_content_text(update),
        }]
    }

    fn parse_agent_thought_chunk(&self, update: &Value) -> Vec<SessionEvent> {
        vec![SessionEvent::ThinkingDelta {
            text: extract_content_text(update),
        }]
    }

    fn parse_tool_call(&mut self, update: &Value) -> Vec<SessionEvent> {
        let tool_call_id = update
            .get("toolCallId")
            .and_then(|v| v.as_str())
            .unwrap_or("")
            .to_string();
        let title = update
            .get("title")
            .and_then(|v| v.as_str())
            .unwrap_or("")
            .to_string();
        let status = update
            .get("status")
            .and_then(|v| v.as_str())
            .unwrap_or("");

        match status {
            "completed" => {
                let tool_name = self
                    .tool_names
                    .get(&tool_call_id)
                    .cloned()
                    .unwrap_or_else(|| title.clone());
                let output = update.get("rawOutput").cloned().unwrap_or(Value::Null);
                vec![SessionEvent::ToolEnd {
                    tool_use_id: tool_call_id,
                    tool_name,
                    output,
                    is_error: false,
                }]
            }
            "failed" => {
                let tool_name = self
                    .tool_names
                    .get(&tool_call_id)
                    .cloned()
                    .unwrap_or_else(|| title.clone());
                let output = update.get("rawOutput").cloned().unwrap_or(Value::Null);
                vec![SessionEvent::ToolEnd {
                    tool_use_id: tool_call_id,
                    tool_name,
                    output,
                    is_error: true,
                }]
            }
            _ => {
                // pending or in_progress → ToolStart
                self.tool_names
                    .insert(tool_call_id.clone(), title.clone());
                let input = update.get("rawInput").cloned().unwrap_or(Value::Null);
                vec![SessionEvent::ToolStart {
                    tool_use_id: tool_call_id,
                    tool_name: title,
                    input,
                }]
            }
        }
    }

    fn parse_tool_call_update(&mut self, update: &Value) -> Vec<SessionEvent> {
        let tool_call_id = update
            .get("toolCallId")
            .and_then(|v| v.as_str())
            .unwrap_or("")
            .to_string();
        let title = update
            .get("title")
            .and_then(|v| v.as_str())
            .unwrap_or("")
            .to_string();
        let status = update
            .get("status")
            .and_then(|v| v.as_str())
            .unwrap_or("");

        match status {
            "completed" | "failed" => {
                let tool_name = self
                    .tool_names
                    .get(&tool_call_id)
                    .cloned()
                    .unwrap_or_else(|| title.clone());
                let output = update.get("rawOutput").cloned().unwrap_or(Value::Null);
                vec![SessionEvent::ToolEnd {
                    tool_use_id: tool_call_id,
                    tool_name,
                    output,
                    is_error: status == "failed",
                }]
            }
            _ => {
                // in_progress updates are ignored (no new event needed)
                vec![]
            }
        }
    }

    fn parse_plan_update(&self, update: &Value) -> Vec<SessionEvent> {
        let entries = update
            .get("entries")
            .and_then(|v| v.as_array())
            .map(|arr| {
                arr.iter()
                    .filter_map(|entry| {
                        let content = entry.get("content").and_then(|v| v.as_str())?;
                        let status = entry
                            .get("status")
                            .and_then(|v| v.as_str())
                            .unwrap_or("unknown");
                        Some(format!("[{status}] {content}"))
                    })
                    .collect::<Vec<_>>()
                    .join("\n")
            })
            .unwrap_or_default();

        vec![SessionEvent::SystemStatus { status: entries }]
    }

    fn parse_usage_update(&self, update: &Value) -> Vec<SessionEvent> {
        let cost_usd = update
            .get("cost")
            .and_then(|c| c.get("amount"))
            .and_then(|v| v.as_f64())
            .unwrap_or(0.0);

        vec![SessionEvent::UsageUpdate {
            input_tokens: 0,
            output_tokens: 0,
            cost_usd,
        }]
    }

    fn parse_current_mode_update(&self, update: &Value) -> Vec<SessionEvent> {
        let mode_id = update
            .get("currentModeId")
            .and_then(|v| v.as_str())
            .unwrap_or("unknown")
            .to_string();

        vec![SessionEvent::SystemStatus {
            status: format!("Mode: {mode_id}"),
        }]
    }

    /// Parse a prompt response (has stopReason + optional usage).
    fn parse_prompt_response(&self, result: &Value) -> Vec<SessionEvent> {
        let mut events = Vec::new();

        if let Some(usage) = result.get("usage") {
            let input_tokens = usage
                .get("inputTokens")
                .and_then(|v| v.as_u64())
                .unwrap_or(0);
            let output_tokens = usage
                .get("outputTokens")
                .and_then(|v| v.as_u64())
                .unwrap_or(0);

            events.push(SessionEvent::UsageUpdate {
                input_tokens,
                output_tokens,
                cost_usd: 0.0,
            });
        }

        events.push(SessionEvent::RunState {
            state: "idle".into(),
            error: None,
        });

        events
    }

    /// Parse a server-initiated permission request. Stores the pending request
    /// so the provider can later respond with the user's decision.
    fn parse_permission_request(
        &self,
        id: &Value,
        params: &Value,
        pending: &Arc<StdMutex<HashMap<String, PendingAcpServerRequest>>>,
    ) -> Vec<SessionEvent> {
        let request_id_string = value_to_request_id(id);

        let options: Vec<AcpPermissionOption> = params
            .get("options")
            .and_then(|v| v.as_array())
            .map(|arr| {
                arr.iter()
                    .filter_map(|opt| {
                        let option_id = opt.get("optionId")?.as_str()?.to_string();
                        let kind = opt.get("kind")?.as_str()?.to_string();
                        Some(AcpPermissionOption { option_id, kind })
                    })
                    .collect()
            })
            .unwrap_or_default();

        let tool_call = params.get("toolCall").unwrap_or(&Value::Null);
        let tool_name = tool_call
            .get("title")
            .and_then(|v| v.as_str())
            .unwrap_or("")
            .to_string();
        let tool_input = tool_call
            .get("rawInput")
            .cloned()
            .unwrap_or(Value::Null);

        match pending.lock() {
            Ok(mut map) => {
                map.insert(
                    request_id_string.clone(),
                    PendingAcpServerRequest {
                        json_rpc_id: id.clone(),
                        permission_options: Some(options),
                    },
                );
            }
            Err(e) => {
                log::warn!("Failed to store pending permission request: {e}");
            }
        }

        vec![SessionEvent::PermissionPrompt {
            request_id: request_id_string,
            tool_name,
            tool_input,
        }]
    }

    /// Parse a server-initiated elicitation request.
    fn parse_elicitation_request(
        &self,
        id: &Value,
        params: &Value,
        pending: &Arc<StdMutex<HashMap<String, PendingAcpServerRequest>>>,
    ) -> Vec<SessionEvent> {
        let request_id_string = value_to_request_id(id);

        let message = params
            .get("message")
            .and_then(|v| v.as_str())
            .unwrap_or("")
            .to_string();

        match pending.lock() {
            Ok(mut map) => {
                map.insert(
                    request_id_string.clone(),
                    PendingAcpServerRequest {
                        json_rpc_id: id.clone(),
                        permission_options: None,
                    },
                );
            }
            Err(e) => {
                log::warn!("Failed to store pending elicitation request: {e}");
            }
        }

        vec![SessionEvent::ElicitationPrompt {
            request_id: request_id_string,
            message,
        }]
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    fn make_pending_map() -> Arc<StdMutex<HashMap<String, PendingAcpServerRequest>>> {
        Arc::new(StdMutex::new(HashMap::new()))
    }

    fn assert_event_type(events: &[SessionEvent], index: usize, expected_type: &str) {
        let event = &events[index];
        let json = serde_json::to_value(event).unwrap();
        assert_eq!(
            json.get("type").and_then(|v| v.as_str()).unwrap(),
            expected_type,
            "Event at index {index} should be {expected_type}, got: {json}"
        );
    }

    // --- agent message ---

    #[test]
    fn agent_message_chunk_maps_to_message_delta() {
        let mut parser = CursorEventParser::new();
        let pending = make_pending_map();
        let raw = json!({
            "jsonrpc": "2.0",
            "id": "",
            "method": "session/update",
            "params": {
                "sessionId": "s1",
                "update": {
                    "sessionUpdate": "agent_message_chunk",
                    "content": { "type": "text", "text": "Hello world" },
                    "messageId": "m1"
                }
            }
        });

        let events = parser.handle_message(&raw, &pending);
        assert_eq!(events.len(), 1);
        assert_event_type(&events, 0, "message_delta");
        if let SessionEvent::MessageDelta { text } = &events[0] {
            assert_eq!(text, "Hello world");
        } else {
            panic!("Expected MessageDelta");
        }
    }

    // --- thought ---

    #[test]
    fn agent_thought_chunk_maps_to_thinking_delta() {
        let mut parser = CursorEventParser::new();
        let pending = make_pending_map();
        let raw = json!({
            "jsonrpc": "2.0",
            "id": "",
            "method": "session/update",
            "params": {
                "sessionId": "s1",
                "update": {
                    "sessionUpdate": "agent_thought_chunk",
                    "content": { "type": "text", "text": "Thinking about the problem..." },
                    "messageId": "m1"
                }
            }
        });

        let events = parser.handle_message(&raw, &pending);
        assert_eq!(events.len(), 1);
        assert_event_type(&events, 0, "thinking_delta");
        if let SessionEvent::ThinkingDelta { text } = &events[0] {
            assert_eq!(text, "Thinking about the problem...");
        } else {
            panic!("Expected ThinkingDelta");
        }
    }

    // --- tool_call ---

    #[test]
    fn tool_call_pending_maps_to_tool_start() {
        let mut parser = CursorEventParser::new();
        let pending = make_pending_map();
        let raw = json!({
            "jsonrpc": "2.0",
            "id": "",
            "method": "session/update",
            "params": {
                "sessionId": "s1",
                "update": {
                    "sessionUpdate": "tool_call",
                    "toolCallId": "tc-1",
                    "title": "Read file: src/main.rs",
                    "kind": "read",
                    "status": "pending",
                    "rawInput": {"path": "src/main.rs"}
                }
            }
        });

        let events = parser.handle_message(&raw, &pending);
        assert_eq!(events.len(), 1);
        assert_event_type(&events, 0, "tool_start");
        if let SessionEvent::ToolStart { tool_use_id, tool_name, input } = &events[0] {
            assert_eq!(tool_use_id, "tc-1");
            assert_eq!(tool_name, "Read file: src/main.rs");
            assert_eq!(input["path"], "src/main.rs");
        } else {
            panic!("Expected ToolStart");
        }
    }

    #[test]
    fn tool_call_completed_maps_to_tool_end() {
        let mut parser = CursorEventParser::new();
        let pending = make_pending_map();

        // First send pending to register tool name
        let start = json!({
            "jsonrpc": "2.0", "id": "",
            "method": "session/update",
            "params": {
                "sessionId": "s1",
                "update": {
                    "sessionUpdate": "tool_call",
                    "toolCallId": "tc-2",
                    "title": "Run command: ls",
                    "kind": "execute",
                    "status": "pending",
                    "rawInput": {"command": "ls"}
                }
            }
        });
        parser.handle_message(&start, &pending);

        let raw = json!({
            "jsonrpc": "2.0", "id": "",
            "method": "session/update",
            "params": {
                "sessionId": "s1",
                "update": {
                    "sessionUpdate": "tool_call",
                    "toolCallId": "tc-2",
                    "title": "Run command: ls",
                    "kind": "execute",
                    "status": "completed",
                    "rawOutput": "file1.txt\nfile2.txt"
                }
            }
        });

        let events = parser.handle_message(&raw, &pending);
        assert_eq!(events.len(), 1);
        assert_event_type(&events, 0, "tool_end");
        if let SessionEvent::ToolEnd { tool_use_id, is_error, .. } = &events[0] {
            assert_eq!(tool_use_id, "tc-2");
            assert!(!is_error);
        } else {
            panic!("Expected ToolEnd");
        }
    }

    #[test]
    fn tool_call_failed_maps_to_tool_end_with_error() {
        let mut parser = CursorEventParser::new();
        let pending = make_pending_map();
        let raw = json!({
            "jsonrpc": "2.0", "id": "",
            "method": "session/update",
            "params": {
                "sessionId": "s1",
                "update": {
                    "sessionUpdate": "tool_call",
                    "toolCallId": "tc-3",
                    "title": "Run command: rm -rf /",
                    "kind": "execute",
                    "status": "failed",
                    "rawOutput": "Permission denied"
                }
            }
        });

        let events = parser.handle_message(&raw, &pending);
        assert_eq!(events.len(), 1);
        assert_event_type(&events, 0, "tool_end");
        if let SessionEvent::ToolEnd { tool_use_id, is_error, .. } = &events[0] {
            assert_eq!(tool_use_id, "tc-3");
            assert!(is_error);
        } else {
            panic!("Expected ToolEnd with error");
        }
    }

    // --- tool_call_update ---

    #[test]
    fn tool_call_update_completed_maps_to_tool_end() {
        let mut parser = CursorEventParser::new();
        let pending = make_pending_map();

        // Register tool name via initial tool_call
        let start = json!({
            "jsonrpc": "2.0", "id": "",
            "method": "session/update",
            "params": {
                "sessionId": "s1",
                "update": {
                    "sessionUpdate": "tool_call",
                    "toolCallId": "tc-4",
                    "title": "Edit file: lib.rs",
                    "kind": "write",
                    "status": "pending",
                    "rawInput": {}
                }
            }
        });
        parser.handle_message(&start, &pending);

        let raw = json!({
            "jsonrpc": "2.0", "id": "",
            "method": "session/update",
            "params": {
                "sessionId": "s1",
                "update": {
                    "sessionUpdate": "tool_call_update",
                    "toolCallId": "tc-4",
                    "title": "Edit file: lib.rs",
                    "kind": "write",
                    "status": "completed",
                    "rawOutput": "File edited successfully"
                }
            }
        });

        let events = parser.handle_message(&raw, &pending);
        assert_eq!(events.len(), 1);
        assert_event_type(&events, 0, "tool_end");
        if let SessionEvent::ToolEnd { tool_use_id, is_error, .. } = &events[0] {
            assert_eq!(tool_use_id, "tc-4");
            assert!(!is_error);
        } else {
            panic!("Expected ToolEnd");
        }
    }

    // --- plan ---

    #[test]
    fn plan_update_maps_to_system_status() {
        let mut parser = CursorEventParser::new();
        let pending = make_pending_map();
        let raw = json!({
            "jsonrpc": "2.0", "id": "",
            "method": "session/update",
            "params": {
                "sessionId": "s1",
                "update": {
                    "sessionUpdate": "plan",
                    "entries": [
                        {"content": "Read the codebase", "status": "completed", "priority": "high"},
                        {"content": "Implement feature", "status": "in_progress", "priority": "high"}
                    ]
                }
            }
        });

        let events = parser.handle_message(&raw, &pending);
        assert_eq!(events.len(), 1);
        assert_event_type(&events, 0, "system_status");
        if let SessionEvent::SystemStatus { status } = &events[0] {
            assert!(status.contains("Read the codebase"));
            assert!(status.contains("Implement feature"));
        } else {
            panic!("Expected SystemStatus");
        }
    }

    // --- usage ---

    #[test]
    fn usage_update_maps_to_usage_update_event() {
        let mut parser = CursorEventParser::new();
        let pending = make_pending_map();
        let raw = json!({
            "jsonrpc": "2.0", "id": "",
            "method": "session/update",
            "params": {
                "sessionId": "s1",
                "update": {
                    "sessionUpdate": "usage_update",
                    "cost": { "amount": 0.0042, "currency": "USD" }
                }
            }
        });

        let events = parser.handle_message(&raw, &pending);
        assert_eq!(events.len(), 1);
        assert_event_type(&events, 0, "usage_update");
        if let SessionEvent::UsageUpdate { cost_usd, .. } = &events[0] {
            assert!((*cost_usd - 0.0042).abs() < f64::EPSILON);
        } else {
            panic!("Expected UsageUpdate");
        }
    }

    // --- current_mode_update ---

    #[test]
    fn current_mode_update_maps_to_system_status() {
        let mut parser = CursorEventParser::new();
        let pending = make_pending_map();
        let raw = json!({
            "jsonrpc": "2.0", "id": "",
            "method": "session/update",
            "params": {
                "sessionId": "s1",
                "update": {
                    "sessionUpdate": "current_mode_update",
                    "currentModeId": "agent"
                }
            }
        });

        let events = parser.handle_message(&raw, &pending);
        assert_eq!(events.len(), 1);
        assert_event_type(&events, 0, "system_status");
        if let SessionEvent::SystemStatus { status } = &events[0] {
            assert!(status.contains("agent"));
        } else {
            panic!("Expected SystemStatus");
        }
    }

    // --- unknown update ---

    #[test]
    fn unknown_session_update_maps_to_raw() {
        let mut parser = CursorEventParser::new();
        let pending = make_pending_map();
        let raw = json!({
            "jsonrpc": "2.0", "id": "",
            "method": "session/update",
            "params": {
                "sessionId": "s1",
                "update": {
                    "sessionUpdate": "some_future_update",
                    "data": "whatever"
                }
            }
        });

        let events = parser.handle_message(&raw, &pending);
        assert_eq!(events.len(), 1);
        assert_event_type(&events, 0, "raw");
    }

    #[test]
    fn session_update_missing_update_field_maps_to_raw() {
        let mut parser = CursorEventParser::new();
        let pending = make_pending_map();
        let raw = json!({
            "jsonrpc": "2.0", "id": "",
            "method": "session/update",
            "params": {
                "sessionId": "s1"
            }
        });

        let events = parser.handle_message(&raw, &pending);
        assert_eq!(events.len(), 1);
        assert_event_type(&events, 0, "raw");
    }

    // --- permission request ---

    #[test]
    fn permission_request_stores_pending_and_emits_prompt() {
        let mut parser = CursorEventParser::new();
        let pending = make_pending_map();
        let raw = json!({
            "jsonrpc": "2.0",
            "id": "srv-req-1",
            "method": "session/request_permission",
            "params": {
                "sessionId": "s1",
                "options": [
                    {"optionId": "allow-once", "kind": "allow_once", "name": "Allow once"},
                    {"optionId": "allow-always", "kind": "allow_always", "name": "Allow always"},
                    {"optionId": "reject-once", "kind": "reject_once", "name": "Reject once"}
                ],
                "toolCall": {
                    "toolCallId": "tc-perm-1",
                    "title": "Run command: ls",
                    "kind": "execute",
                    "rawInput": {"command": "ls"}
                }
            }
        });

        let events = parser.handle_message(&raw, &pending);
        assert_eq!(events.len(), 1);
        assert_event_type(&events, 0, "permission_prompt");
        if let SessionEvent::PermissionPrompt { request_id, tool_name, tool_input } = &events[0] {
            assert_eq!(request_id, "srv-req-1");
            assert_eq!(tool_name, "Run command: ls");
            assert_eq!(tool_input["command"], "ls");
        } else {
            panic!("Expected PermissionPrompt");
        }

        // Verify pending request was stored
        let map = pending.lock().unwrap();
        let stored = map.get("srv-req-1").expect("Pending request should be stored");
        assert_eq!(stored.json_rpc_id, json!("srv-req-1"));
        let options = stored.permission_options.as_ref().unwrap();
        assert_eq!(options.len(), 3);
        assert_eq!(options[0].kind, "allow_once");
    }

    // --- elicitation request ---

    #[test]
    fn elicitation_request_stores_pending_and_emits_prompt() {
        let mut parser = CursorEventParser::new();
        let pending = make_pending_map();
        let raw = json!({
            "jsonrpc": "2.0",
            "id": "srv-req-2",
            "method": "session/elicitation",
            "params": {
                "sessionId": "s1",
                "mode": "form",
                "message": "Please confirm deletion:",
                "requestedSchema": { "type": "object" }
            }
        });

        let events = parser.handle_message(&raw, &pending);
        assert_eq!(events.len(), 1);
        assert_event_type(&events, 0, "elicitation_prompt");
        if let SessionEvent::ElicitationPrompt { request_id, message } = &events[0] {
            assert_eq!(request_id, "srv-req-2");
            assert_eq!(message, "Please confirm deletion:");
        } else {
            panic!("Expected ElicitationPrompt");
        }

        // Verify pending request was stored
        let map = pending.lock().unwrap();
        assert!(map.contains_key("srv-req-2"));
    }

    // --- prompt response ---

    #[test]
    fn prompt_response_emits_usage_and_idle() {
        let mut parser = CursorEventParser::new();
        let pending = make_pending_map();
        let raw = json!({
            "jsonrpc": "2.0",
            "id": "5",
            "result": {
                "stopReason": "end_turn",
                "usage": {
                    "inputTokens": 1000,
                    "outputTokens": 250,
                    "totalTokens": 1250
                }
            }
        });

        let events = parser.handle_message(&raw, &pending);
        assert_eq!(events.len(), 2);
        assert_event_type(&events, 0, "usage_update");
        assert_event_type(&events, 1, "run_state");

        if let SessionEvent::UsageUpdate { input_tokens, output_tokens, .. } = &events[0] {
            assert_eq!(*input_tokens, 1000);
            assert_eq!(*output_tokens, 250);
        } else {
            panic!("Expected UsageUpdate");
        }

        if let SessionEvent::RunState { state, .. } = &events[1] {
            assert_eq!(state, "idle");
        } else {
            panic!("Expected RunState idle");
        }
    }

    #[test]
    fn prompt_response_without_usage_emits_only_idle() {
        let mut parser = CursorEventParser::new();
        let pending = make_pending_map();
        let raw = json!({
            "jsonrpc": "2.0",
            "id": "6",
            "result": {
                "stopReason": "end_turn"
            }
        });

        let events = parser.handle_message(&raw, &pending);
        assert_eq!(events.len(), 1);
        assert_event_type(&events, 0, "run_state");

        if let SessionEvent::RunState { state, .. } = &events[0] {
            assert_eq!(state, "idle");
        } else {
            panic!("Expected RunState idle");
        }
    }

    // --- user_message_chunk ignored ---

    #[test]
    fn user_message_chunk_ignored() {
        let mut parser = CursorEventParser::new();
        let pending = make_pending_map();
        let raw = json!({
            "jsonrpc": "2.0", "id": "",
            "method": "session/update",
            "params": {
                "sessionId": "s1",
                "update": {
                    "sessionUpdate": "user_message_chunk",
                    "content": { "type": "text", "text": "echo of user input" },
                    "messageId": "m1"
                }
            }
        });

        let events = parser.handle_message(&raw, &pending);
        assert!(events.is_empty(), "user_message_chunk should be ignored");
    }
}
