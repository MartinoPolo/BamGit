use serde_json::Value;

use super::provider::SessionEvent;

/// Parse a single OpenCode SSE event into zero or more unified SessionEvents.
///
/// OpenCode events arrive as JSON objects with a `type` field and `properties`.
/// This function maps each event type to the corresponding SessionEvent variant.
pub fn parse_opencode_event(event_type: &str, properties: &Value) -> Vec<SessionEvent> {
    match event_type {
        "session.status" => parse_session_status(properties),
        "session.error" => parse_session_error(properties),
        "message.part.updated" => parse_message_part_updated(properties),
        "message.part.delta" => parse_message_part_delta(properties),
        "permission.asked" => parse_permission_asked(properties),
        "question.asked" => parse_question_asked(properties),
        "permission.replied" | "question.replied" | "question.rejected"
        | "message.updated" | "message.removed" => {
            vec![]
        }
        _ => vec![SessionEvent::Raw {
            source: "opencode".into(),
            data: serde_json::json!({ "type": event_type, "properties": properties }),
        }],
    }
}

fn parse_session_status(properties: &Value) -> Vec<SessionEvent> {
    let status_type = properties
        .pointer("/status/type")
        .and_then(|v| v.as_str())
        .unwrap_or("");

    match status_type {
        "busy" => vec![SessionEvent::RunState {
            state: "running".into(),
            error: None,
        }],
        "idle" => vec![SessionEvent::RunState {
            state: "idle".into(),
            error: None,
        }],
        _ => vec![],
    }
}

fn parse_session_error(properties: &Value) -> Vec<SessionEvent> {
    let message = properties
        .pointer("/error/data/message")
        .or_else(|| properties.pointer("/error/message"))
        .and_then(|v| v.as_str())
        .unwrap_or("OpenCode session failed.");

    vec![SessionEvent::RunState {
        state: "failed".into(),
        error: Some(message.to_string()),
    }]
}

fn parse_message_part_updated(properties: &Value) -> Vec<SessionEvent> {
    let part = match properties.get("part") {
        Some(p) => p,
        None => return vec![],
    };

    let part_type = part.get("type").and_then(|v| v.as_str()).unwrap_or("");

    match part_type {
        "text" => {
            let text = part.get("text").and_then(|v| v.as_str()).unwrap_or("");
            if text.is_empty() {
                return vec![];
            }
            let mut events = vec![SessionEvent::MessageDelta {
                text: text.to_string(),
            }];
            if part.pointer("/time/end").is_some() {
                let message_id = part
                    .get("messageID")
                    .and_then(|v| v.as_str())
                    .unwrap_or("")
                    .to_string();
                events.push(SessionEvent::MessageComplete {
                    text: text.to_string(),
                    message_id,
                });
            }
            events
        }
        "reasoning" => {
            let text = part.get("text").and_then(|v| v.as_str()).unwrap_or("");
            if text.is_empty() {
                return vec![];
            }
            vec![SessionEvent::ThinkingDelta {
                text: text.to_string(),
            }]
        }
        "tool" => parse_tool_part(part),
        _ => vec![],
    }
}

fn parse_tool_part(part: &Value) -> Vec<SessionEvent> {
    let tool_name = part
        .get("tool")
        .and_then(|v| v.as_str())
        .unwrap_or("unknown")
        .to_string();
    let call_id = part
        .get("callID")
        .and_then(|v| v.as_str())
        .unwrap_or("")
        .to_string();
    let status = part
        .pointer("/state/status")
        .and_then(|v| v.as_str())
        .unwrap_or("");

    match status {
        "pending" | "running" => vec![SessionEvent::ToolStart {
            tool_use_id: call_id,
            tool_name,
            input: part.get("state").cloned().unwrap_or(Value::Null),
        }],
        "completed" => {
            let output = part
                .pointer("/state/output")
                .cloned()
                .unwrap_or(Value::Null);
            vec![SessionEvent::ToolEnd {
                tool_use_id: call_id,
                tool_name,
                output,
                is_error: false,
            }]
        }
        "error" => {
            let error_msg = part
                .pointer("/state/error")
                .cloned()
                .unwrap_or(Value::Null);
            vec![SessionEvent::ToolEnd {
                tool_use_id: call_id,
                tool_name,
                output: error_msg,
                is_error: true,
            }]
        }
        _ => vec![],
    }
}

fn parse_message_part_delta(properties: &Value) -> Vec<SessionEvent> {
    let delta = properties
        .get("delta")
        .and_then(|v| v.as_str())
        .unwrap_or("");

    if delta.is_empty() {
        return vec![];
    }

    vec![SessionEvent::MessageDelta {
        text: delta.to_string(),
    }]
}

fn parse_permission_asked(properties: &Value) -> Vec<SessionEvent> {
    let request_id = properties
        .get("id")
        .and_then(|v| v.as_str())
        .unwrap_or("")
        .to_string();
    let permission = properties
        .get("permission")
        .and_then(|v| v.as_str())
        .unwrap_or("unknown")
        .to_string();
    let metadata = properties
        .get("metadata")
        .cloned()
        .unwrap_or(Value::Null);

    vec![SessionEvent::PermissionPrompt {
        request_id,
        tool_name: permission,
        tool_input: metadata,
    }]
}

fn parse_question_asked(properties: &Value) -> Vec<SessionEvent> {
    let request_id = properties
        .get("id")
        .and_then(|v| v.as_str())
        .unwrap_or("")
        .to_string();

    let questions: Vec<String> = properties
        .get("questions")
        .and_then(|v| v.as_array())
        .map(|arr| {
            arr.iter()
                .filter_map(|q| q.get("question").and_then(|v| v.as_str()))
                .map(String::from)
                .collect()
        })
        .unwrap_or_default();

    let message = if questions.len() == 1 {
        questions[0].clone()
    } else {
        questions.join("; ")
    };

    vec![SessionEvent::ElicitationPrompt {
        request_id,
        message,
    }]
}

/// Map an ApprovalDecision to the OpenCode permission reply string.
pub fn approval_to_opencode_reply(
    decision: &super::provider::ApprovalDecision,
) -> &'static str {
    match decision {
        super::provider::ApprovalDecision::Allow => "once",
        super::provider::ApprovalDecision::AllowForSession => "always",
        super::provider::ApprovalDecision::Deny => "reject",
    }
}

/// Parse an OpenCode model slug like "anthropic/claude-sonnet-4-20250514"
/// into (provider_id, model_id).
pub fn parse_model_slug(slug: &str) -> Option<(&str, &str)> {
    let trimmed = slug.trim();
    let separator = trimmed.find('/')?;
    if separator == 0 || separator == trimmed.len() - 1 {
        return None;
    }
    Some((&trimmed[..separator], &trimmed[separator + 1..]))
}

/// Extract the server URL from OpenCode's stdout startup line.
/// Looks for "opencode server listening on http://..." pattern.
pub fn parse_server_url_from_output(output: &str) -> Option<&str> {
    for line in output.lines() {
        if !line.starts_with("opencode server listening") {
            continue;
        }
        if let Some(pos) = line.find("http") {
            let url = line[pos..].split_whitespace().next()?;
            return Some(url);
        }
    }
    None
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    // ─── session.status events ─────────────────────────────────────────────

    #[test]
    fn session_status_busy_maps_to_running() {
        let props = json!({ "status": { "type": "busy" } });
        let events = parse_opencode_event("session.status", &props);
        assert_eq!(events.len(), 1);
        match &events[0] {
            SessionEvent::RunState { state, error } => {
                assert_eq!(state, "running");
                assert!(error.is_none());
            }
            other => panic!("Expected RunState, got {other:?}"),
        }
    }

    #[test]
    fn session_status_idle_maps_to_idle() {
        let props = json!({ "status": { "type": "idle" } });
        let events = parse_opencode_event("session.status", &props);
        assert_eq!(events.len(), 1);
        match &events[0] {
            SessionEvent::RunState { state, error } => {
                assert_eq!(state, "idle");
                assert!(error.is_none());
            }
            other => panic!("Expected RunState, got {other:?}"),
        }
    }

    // ─── session.error ─────────────────────────────────────────────────────

    #[test]
    fn session_error_maps_to_failed_with_message() {
        let props = json!({ "error": { "data": { "message": "rate limited" } } });
        let events = parse_opencode_event("session.error", &props);
        assert_eq!(events.len(), 1);
        match &events[0] {
            SessionEvent::RunState { state, error } => {
                assert_eq!(state, "failed");
                assert_eq!(error.as_deref(), Some("rate limited"));
            }
            other => panic!("Expected RunState, got {other:?}"),
        }
    }

    #[test]
    fn session_error_fallback_message() {
        let props = json!({ "error": {} });
        let events = parse_opencode_event("session.error", &props);
        match &events[0] {
            SessionEvent::RunState { error, .. } => {
                assert_eq!(error.as_deref(), Some("OpenCode session failed."));
            }
            other => panic!("Expected RunState, got {other:?}"),
        }
    }

    // ─── message.part.updated — text ───────────────────────────────────────

    #[test]
    fn text_part_updated_maps_to_message_delta() {
        let props = json!({ "part": { "type": "text", "text": "Hello world", "messageID": "m1" } });
        let events = parse_opencode_event("message.part.updated", &props);
        assert!(events.len() >= 1);
        match &events[0] {
            SessionEvent::MessageDelta { text } => assert_eq!(text, "Hello world"),
            other => panic!("Expected MessageDelta, got {other:?}"),
        }
    }

    #[test]
    fn text_part_with_end_time_emits_message_complete() {
        let props = json!({
            "part": {
                "type": "text",
                "text": "Done",
                "messageID": "m2",
                "time": { "start": 1000, "end": 2000 }
            }
        });
        let events = parse_opencode_event("message.part.updated", &props);
        assert_eq!(events.len(), 2);
        match &events[1] {
            SessionEvent::MessageComplete { text, message_id } => {
                assert_eq!(text, "Done");
                assert_eq!(message_id, "m2");
            }
            other => panic!("Expected MessageComplete, got {other:?}"),
        }
    }

    // ─── message.part.updated — reasoning ──────────────────────────────────

    #[test]
    fn reasoning_part_maps_to_thinking_delta() {
        let props = json!({ "part": { "type": "reasoning", "text": "Let me think..." } });
        let events = parse_opencode_event("message.part.updated", &props);
        assert_eq!(events.len(), 1);
        match &events[0] {
            SessionEvent::ThinkingDelta { text } => assert_eq!(text, "Let me think..."),
            other => panic!("Expected ThinkingDelta, got {other:?}"),
        }
    }

    // ─── message.part.updated — tool ───────────────────────────────────────

    #[test]
    fn tool_pending_maps_to_tool_start() {
        let props = json!({
            "part": {
                "type": "tool",
                "tool": "Bash",
                "callID": "call_1",
                "state": { "status": "pending" }
            }
        });
        let events = parse_opencode_event("message.part.updated", &props);
        assert_eq!(events.len(), 1);
        match &events[0] {
            SessionEvent::ToolStart { tool_use_id, tool_name, .. } => {
                assert_eq!(tool_use_id, "call_1");
                assert_eq!(tool_name, "Bash");
            }
            other => panic!("Expected ToolStart, got {other:?}"),
        }
    }

    #[test]
    fn tool_completed_maps_to_tool_end() {
        let props = json!({
            "part": {
                "type": "tool",
                "tool": "Read",
                "callID": "call_2",
                "state": { "status": "completed", "output": "file contents" }
            }
        });
        let events = parse_opencode_event("message.part.updated", &props);
        assert_eq!(events.len(), 1);
        match &events[0] {
            SessionEvent::ToolEnd { tool_use_id, tool_name, output, is_error } => {
                assert_eq!(tool_use_id, "call_2");
                assert_eq!(tool_name, "Read");
                assert_eq!(output, "file contents");
                assert!(!is_error);
            }
            other => panic!("Expected ToolEnd, got {other:?}"),
        }
    }

    #[test]
    fn tool_error_maps_to_tool_end_with_error() {
        let props = json!({
            "part": {
                "type": "tool",
                "tool": "Bash",
                "callID": "call_3",
                "state": { "status": "error", "error": "command failed" }
            }
        });
        let events = parse_opencode_event("message.part.updated", &props);
        assert_eq!(events.len(), 1);
        match &events[0] {
            SessionEvent::ToolEnd { is_error, output, .. } => {
                assert!(is_error);
                assert_eq!(output, "command failed");
            }
            other => panic!("Expected ToolEnd, got {other:?}"),
        }
    }

    // ─── message.part.delta ────────────────────────────────────────────────

    #[test]
    fn message_part_delta_maps_to_message_delta() {
        let props = json!({ "partID": "p1", "delta": "incremental text" });
        let events = parse_opencode_event("message.part.delta", &props);
        assert_eq!(events.len(), 1);
        match &events[0] {
            SessionEvent::MessageDelta { text } => assert_eq!(text, "incremental text"),
            other => panic!("Expected MessageDelta, got {other:?}"),
        }
    }

    #[test]
    fn empty_delta_produces_no_events() {
        let props = json!({ "partID": "p1", "delta": "" });
        let events = parse_opencode_event("message.part.delta", &props);
        assert!(events.is_empty());
    }

    // ─── permission.asked ──────────────────────────────────────────────────

    #[test]
    fn permission_asked_maps_to_permission_prompt() {
        let props = json!({
            "id": "perm_1",
            "permission": "bash",
            "patterns": ["*.sh"],
            "metadata": { "command": "ls -la" }
        });
        let events = parse_opencode_event("permission.asked", &props);
        assert_eq!(events.len(), 1);
        match &events[0] {
            SessionEvent::PermissionPrompt { request_id, tool_name, tool_input } => {
                assert_eq!(request_id, "perm_1");
                assert_eq!(tool_name, "bash");
                assert_eq!(tool_input["command"], "ls -la");
            }
            other => panic!("Expected PermissionPrompt, got {other:?}"),
        }
    }

    // ─── question.asked ────────────────────────────────────────────────────

    #[test]
    fn question_asked_maps_to_elicitation_prompt() {
        let props = json!({
            "id": "q_1",
            "questions": [{ "header": "Choose", "question": "Pick an option", "options": [] }]
        });
        let events = parse_opencode_event("question.asked", &props);
        assert_eq!(events.len(), 1);
        match &events[0] {
            SessionEvent::ElicitationPrompt { request_id, message } => {
                assert_eq!(request_id, "q_1");
                assert_eq!(message, "Pick an option");
            }
            other => panic!("Expected ElicitationPrompt, got {other:?}"),
        }
    }

    // ─── unknown event → Raw ───────────────────────────────────────────────

    #[test]
    fn unknown_event_maps_to_raw() {
        let props = json!({ "foo": "bar" });
        let events = parse_opencode_event("some.unknown.event", &props);
        assert_eq!(events.len(), 1);
        match &events[0] {
            SessionEvent::Raw { source, data } => {
                assert_eq!(source, "opencode");
                assert_eq!(data["type"], "some.unknown.event");
            }
            other => panic!("Expected Raw, got {other:?}"),
        }
    }

    // ─── consumed events produce nothing ───────────────────────────────────

    #[test]
    fn permission_replied_produces_no_events() {
        let events = parse_opencode_event("permission.replied", &json!({}));
        assert!(events.is_empty());
    }

    #[test]
    fn question_replied_produces_no_events() {
        let events = parse_opencode_event("question.replied", &json!({}));
        assert!(events.is_empty());
    }

    // ─── approval_to_opencode_reply ────────────────────────────────────────

    #[test]
    fn approval_allow_maps_to_once() {
        use super::super::provider::ApprovalDecision;
        assert_eq!(approval_to_opencode_reply(&ApprovalDecision::Allow), "once");
    }

    #[test]
    fn approval_allow_for_session_maps_to_always() {
        use super::super::provider::ApprovalDecision;
        assert_eq!(approval_to_opencode_reply(&ApprovalDecision::AllowForSession), "always");
    }

    #[test]
    fn approval_deny_maps_to_reject() {
        use super::super::provider::ApprovalDecision;
        assert_eq!(approval_to_opencode_reply(&ApprovalDecision::Deny), "reject");
    }

    // ─── parse_model_slug ──────────────────────────────────────────────────

    #[test]
    fn valid_model_slug_parses() {
        let result = parse_model_slug("anthropic/claude-sonnet-4-20250514");
        assert_eq!(result, Some(("anthropic", "claude-sonnet-4-20250514")));
    }

    #[test]
    fn empty_slug_returns_none() {
        assert_eq!(parse_model_slug(""), None);
    }

    #[test]
    fn no_separator_returns_none() {
        assert_eq!(parse_model_slug("anthropic"), None);
    }

    #[test]
    fn leading_separator_returns_none() {
        assert_eq!(parse_model_slug("/model"), None);
    }

    #[test]
    fn trailing_separator_returns_none() {
        assert_eq!(parse_model_slug("provider/"), None);
    }

    // ─── parse_server_url_from_output ──────────────────────────────────────

    #[test]
    fn extracts_url_from_listening_line() {
        let output = "some debug\nopencode server listening on http://127.0.0.1:3456\nmore output";
        assert_eq!(
            parse_server_url_from_output(output),
            Some("http://127.0.0.1:3456")
        );
    }

    #[test]
    fn returns_none_for_no_listening_line() {
        let output = "some debug output\nother lines";
        assert_eq!(parse_server_url_from_output(output), None);
    }
}
