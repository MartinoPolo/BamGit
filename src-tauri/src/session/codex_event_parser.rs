use std::collections::HashMap;

use serde_json::Value;

use super::provider::{ProviderError, SessionEvent};

fn extract_error_message(raw: &Value) -> String {
    raw.get("error")
        .and_then(|v| v.as_str())
        .or_else(|| raw.get("message").and_then(|v| v.as_str()))
        .unwrap_or("unknown error")
        .to_string()
}

/// Stateful parser that maps Codex exec JSONL events to unified SessionEvents.
///
/// Codex `exec --json` emits newline-delimited JSON with top-level `type` fields:
/// `thread.started`, `turn.started`, `turn.completed`, `turn.failed`,
/// `item.started`, `item.completed`, `error`.
pub struct CodexEventParser {
    tool_names: HashMap<String, String>,
}

impl CodexEventParser {
    pub fn new() -> Self {
        Self {
            tool_names: HashMap::new(),
        }
    }

    pub fn map_event(&mut self, raw: &Value) -> Result<Vec<SessionEvent>, ProviderError> {
        let event_type = raw
            .get("type")
            .and_then(|v| v.as_str())
            .unwrap_or("unknown");

        match event_type {
            "thread.started" => self.parse_thread_started(raw),
            "turn.started" => self.parse_turn_started(),
            "turn.completed" => self.parse_turn_completed(raw),
            "turn.failed" => self.parse_turn_failed(raw),
            "item.started" => self.parse_item_event(raw, false),
            "item.completed" => self.parse_item_event(raw, true),
            "error" => self.parse_top_level_error(raw),
            _ => Ok(vec![SessionEvent::Raw {
                source: "codex_stdout".into(),
                data: raw.clone(),
            }]),
        }
    }

    fn parse_thread_started(
        &self,
        raw: &Value,
    ) -> Result<Vec<SessionEvent>, ProviderError> {
        let thread_id = raw
            .get("thread_id")
            .and_then(|v| v.as_str())
            .unwrap_or("")
            .to_string();

        Ok(vec![
            SessionEvent::SessionInit {
                session_id: thread_id,
                model: String::new(),
                tools: vec![],
            },
            SessionEvent::RunState {
                state: "running".into(),
                error: None,
            },
        ])
    }

    fn parse_turn_started(&self) -> Result<Vec<SessionEvent>, ProviderError> {
        Ok(vec![SessionEvent::RunState {
            state: "running".into(),
            error: None,
        }])
    }

    fn parse_turn_completed(
        &self,
        raw: &Value,
    ) -> Result<Vec<SessionEvent>, ProviderError> {
        let mut events = Vec::new();

        if let Some(usage) = raw.get("usage") {
            let input_tokens = usage
                .get("input_tokens")
                .and_then(|v| v.as_u64())
                .unwrap_or(0);
            let output_tokens = usage
                .get("output_tokens")
                .and_then(|v| v.as_u64())
                .unwrap_or(0);
            let cost_usd = usage
                .get("cost_usd")
                .and_then(|v| v.as_f64())
                .unwrap_or(0.0);

            if input_tokens > 0 || output_tokens > 0 || cost_usd > 0.0 {
                events.push(SessionEvent::UsageUpdate {
                    input_tokens,
                    output_tokens,
                    cost_usd,
                });
            }
        }

        events.push(SessionEvent::RunState {
            state: "idle".into(),
            error: None,
        });

        Ok(events)
    }

    fn parse_turn_failed(
        &self,
        raw: &Value,
    ) -> Result<Vec<SessionEvent>, ProviderError> {
        Ok(vec![SessionEvent::RunState {
            state: "failed".into(),
            error: Some(extract_error_message(raw)),
        }])
    }

    fn parse_top_level_error(
        &self,
        raw: &Value,
    ) -> Result<Vec<SessionEvent>, ProviderError> {
        Ok(vec![SessionEvent::RunState {
            state: "failed".into(),
            error: Some(extract_error_message(raw)),
        }])
    }

    fn parse_item_event(
        &mut self,
        raw: &Value,
        is_completed: bool,
    ) -> Result<Vec<SessionEvent>, ProviderError> {
        let item = raw.get("item").unwrap_or(raw);
        let item_type = item
            .get("type")
            .and_then(|v| v.as_str())
            .unwrap_or("unknown");

        match item_type {
            "agent_message" | "agentMessage" => self.parse_agent_message(item, is_completed),
            "command_execution" | "commandExecution" => {
                self.parse_command_execution(item, is_completed)
            }
            "file_change" | "fileChange" => self.parse_file_change(item, is_completed),
            "reasoning" => self.parse_reasoning(item),
            "mcp_tool_call" | "mcpToolCall" => self.parse_mcp_tool_call(item, is_completed),
            "context_compaction" | "contextCompaction" => self.parse_context_compaction(),
            _ => Ok(vec![SessionEvent::Raw {
                source: "codex_item".into(),
                data: raw.clone(),
            }]),
        }
    }

    fn parse_agent_message(
        &self,
        item: &Value,
        is_completed: bool,
    ) -> Result<Vec<SessionEvent>, ProviderError> {
        let text = item
            .get("text")
            .and_then(|v| v.as_str())
            .unwrap_or("")
            .to_string();
        let item_id = item
            .get("id")
            .and_then(|v| v.as_str())
            .unwrap_or("")
            .to_string();

        if is_completed {
            Ok(vec![SessionEvent::MessageComplete {
                text,
                message_id: item_id,
            }])
        } else {
            Ok(vec![SessionEvent::MessageDelta { text }])
        }
    }

    fn parse_command_execution(
        &mut self,
        item: &Value,
        is_completed: bool,
    ) -> Result<Vec<SessionEvent>, ProviderError> {
        let item_id = item
            .get("id")
            .and_then(|v| v.as_str())
            .unwrap_or("")
            .to_string();
        let command = item
            .get("command")
            .and_then(|v| v.as_str())
            .unwrap_or("")
            .to_string();

        if is_completed {
            let output = item
                .get("aggregatedOutput")
                .or_else(|| item.get("output"))
                .cloned()
                .unwrap_or(Value::Null);
            let exit_code = item.get("exitCode").and_then(|v| v.as_i64());
            let is_error = exit_code.map(|c| c != 0).unwrap_or(false);
            let tool_name = self
                .tool_names
                .get(&item_id)
                .cloned()
                .unwrap_or_else(|| "command_execution".into());

            Ok(vec![SessionEvent::ToolEnd {
                tool_use_id: item_id,
                tool_name,
                output,
                is_error,
            }])
        } else {
            self.tool_names
                .insert(item_id.clone(), "command_execution".into());

            Ok(vec![SessionEvent::ToolStart {
                tool_use_id: item_id,
                tool_name: "command_execution".into(),
                input: Value::String(command),
            }])
        }
    }

    fn parse_file_change(
        &mut self,
        item: &Value,
        is_completed: bool,
    ) -> Result<Vec<SessionEvent>, ProviderError> {
        let item_id = item
            .get("id")
            .and_then(|v| v.as_str())
            .unwrap_or("")
            .to_string();

        if is_completed {
            let changes = item.get("changes").cloned().unwrap_or(Value::Null);
            let tool_name = self
                .tool_names
                .get(&item_id)
                .cloned()
                .unwrap_or_else(|| "file_change".into());

            Ok(vec![SessionEvent::ToolEnd {
                tool_use_id: item_id,
                tool_name,
                output: changes,
                is_error: false,
            }])
        } else {
            self.tool_names
                .insert(item_id.clone(), "file_change".into());

            let changes = item.get("changes").cloned().unwrap_or(Value::Null);
            Ok(vec![SessionEvent::ToolStart {
                tool_use_id: item_id,
                tool_name: "file_change".into(),
                input: changes,
            }])
        }
    }

    fn parse_reasoning(
        &self,
        item: &Value,
    ) -> Result<Vec<SessionEvent>, ProviderError> {
        let summary = item
            .get("summary")
            .and_then(|v| v.as_array())
            .map(|arr| {
                arr.iter()
                    .filter_map(|v| v.as_str())
                    .collect::<Vec<_>>()
                    .join("\n")
            })
            .unwrap_or_default();

        let text = if summary.is_empty() {
            item.get("content")
                .and_then(|v| v.as_array())
                .map(|arr| {
                    arr.iter()
                        .filter_map(|v| v.as_str())
                        .collect::<Vec<_>>()
                        .join("\n")
                })
                .unwrap_or_default()
        } else {
            summary
        };

        if text.is_empty() {
            return Ok(vec![]);
        }

        Ok(vec![SessionEvent::ThinkingDelta { text }])
    }

    fn parse_mcp_tool_call(
        &mut self,
        item: &Value,
        is_completed: bool,
    ) -> Result<Vec<SessionEvent>, ProviderError> {
        let item_id = item
            .get("id")
            .and_then(|v| v.as_str())
            .unwrap_or("")
            .to_string();
        let server = item
            .get("server")
            .and_then(|v| v.as_str())
            .unwrap_or("");
        let tool = item
            .get("tool")
            .and_then(|v| v.as_str())
            .unwrap_or("");
        let tool_name = format!("{server}/{tool}");

        if is_completed {
            let result = item.get("result").cloned().unwrap_or(Value::Null);
            let has_error = item.get("error").is_some();
            let stored_name = self
                .tool_names
                .get(&item_id)
                .cloned()
                .unwrap_or(tool_name);

            Ok(vec![SessionEvent::ToolEnd {
                tool_use_id: item_id,
                tool_name: stored_name,
                output: result,
                is_error: has_error,
            }])
        } else {
            self.tool_names.insert(item_id.clone(), tool_name.clone());
            let arguments = item.get("arguments").cloned().unwrap_or(Value::Null);

            Ok(vec![SessionEvent::ToolStart {
                tool_use_id: item_id,
                tool_name,
                input: arguments,
            }])
        }
    }

    fn parse_context_compaction(&self) -> Result<Vec<SessionEvent>, ProviderError> {
        Ok(vec![SessionEvent::CompactBoundary {
            trigger: "codex_context_compaction".into(),
        }])
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    fn assert_event_type(events: &[SessionEvent], index: usize, expected_type: &str) {
        let event = &events[index];
        let json = serde_json::to_value(event).unwrap();
        assert_eq!(
            json.get("type").and_then(|v| v.as_str()).unwrap(),
            expected_type,
            "Event at index {index} should be {expected_type}, got: {json}"
        );
    }

    // --- thread lifecycle ---

    #[test]
    fn thread_started_produces_session_init_and_run_state() {
        let mut parser = CodexEventParser::new();
        let raw = json!({
            "type": "thread.started",
            "thread_id": "0199a213-81c0-7800-8aa1-bbab2a035a53"
        });

        let events = parser.map_event(&raw).unwrap();

        assert_eq!(events.len(), 2);
        assert_event_type(&events, 0, "session_init");
        assert_event_type(&events, 1, "run_state");

        if let SessionEvent::SessionInit { session_id, .. } = &events[0] {
            assert_eq!(session_id, "0199a213-81c0-7800-8aa1-bbab2a035a53");
        } else {
            panic!("Expected SessionInit");
        }
    }

    #[test]
    fn turn_started_produces_run_state_running() {
        let mut parser = CodexEventParser::new();
        let events = parser.map_event(&json!({"type": "turn.started"})).unwrap();

        assert_eq!(events.len(), 1);
        if let SessionEvent::RunState { state, error } = &events[0] {
            assert_eq!(state, "running");
            assert!(error.is_none());
        } else {
            panic!("Expected RunState running");
        }
    }

    #[test]
    fn turn_completed_produces_usage_and_run_state_idle() {
        let mut parser = CodexEventParser::new();
        let raw = json!({
            "type": "turn.completed",
            "usage": {
                "input_tokens": 24763,
                "cached_input_tokens": 24448,
                "output_tokens": 122,
                "reasoning_output_tokens": 0
            }
        });

        let events = parser.map_event(&raw).unwrap();

        assert_eq!(events.len(), 2);
        assert_event_type(&events, 0, "usage_update");
        assert_event_type(&events, 1, "run_state");

        if let SessionEvent::UsageUpdate { input_tokens, output_tokens, .. } = &events[0] {
            assert_eq!(*input_tokens, 24763);
            assert_eq!(*output_tokens, 122);
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
    fn turn_completed_zero_usage_skips_usage_event() {
        let mut parser = CodexEventParser::new();
        let raw = json!({
            "type": "turn.completed",
            "usage": {
                "input_tokens": 0,
                "output_tokens": 0
            }
        });

        let events = parser.map_event(&raw).unwrap();
        assert_eq!(events.len(), 1);
        assert_event_type(&events, 0, "run_state");
    }

    #[test]
    fn turn_failed_produces_run_state_failed() {
        let mut parser = CodexEventParser::new();
        let raw = json!({
            "type": "turn.failed",
            "error": "Rate limit exceeded"
        });

        let events = parser.map_event(&raw).unwrap();

        assert_eq!(events.len(), 1);
        if let SessionEvent::RunState { state, error } = &events[0] {
            assert_eq!(state, "failed");
            assert_eq!(error.as_deref(), Some("Rate limit exceeded"));
        } else {
            panic!("Expected RunState failed");
        }
    }

    // --- agent message items ---

    #[test]
    fn item_started_agent_message_produces_message_delta() {
        let mut parser = CodexEventParser::new();
        let raw = json!({
            "type": "item.started",
            "item": {
                "id": "item_1",
                "type": "agent_message",
                "text": "Working on it..."
            }
        });

        let events = parser.map_event(&raw).unwrap();
        assert_eq!(events.len(), 1);
        if let SessionEvent::MessageDelta { text } = &events[0] {
            assert_eq!(text, "Working on it...");
        } else {
            panic!("Expected MessageDelta");
        }
    }

    #[test]
    fn item_completed_agent_message_produces_message_complete() {
        let mut parser = CodexEventParser::new();
        let raw = json!({
            "type": "item.completed",
            "item": {
                "id": "item_3",
                "type": "agent_message",
                "text": "Repo contains docs, sdk, and examples directories."
            }
        });

        let events = parser.map_event(&raw).unwrap();
        assert_eq!(events.len(), 1);
        if let SessionEvent::MessageComplete { text, message_id } = &events[0] {
            assert_eq!(text, "Repo contains docs, sdk, and examples directories.");
            assert_eq!(message_id, "item_3");
        } else {
            panic!("Expected MessageComplete");
        }
    }

    // --- command execution items ---

    #[test]
    fn item_started_command_execution_produces_tool_start() {
        let mut parser = CodexEventParser::new();
        let raw = json!({
            "type": "item.started",
            "item": {
                "id": "item_1",
                "type": "command_execution",
                "command": "bash -lc ls",
                "status": "in_progress"
            }
        });

        let events = parser.map_event(&raw).unwrap();
        assert_eq!(events.len(), 1);
        if let SessionEvent::ToolStart { tool_use_id, tool_name, input } = &events[0] {
            assert_eq!(tool_use_id, "item_1");
            assert_eq!(tool_name, "command_execution");
            assert_eq!(input.as_str().unwrap(), "bash -lc ls");
        } else {
            panic!("Expected ToolStart");
        }
    }

    #[test]
    fn item_completed_command_execution_produces_tool_end() {
        let mut parser = CodexEventParser::new();

        // Start first to register tool name
        let start = json!({
            "type": "item.started",
            "item": { "id": "item_1", "type": "command_execution", "command": "ls", "status": "in_progress" }
        });
        parser.map_event(&start).unwrap();

        let raw = json!({
            "type": "item.completed",
            "item": {
                "id": "item_1",
                "type": "command_execution",
                "command": "ls",
                "aggregatedOutput": "file1.txt\nfile2.txt",
                "exitCode": 0,
                "status": "completed"
            }
        });

        let events = parser.map_event(&raw).unwrap();
        assert_eq!(events.len(), 1);
        if let SessionEvent::ToolEnd { tool_use_id, tool_name, output, is_error } = &events[0] {
            assert_eq!(tool_use_id, "item_1");
            assert_eq!(tool_name, "command_execution");
            assert_eq!(output.as_str().unwrap(), "file1.txt\nfile2.txt");
            assert!(!is_error);
        } else {
            panic!("Expected ToolEnd");
        }
    }

    #[test]
    fn item_completed_command_execution_with_nonzero_exit_is_error() {
        let mut parser = CodexEventParser::new();
        let raw = json!({
            "type": "item.completed",
            "item": {
                "id": "item_2",
                "type": "command_execution",
                "command": "false",
                "aggregatedOutput": "",
                "exitCode": 1,
                "status": "completed"
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

    // --- file change items ---

    #[test]
    fn item_started_file_change_produces_tool_start() {
        let mut parser = CodexEventParser::new();
        let raw = json!({
            "type": "item.started",
            "item": {
                "id": "item_5",
                "type": "file_change",
                "changes": [{"path": "src/main.rs", "type": "edit"}],
                "status": "in_progress"
            }
        });

        let events = parser.map_event(&raw).unwrap();
        assert_eq!(events.len(), 1);
        if let SessionEvent::ToolStart { tool_use_id, tool_name, .. } = &events[0] {
            assert_eq!(tool_use_id, "item_5");
            assert_eq!(tool_name, "file_change");
        } else {
            panic!("Expected ToolStart");
        }
    }

    #[test]
    fn item_completed_file_change_produces_tool_end() {
        let mut parser = CodexEventParser::new();

        let start = json!({
            "type": "item.started",
            "item": { "id": "item_5", "type": "file_change", "changes": [], "status": "in_progress" }
        });
        parser.map_event(&start).unwrap();

        let raw = json!({
            "type": "item.completed",
            "item": {
                "id": "item_5",
                "type": "file_change",
                "changes": [{"path": "src/main.rs", "type": "edit", "diff": "+line"}],
                "status": "completed"
            }
        });

        let events = parser.map_event(&raw).unwrap();
        assert_eq!(events.len(), 1);
        if let SessionEvent::ToolEnd { tool_use_id, is_error, .. } = &events[0] {
            assert_eq!(tool_use_id, "item_5");
            assert!(!is_error);
        } else {
            panic!("Expected ToolEnd");
        }
    }

    // --- reasoning items ---

    #[test]
    fn item_started_reasoning_with_summary_produces_thinking_delta() {
        let mut parser = CodexEventParser::new();
        let raw = json!({
            "type": "item.started",
            "item": {
                "id": "item_r1",
                "type": "reasoning",
                "summary": ["Analyzing the codebase", "Looking at file structure"]
            }
        });

        let events = parser.map_event(&raw).unwrap();
        assert_eq!(events.len(), 1);
        if let SessionEvent::ThinkingDelta { text } = &events[0] {
            assert_eq!(text, "Analyzing the codebase\nLooking at file structure");
        } else {
            panic!("Expected ThinkingDelta");
        }
    }

    #[test]
    fn item_reasoning_with_content_fallback() {
        let mut parser = CodexEventParser::new();
        let raw = json!({
            "type": "item.started",
            "item": {
                "id": "item_r2",
                "type": "reasoning",
                "content": ["Step 1: read files"]
            }
        });

        let events = parser.map_event(&raw).unwrap();
        assert_eq!(events.len(), 1);
        if let SessionEvent::ThinkingDelta { text } = &events[0] {
            assert_eq!(text, "Step 1: read files");
        } else {
            panic!("Expected ThinkingDelta");
        }
    }

    #[test]
    fn item_reasoning_empty_produces_no_events() {
        let mut parser = CodexEventParser::new();
        let raw = json!({
            "type": "item.started",
            "item": { "id": "item_r3", "type": "reasoning" }
        });

        let events = parser.map_event(&raw).unwrap();
        assert!(events.is_empty());
    }

    // --- MCP tool call items ---

    #[test]
    fn item_started_mcp_tool_call_produces_tool_start() {
        let mut parser = CodexEventParser::new();
        let raw = json!({
            "type": "item.started",
            "item": {
                "id": "item_m1",
                "type": "mcp_tool_call",
                "server": "github",
                "tool": "create_issue",
                "arguments": {"title": "Fix bug"},
                "status": "in_progress"
            }
        });

        let events = parser.map_event(&raw).unwrap();
        assert_eq!(events.len(), 1);
        if let SessionEvent::ToolStart { tool_use_id, tool_name, input } = &events[0] {
            assert_eq!(tool_use_id, "item_m1");
            assert_eq!(tool_name, "github/create_issue");
            assert_eq!(input["title"], "Fix bug");
        } else {
            panic!("Expected ToolStart");
        }
    }

    #[test]
    fn item_completed_mcp_tool_call_with_error() {
        let mut parser = CodexEventParser::new();

        let start = json!({
            "type": "item.started",
            "item": { "id": "item_m2", "type": "mcp_tool_call", "server": "db", "tool": "query", "arguments": {}, "status": "in_progress" }
        });
        parser.map_event(&start).unwrap();

        let raw = json!({
            "type": "item.completed",
            "item": {
                "id": "item_m2",
                "type": "mcp_tool_call",
                "server": "db",
                "tool": "query",
                "arguments": {},
                "status": "failed",
                "error": {"message": "Connection refused"}
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

    // --- context compaction ---

    #[test]
    fn context_compaction_produces_compact_boundary() {
        let mut parser = CodexEventParser::new();
        let raw = json!({
            "type": "item.started",
            "item": { "id": "item_c1", "type": "context_compaction" }
        });

        let events = parser.map_event(&raw).unwrap();
        assert_eq!(events.len(), 1);
        if let SessionEvent::CompactBoundary { trigger } = &events[0] {
            assert_eq!(trigger, "codex_context_compaction");
        } else {
            panic!("Expected CompactBoundary");
        }
    }

    // --- error event ---

    #[test]
    fn top_level_error_produces_run_state_failed() {
        let mut parser = CodexEventParser::new();
        let raw = json!({
            "type": "error",
            "message": "API key invalid"
        });

        let events = parser.map_event(&raw).unwrap();
        assert_eq!(events.len(), 1);
        if let SessionEvent::RunState { state, error } = &events[0] {
            assert_eq!(state, "failed");
            assert_eq!(error.as_deref(), Some("API key invalid"));
        } else {
            panic!("Expected RunState failed");
        }
    }

    // --- camelCase item types ---

    #[test]
    fn camel_case_agent_message_handled() {
        let mut parser = CodexEventParser::new();
        let raw = json!({
            "type": "item.completed",
            "item": { "id": "item_cc", "type": "agentMessage", "text": "Done." }
        });

        let events = parser.map_event(&raw).unwrap();
        assert_eq!(events.len(), 1);
        assert_event_type(&events, 0, "message_complete");
    }

    #[test]
    fn camel_case_command_execution_handled() {
        let mut parser = CodexEventParser::new();
        let raw = json!({
            "type": "item.started",
            "item": { "id": "item_cc2", "type": "commandExecution", "command": "echo hi", "status": "in_progress" }
        });

        let events = parser.map_event(&raw).unwrap();
        assert_eq!(events.len(), 1);
        assert_event_type(&events, 0, "tool_start");
    }

    // --- unknown event fallback ---

    #[test]
    fn unknown_event_type_produces_raw_fallback() {
        let mut parser = CodexEventParser::new();
        let raw = json!({
            "type": "some_future_event",
            "data": "whatever"
        });

        let events = parser.map_event(&raw).unwrap();
        assert_eq!(events.len(), 1);
        assert_event_type(&events, 0, "raw");
    }

    #[test]
    fn unknown_item_type_produces_raw_fallback() {
        let mut parser = CodexEventParser::new();
        let raw = json!({
            "type": "item.started",
            "item": { "id": "item_u1", "type": "future_tool" }
        });

        let events = parser.map_event(&raw).unwrap();
        assert_eq!(events.len(), 1);
        assert_event_type(&events, 0, "raw");
    }

    // --- coverage for fallback paths ---

    #[test]
    fn turn_failed_uses_message_field_fallback() {
        let mut parser = CodexEventParser::new();
        let raw = json!({
            "type": "turn.failed",
            "message": "Context window exceeded"
        });

        let events = parser.map_event(&raw).unwrap();
        assert_eq!(events.len(), 1);
        if let SessionEvent::RunState { state, error } = &events[0] {
            assert_eq!(state, "failed");
            assert_eq!(error.as_deref(), Some("Context window exceeded"));
        } else {
            panic!("Expected RunState failed");
        }
    }

    #[test]
    fn turn_completed_without_usage_key_produces_only_run_state() {
        let mut parser = CodexEventParser::new();
        let raw = json!({"type": "turn.completed"});

        let events = parser.map_event(&raw).unwrap();
        assert_eq!(events.len(), 1);
        assert_event_type(&events, 0, "run_state");

        if let SessionEvent::RunState { state, .. } = &events[0] {
            assert_eq!(state, "idle");
        } else {
            panic!("Expected RunState idle");
        }
    }

    #[test]
    fn camel_case_file_change_handled() {
        let mut parser = CodexEventParser::new();
        let raw = json!({
            "type": "item.started",
            "item": { "id": "item_fc", "type": "fileChange", "changes": [], "status": "in_progress" }
        });

        let events = parser.map_event(&raw).unwrap();
        assert_eq!(events.len(), 1);
        assert_event_type(&events, 0, "tool_start");
    }

    #[test]
    fn camel_case_mcp_tool_call_handled() {
        let mut parser = CodexEventParser::new();
        let raw = json!({
            "type": "item.started",
            "item": { "id": "item_mc", "type": "mcpToolCall", "server": "test", "tool": "ping", "arguments": {}, "status": "in_progress" }
        });

        let events = parser.map_event(&raw).unwrap();
        assert_eq!(events.len(), 1);
        assert_event_type(&events, 0, "tool_start");
    }
}
