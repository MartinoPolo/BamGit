use std::collections::HashMap;

use serde_json::Value;

use super::provider::{ProviderError, SessionEvent};

/// Stateful parser that tracks tool IDs across streaming events
/// to correlate ToolStart with ToolEnd and deduplicate events.
pub struct ProtocolState {
    /// Maps tool_use_id -> tool_name for correlating ToolEnd events.
    tool_names: HashMap<String, String>,
    /// Whether the first system/init has been seen (used for multi-turn dedup).
    has_seen_init: bool,
}

impl ProtocolState {
    pub fn new() -> Self {
        Self {
            tool_names: HashMap::new(),
            has_seen_init: false,
        }
    }

    /// Parse a raw JSON line from Claude Code stdout into zero or more SessionEvents.
    pub fn map_event(&mut self, raw: &Value) -> Result<Vec<SessionEvent>, ProviderError> {
        // Unwrap stream_event envelope if present
        let (event, _parent_tool_use_id) = if raw.get("type").and_then(|v| v.as_str())
            == Some("stream_event")
        {
            let inner = raw
                .get("event")
                .ok_or_else(|| ProviderError::ParseError("stream_event missing event".into()))?;
            let parent = raw
                .get("parent_tool_use_id")
                .and_then(|v| v.as_str())
                .map(String::from);
            (inner, parent)
        } else {
            (raw, None)
        };

        let event_type = event
            .get("type")
            .and_then(|v| v.as_str())
            .unwrap_or("unknown");

        match event_type {
            "system" => self.parse_system_event(event),
            "content_block_start" => self.parse_content_block_start(event),
            "content_block_delta" => self.parse_content_block_delta(event),
            "assistant" => self.parse_assistant_message(event),
            "user" => self.parse_user_message(event),
            "result" => self.parse_result(event),
            "control_request" => self.parse_control_request(event),
            "control_cancel_request" => self.parse_control_cancel(event),
            "tool_progress" => self.parse_tool_progress(event),
            "tool_use_summary" => self.parse_tool_use_summary(event),
            _ => Ok(vec![SessionEvent::Raw {
                source: "stdout".into(),
                data: raw.clone(),
            }]),
        }
    }

    fn parse_system_event(&mut self, event: &Value) -> Result<Vec<SessionEvent>, ProviderError> {
        let subtype = event.get("subtype").and_then(|v| v.as_str()).unwrap_or("");

        match subtype {
            "init" => {
                let session_id = event
                    .get("session_id")
                    .and_then(|v| v.as_str())
                    .unwrap_or("")
                    .to_string();
                let model = event
                    .get("model")
                    .and_then(|v| v.as_str())
                    .unwrap_or("")
                    .to_string();
                let tools = event
                    .get("tools")
                    .and_then(|v| v.as_array())
                    .map(|arr| {
                        arr.iter()
                            .filter_map(|t| t.get("name").and_then(|n| n.as_str()))
                            .map(String::from)
                            .collect()
                    })
                    .unwrap_or_default();

                let mut events = vec![SessionEvent::SessionInit {
                    session_id,
                    model,
                    tools,
                }];

                // Only emit RunState(running) on the first init (not multi-turn re-inits)
                if !self.has_seen_init {
                    self.has_seen_init = true;
                    events.push(SessionEvent::RunState {
                        state: "running".into(),
                        error: None,
                    });
                }

                Ok(events)
            }
            _ => Ok(vec![SessionEvent::Raw {
                source: "system".into(),
                data: event.clone(),
            }]),
        }
    }

    fn parse_content_block_start(
        &mut self,
        event: &Value,
    ) -> Result<Vec<SessionEvent>, ProviderError> {
        let content_block = event.get("content_block").unwrap_or(event);
        let block_type = content_block
            .get("type")
            .and_then(|v| v.as_str())
            .unwrap_or("");

        if block_type == "tool_use" {
            let tool_use_id = content_block
                .get("id")
                .and_then(|v| v.as_str())
                .unwrap_or("")
                .to_string();
            let tool_name = content_block
                .get("name")
                .and_then(|v| v.as_str())
                .unwrap_or("")
                .to_string();

            self.tool_names
                .insert(tool_use_id.clone(), tool_name.clone());

            Ok(vec![SessionEvent::ToolStart {
                tool_use_id,
                tool_name,
                input: Value::Null,
            }])
        } else {
            Ok(vec![])
        }
    }

    fn parse_content_block_delta(
        &self,
        event: &Value,
    ) -> Result<Vec<SessionEvent>, ProviderError> {
        let delta = event.get("delta").unwrap_or(event);
        let delta_type = delta.get("type").and_then(|v| v.as_str()).unwrap_or("");

        match delta_type {
            "text_delta" => {
                let text = delta
                    .get("text")
                    .and_then(|v| v.as_str())
                    .unwrap_or("")
                    .to_string();
                Ok(vec![SessionEvent::MessageDelta { text }])
            }
            "thinking_delta" => {
                let text = delta
                    .get("thinking")
                    .or_else(|| delta.get("text"))
                    .and_then(|v| v.as_str())
                    .unwrap_or("")
                    .to_string();
                Ok(vec![SessionEvent::ThinkingDelta { text }])
            }
            // input_json_delta deferred to v2
            _ => Ok(vec![]),
        }
    }

    fn parse_assistant_message(
        &mut self,
        event: &Value,
    ) -> Result<Vec<SessionEvent>, ProviderError> {
        let message = event.get("message").unwrap_or(event);
        let message_id = message
            .get("id")
            .and_then(|v| v.as_str())
            .unwrap_or("")
            .to_string();

        let content = message.get("content").and_then(|v| v.as_array());

        let mut events = Vec::new();
        let mut full_text = String::new();

        if let Some(blocks) = content {
            for block in blocks {
                let block_type = block.get("type").and_then(|v| v.as_str()).unwrap_or("");
                match block_type {
                    "text" => {
                        if let Some(text) = block.get("text").and_then(|v| v.as_str()) {
                            full_text.push_str(text);
                        }
                    }
                    "tool_use" => {
                        let tool_use_id = block
                            .get("id")
                            .and_then(|v| v.as_str())
                            .unwrap_or("")
                            .to_string();
                        let tool_name = block
                            .get("name")
                            .and_then(|v| v.as_str())
                            .unwrap_or("")
                            .to_string();
                        let input = block.get("input").cloned().unwrap_or(Value::Null);

                        // Only emit ToolStart if we haven't already from content_block_start
                        if !self.tool_names.contains_key(&tool_use_id) {
                            self.tool_names
                                .insert(tool_use_id.clone(), tool_name.clone());
                            events.push(SessionEvent::ToolStart {
                                tool_use_id,
                                tool_name,
                                input,
                            });
                        }
                    }
                    _ => {}
                }
            }
        }

        if !full_text.is_empty() || events.is_empty() {
            events.insert(
                0,
                SessionEvent::MessageComplete {
                    text: full_text,
                    message_id,
                },
            );
        }

        Ok(events)
    }

    fn parse_user_message(&self, event: &Value) -> Result<Vec<SessionEvent>, ProviderError> {
        let message = event.get("message").unwrap_or(event);
        let content = message.get("content").and_then(|v| v.as_array());

        let mut events = Vec::new();

        if let Some(blocks) = content {
            for block in blocks {
                let block_type = block.get("type").and_then(|v| v.as_str()).unwrap_or("");
                if block_type == "tool_result" {
                    let tool_use_id = block
                        .get("tool_use_id")
                        .and_then(|v| v.as_str())
                        .unwrap_or("")
                        .to_string();
                    let is_error = block
                        .get("is_error")
                        .and_then(|v| v.as_bool())
                        .unwrap_or(false);

                    let output = block.get("content").cloned().unwrap_or(Value::Null);

                    let tool_name = self
                        .tool_names
                        .get(&tool_use_id)
                        .cloned()
                        .unwrap_or_default();

                    events.push(SessionEvent::ToolEnd {
                        tool_use_id,
                        tool_name,
                        output,
                        is_error,
                    });
                }
            }
        }

        Ok(events)
    }

    fn parse_result(&self, event: &Value) -> Result<Vec<SessionEvent>, ProviderError> {
        let subtype = event.get("subtype").and_then(|v| v.as_str()).unwrap_or("");

        let mut events = Vec::new();

        // Extract usage data if present
        let cost_usd = event
            .get("total_cost_usd")
            .or_else(|| event.get("cost_usd"))
            .and_then(|v| v.as_f64())
            .unwrap_or(0.0);

        let usage = event.get("usage");
        let input_tokens = usage
            .and_then(|u| u.get("input_tokens"))
            .and_then(|v| v.as_u64())
            .unwrap_or(0);
        let output_tokens = usage
            .and_then(|u| u.get("output_tokens"))
            .and_then(|v| v.as_u64())
            .unwrap_or(0);
        let cache_read_tokens = usage
            .and_then(|u| u.get("cache_read_input_tokens"))
            .and_then(|v| v.as_u64())
            .unwrap_or(0);
        let cache_write_tokens = usage
            .and_then(|u| u.get("cache_creation_input_tokens"))
            .and_then(|v| v.as_u64())
            .unwrap_or(0);
        let duration_ms = event
            .get("duration_ms")
            .and_then(|v| v.as_u64());
        let num_turns = event
            .get("num_turns")
            .and_then(|v| v.as_u64())
            .map(|v| v as u32);

        if input_tokens > 0 || output_tokens > 0 || cost_usd > 0.0 {
            events.push(SessionEvent::UsageUpdate {
                input_tokens,
                output_tokens,
                cache_read_tokens,
                cache_write_tokens,
                cost_usd,
                duration_ms,
                num_turns,
            });
        }

        // Map result subtype to RunState
        let (state, error) = match subtype {
            "success" => ("idle".to_string(), None),
            "error" => {
                let error_msg = event
                    .get("error")
                    .and_then(|v| v.as_str())
                    .unwrap_or("unknown error")
                    .to_string();
                ("failed".to_string(), Some(error_msg))
            }
            "completed" => ("completed".to_string(), None),
            _ => ("idle".to_string(), None),
        };

        events.push(SessionEvent::RunState { state, error });

        Ok(events)
    }

    fn parse_control_request(
        &self,
        event: &Value,
    ) -> Result<Vec<SessionEvent>, ProviderError> {
        let request_id = event
            .get("request_id")
            .and_then(|v| v.as_str())
            .unwrap_or("")
            .to_string();

        let request = event.get("request").unwrap_or(event);
        let subtype = request.get("subtype").and_then(|v| v.as_str()).unwrap_or("");

        match subtype {
            "can_use_tool" => {
                let tool_name = request
                    .get("tool_name")
                    .and_then(|v| v.as_str())
                    .unwrap_or("")
                    .to_string();
                let tool_input = request.get("input").cloned().unwrap_or(Value::Null);

                Ok(vec![SessionEvent::PermissionPrompt {
                    request_id,
                    tool_name,
                    tool_input,
                }])
            }
            "elicitation" => {
                let message = request
                    .get("message")
                    .and_then(|v| v.as_str())
                    .unwrap_or("")
                    .to_string();

                Ok(vec![SessionEvent::ElicitationPrompt {
                    request_id,
                    message,
                }])
            }
            _ => Ok(vec![SessionEvent::Raw {
                source: "control_request".into(),
                data: event.clone(),
            }]),
        }
    }

    fn parse_control_cancel(
        &self,
        event: &Value,
    ) -> Result<Vec<SessionEvent>, ProviderError> {
        let request_id = event
            .get("request_id")
            .and_then(|v| v.as_str())
            .unwrap_or("")
            .to_string();

        Ok(vec![SessionEvent::ControlCancelled { request_id }])
    }

    fn parse_tool_progress(&self, event: &Value) -> Result<Vec<SessionEvent>, ProviderError> {
        let tool_use_id = event
            .get("tool_use_id")
            .and_then(|v| v.as_str())
            .unwrap_or("")
            .to_string();
        let elapsed_seconds = event
            .get("elapsed_time_seconds")
            .and_then(|v| v.as_f64())
            .unwrap_or(0.0);

        Ok(vec![SessionEvent::ToolProgress {
            tool_use_id,
            elapsed_seconds,
        }])
    }

    fn parse_tool_use_summary(&self, event: &Value) -> Result<Vec<SessionEvent>, ProviderError> {
        let tool_use_id = event
            .get("tool_use_id")
            .and_then(|v| v.as_str())
            .unwrap_or("")
            .to_string();
        let summary = event
            .get("summary")
            .and_then(|v| v.as_str())
            .unwrap_or("")
            .to_string();

        Ok(vec![SessionEvent::ToolUseSummary {
            tool_use_id,
            summary,
        }])
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    fn assert_event_matches(events: &[SessionEvent], index: usize, expected_type: &str) {
        let event = &events[index];
        let json = serde_json::to_value(event).unwrap();
        assert_eq!(
            json.get("type").and_then(|v| v.as_str()).unwrap(),
            expected_type,
            "Event at index {index} should be {expected_type}, got: {json}"
        );
    }

    // --- Tier 1: Session Lifecycle ---

    #[test]
    fn system_init_produces_session_init_and_run_state_running() {
        let mut parser = ProtocolState::new();
        let raw = json!({
            "type": "system",
            "subtype": "init",
            "session_id": "ses-abc",
            "model": "claude-opus-4-6",
            "tools": [{"name": "Bash"}, {"name": "Read"}, {"name": "Edit"}]
        });

        let events = parser.map_event(&raw).unwrap();

        assert_eq!(events.len(), 2);
        assert_event_matches(&events, 0, "session_init");
        assert_event_matches(&events, 1, "run_state");

        if let SessionEvent::SessionInit { session_id, model, tools } = &events[0] {
            assert_eq!(session_id, "ses-abc");
            assert_eq!(model, "claude-opus-4-6");
            assert_eq!(tools, &["Bash", "Read", "Edit"]);
        } else {
            panic!("Expected SessionInit");
        }

        if let SessionEvent::RunState { state, error } = &events[1] {
            assert_eq!(state, "running");
            assert!(error.is_none());
        } else {
            panic!("Expected RunState");
        }
    }

    #[test]
    fn second_system_init_does_not_emit_run_state() {
        let mut parser = ProtocolState::new();
        let raw = json!({
            "type": "system",
            "subtype": "init",
            "session_id": "ses-abc",
            "model": "claude-opus-4-6",
            "tools": []
        });

        // First init
        let _ = parser.map_event(&raw).unwrap();

        // Second init (multi-turn)
        let events = parser.map_event(&raw).unwrap();

        assert_eq!(events.len(), 1, "Second init should only emit SessionInit, not RunState");
        assert_event_matches(&events, 0, "session_init");
    }

    #[test]
    fn stream_event_envelope_is_unwrapped() {
        let mut parser = ProtocolState::new();
        let raw = json!({
            "type": "stream_event",
            "event": {
                "type": "content_block_delta",
                "delta": { "type": "text_delta", "text": "Hello" }
            },
            "session_id": "ses-abc",
            "parent_tool_use_id": null
        });

        let events = parser.map_event(&raw).unwrap();

        assert_eq!(events.len(), 1);
        assert_event_matches(&events, 0, "message_delta");

        if let SessionEvent::MessageDelta { text } = &events[0] {
            assert_eq!(text, "Hello");
        } else {
            panic!("Expected MessageDelta");
        }
    }

    // --- Tier 2: Text Streaming ---

    #[test]
    fn content_block_delta_text_produces_message_delta() {
        let mut parser = ProtocolState::new();
        let raw = json!({
            "type": "content_block_delta",
            "delta": { "type": "text_delta", "text": "I'll fix that bug " }
        });

        let events = parser.map_event(&raw).unwrap();

        assert_eq!(events.len(), 1);
        if let SessionEvent::MessageDelta { text } = &events[0] {
            assert_eq!(text, "I'll fix that bug ");
        } else {
            panic!("Expected MessageDelta");
        }
    }

    #[test]
    fn content_block_delta_thinking_produces_thinking_delta() {
        let mut parser = ProtocolState::new();
        let raw = json!({
            "type": "content_block_delta",
            "delta": { "type": "thinking_delta", "thinking": "Let me analyze..." }
        });

        let events = parser.map_event(&raw).unwrap();

        assert_eq!(events.len(), 1);
        if let SessionEvent::ThinkingDelta { text } = &events[0] {
            assert_eq!(text, "Let me analyze...");
        } else {
            panic!("Expected ThinkingDelta");
        }
    }

    #[test]
    fn assistant_message_produces_message_complete_with_joined_text() {
        let mut parser = ProtocolState::new();
        let raw = json!({
            "type": "assistant",
            "message": {
                "id": "msg_01xyz",
                "model": "claude-opus-4-6",
                "stop_reason": "end_turn",
                "content": [
                    { "type": "text", "text": "First part. " },
                    { "type": "text", "text": "Second part." }
                ]
            }
        });

        let events = parser.map_event(&raw).unwrap();

        assert_eq!(events.len(), 1);
        if let SessionEvent::MessageComplete { text, message_id } = &events[0] {
            assert_eq!(text, "First part. Second part.");
            assert_eq!(message_id, "msg_01xyz");
        } else {
            panic!("Expected MessageComplete");
        }
    }

    // --- Tier 3: Tool Execution ---

    #[test]
    fn content_block_start_tool_use_produces_tool_start() {
        let mut parser = ProtocolState::new();
        let raw = json!({
            "type": "content_block_start",
            "content_block": { "type": "tool_use", "id": "toolu_01abc", "name": "Bash" }
        });

        let events = parser.map_event(&raw).unwrap();

        assert_eq!(events.len(), 1);
        if let SessionEvent::ToolStart { tool_use_id, tool_name, .. } = &events[0] {
            assert_eq!(tool_use_id, "toolu_01abc");
            assert_eq!(tool_name, "Bash");
        } else {
            panic!("Expected ToolStart");
        }
    }

    #[test]
    fn user_tool_result_produces_tool_end_with_correct_tool_name() {
        let mut parser = ProtocolState::new();

        // First register the tool via content_block_start
        let start = json!({
            "type": "content_block_start",
            "content_block": { "type": "tool_use", "id": "toolu_01abc", "name": "Bash" }
        });
        parser.map_event(&start).unwrap();

        // Now parse the tool result
        let raw = json!({
            "type": "user",
            "message": {
                "content": [{
                    "type": "tool_result",
                    "tool_use_id": "toolu_01abc",
                    "content": "file1.ts\nfile2.rs\n",
                    "is_error": false
                }]
            }
        });

        let events = parser.map_event(&raw).unwrap();

        assert_eq!(events.len(), 1);
        if let SessionEvent::ToolEnd { tool_use_id, tool_name, is_error, .. } = &events[0] {
            assert_eq!(tool_use_id, "toolu_01abc");
            assert_eq!(tool_name, "Bash");
            assert!(!is_error);
        } else {
            panic!("Expected ToolEnd");
        }
    }

    #[test]
    fn tool_start_dedup_between_streaming_and_assistant_message() {
        let mut parser = ProtocolState::new();

        // Streaming tool start
        let streaming_start = json!({
            "type": "content_block_start",
            "content_block": { "type": "tool_use", "id": "toolu_01abc", "name": "Bash" }
        });
        let events1 = parser.map_event(&streaming_start).unwrap();
        assert_eq!(events1.len(), 1);
        assert_event_matches(&events1, 0, "tool_start");

        // Assistant message with same tool — should NOT emit duplicate ToolStart
        let assistant = json!({
            "type": "assistant",
            "message": {
                "id": "msg_01xyz",
                "content": [
                    { "type": "text", "text": "Running command." },
                    { "type": "tool_use", "id": "toolu_01abc", "name": "Bash", "input": {"command": "ls"} }
                ]
            }
        });
        let events2 = parser.map_event(&assistant).unwrap();

        // Should get MessageComplete but NOT a second ToolStart
        let tool_start_count = events2
            .iter()
            .filter(|e| matches!(e, SessionEvent::ToolStart { .. }))
            .count();
        assert_eq!(tool_start_count, 0, "Should not duplicate ToolStart from assistant message");
    }

    #[test]
    fn tool_progress_parsed_correctly() {
        let mut parser = ProtocolState::new();
        let raw = json!({
            "type": "tool_progress",
            "tool_use_id": "toolu_01abc",
            "elapsed_time_seconds": 4.7
        });

        let events = parser.map_event(&raw).unwrap();

        assert_eq!(events.len(), 1);
        if let SessionEvent::ToolProgress { tool_use_id, elapsed_seconds } = &events[0] {
            assert_eq!(tool_use_id, "toolu_01abc");
            assert!((elapsed_seconds - 4.7).abs() < f64::EPSILON);
        } else {
            panic!("Expected ToolProgress");
        }
    }

    #[test]
    fn tool_use_summary_parsed_correctly() {
        let mut parser = ProtocolState::new();
        let raw = json!({
            "type": "tool_use_summary",
            "tool_use_id": "toolu_01abc",
            "summary": "Read 3 files from /src"
        });

        let events = parser.map_event(&raw).unwrap();

        assert_eq!(events.len(), 1);
        if let SessionEvent::ToolUseSummary { tool_use_id, summary } = &events[0] {
            assert_eq!(tool_use_id, "toolu_01abc");
            assert_eq!(summary, "Read 3 files from /src");
        } else {
            panic!("Expected ToolUseSummary");
        }
    }

    // --- Tier 1: Result events ---

    #[test]
    fn result_success_produces_usage_update_and_run_state_idle() {
        let mut parser = ProtocolState::new();
        let raw = json!({
            "type": "result",
            "subtype": "success",
            "usage": {
                "input_tokens": 1234,
                "output_tokens": 567
            },
            "total_cost_usd": 0.045,
            "duration_ms": 4100,
            "num_turns": 3
        });

        let events = parser.map_event(&raw).unwrap();

        assert_eq!(events.len(), 2);
        assert_event_matches(&events, 0, "usage_update");
        assert_event_matches(&events, 1, "run_state");

        if let SessionEvent::UsageUpdate { input_tokens, output_tokens, cache_read_tokens, cache_write_tokens, cost_usd, duration_ms, num_turns } = &events[0] {
            assert_eq!(*input_tokens, 1234);
            assert_eq!(*output_tokens, 567);
            assert_eq!(*cache_read_tokens, 0);
            assert_eq!(*cache_write_tokens, 0);
            assert!((cost_usd - 0.045).abs() < f64::EPSILON);
            assert_eq!(*duration_ms, Some(4100));
            assert_eq!(*num_turns, Some(3));
        } else {
            panic!("Expected UsageUpdate");
        }

        if let SessionEvent::RunState { state, error } = &events[1] {
            assert_eq!(state, "idle");
            assert!(error.is_none());
        } else {
            panic!("Expected RunState idle");
        }
    }

    #[test]
    fn result_error_produces_run_state_failed_with_error_message() {
        let mut parser = ProtocolState::new();
        let raw = json!({
            "type": "result",
            "subtype": "error",
            "error": "Context window exceeded",
            "usage": { "input_tokens": 0, "output_tokens": 0 },
            "total_cost_usd": 0.0
        });

        let events = parser.map_event(&raw).unwrap();

        // No UsageUpdate since all zeros
        let run_state = events.iter().find(|e| matches!(e, SessionEvent::RunState { .. }));
        assert!(run_state.is_some());

        if let SessionEvent::RunState { state, error } = run_state.unwrap() {
            assert_eq!(state, "failed");
            assert_eq!(error.as_deref(), Some("Context window exceeded"));
        }
    }

    #[test]
    fn result_completed_produces_run_state_completed() {
        let mut parser = ProtocolState::new();
        let raw = json!({
            "type": "result",
            "subtype": "completed",
            "usage": { "input_tokens": 500, "output_tokens": 200 },
            "total_cost_usd": 0.01
        });

        let events = parser.map_event(&raw).unwrap();

        let run_state = events.iter().find(|e| matches!(e, SessionEvent::RunState { .. }));
        assert!(run_state.is_some());

        if let SessionEvent::RunState { state, .. } = run_state.unwrap() {
            assert_eq!(state, "completed");
        }
    }

    // --- Tier 4: Permission & Interaction ---

    #[test]
    fn control_request_can_use_tool_produces_permission_prompt() {
        let mut parser = ProtocolState::new();
        let raw = json!({
            "type": "control_request",
            "request_id": "req_123",
            "request": {
                "subtype": "can_use_tool",
                "tool_name": "Bash",
                "tool_use_id": "toolu_01abc",
                "input": { "command": "rm -rf node_modules" }
            }
        });

        let events = parser.map_event(&raw).unwrap();

        assert_eq!(events.len(), 1);
        if let SessionEvent::PermissionPrompt { request_id, tool_name, tool_input } = &events[0] {
            assert_eq!(request_id, "req_123");
            assert_eq!(tool_name, "Bash");
            assert_eq!(tool_input["command"], "rm -rf node_modules");
        } else {
            panic!("Expected PermissionPrompt");
        }
    }

    #[test]
    fn control_request_elicitation_produces_elicitation_prompt() {
        let mut parser = ProtocolState::new();
        let raw = json!({
            "type": "control_request",
            "request_id": "req_456",
            "request": {
                "subtype": "elicitation",
                "mcp_server_name": "github",
                "message": "Please authenticate",
                "mode": "oauth"
            }
        });

        let events = parser.map_event(&raw).unwrap();

        assert_eq!(events.len(), 1);
        if let SessionEvent::ElicitationPrompt { request_id, message } = &events[0] {
            assert_eq!(request_id, "req_456");
            assert_eq!(message, "Please authenticate");
        } else {
            panic!("Expected ElicitationPrompt");
        }
    }

    #[test]
    fn control_cancel_request_produces_control_cancelled() {
        let mut parser = ProtocolState::new();
        let raw = json!({
            "type": "control_cancel_request",
            "request_id": "req_123"
        });

        let events = parser.map_event(&raw).unwrap();

        assert_eq!(events.len(), 1);
        if let SessionEvent::ControlCancelled { request_id } = &events[0] {
            assert_eq!(request_id, "req_123");
        } else {
            panic!("Expected ControlCancelled");
        }
    }

    // --- Edge cases ---

    #[test]
    fn unknown_event_type_produces_raw_fallback() {
        let mut parser = ProtocolState::new();
        let raw = json!({
            "type": "some_future_event",
            "data": "whatever"
        });

        let events = parser.map_event(&raw).unwrap();

        assert_eq!(events.len(), 1);
        assert_event_matches(&events, 0, "raw");
    }

    #[test]
    fn tool_end_with_error_flag() {
        let mut parser = ProtocolState::new();

        // Register tool
        let start = json!({
            "type": "content_block_start",
            "content_block": { "type": "tool_use", "id": "toolu_err", "name": "Bash" }
        });
        parser.map_event(&start).unwrap();

        // Tool result with error
        let raw = json!({
            "type": "user",
            "message": {
                "content": [{
                    "type": "tool_result",
                    "tool_use_id": "toolu_err",
                    "content": "command not found: foo",
                    "is_error": true
                }]
            }
        });

        let events = parser.map_event(&raw).unwrap();

        assert_eq!(events.len(), 1);
        if let SessionEvent::ToolEnd { is_error, .. } = &events[0] {
            assert!(is_error);
        } else {
            panic!("Expected ToolEnd with error");
        }
    }
}
