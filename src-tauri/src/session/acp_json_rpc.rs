use serde::Deserialize;
use serde_json::Value;

/// A parsed JSON-RPC 2.0 message from the agent's stdout.
/// Could be a response, server-initiated request, or notification.
#[derive(Debug, Clone, Deserialize)]
pub struct JsonRpcMessage {
    pub id: Option<Value>,
    pub method: Option<String>,
    pub params: Option<Value>,
    pub result: Option<Value>,
    pub error: Option<JsonRpcError>,
}

/// JSON-RPC 2.0 error object.
#[allow(dead_code)] // fields deserialized from JSON; used in tests and diagnostic logging
#[derive(Debug, Clone, Deserialize)]
pub struct JsonRpcError {
    pub code: i64,
    pub message: String,
    pub data: Option<Value>,
}

/// Classified incoming message kind after parsing.
pub enum MessageKind {
    /// A response to a request we sent (has id + result or error).
    Response {
        #[allow(dead_code)] // used in tests; available for future response correlation
        id: Value,
        result: Option<Value>,
        #[allow(dead_code)] // used in tests; available for future error handling
        error: Option<JsonRpcError>,
    },
    /// A server-initiated request requiring our response (has non-empty id + method).
    ServerRequest {
        id: Value,
        method: String,
        params: Value,
    },
    /// A notification from the server (method present, no meaningful id).
    Notification {
        method: String,
        params: Value,
    },
}

/// Returns true if the id represents an "empty" id (None, null, or empty string).
fn is_empty_id(id: &Option<Value>) -> bool {
    match id {
        None => true,
        Some(Value::Null) => true,
        Some(Value::String(s)) => s.is_empty(),
        _ => false,
    }
}

/// Classify a parsed JSON-RPC message into its kind.
///
/// Classification logic:
/// - Has `result` or `error` → Response
/// - Has `method` + non-empty id → ServerRequest
/// - Has `method` + empty/absent id → Notification
pub fn classify_message(msg: &JsonRpcMessage) -> Option<MessageKind> {
    // Response: has result or error
    if msg.result.is_some() || msg.error.is_some() {
        let id = msg.id.clone().unwrap_or(Value::Null);
        return Some(MessageKind::Response {
            id,
            result: msg.result.clone(),
            error: msg.error.clone(),
        });
    }

    // Must have a method for request or notification
    let method = msg.method.as_ref()?;
    let params = msg.params.clone().unwrap_or(Value::Object(serde_json::Map::new()));

    if is_empty_id(&msg.id) {
        // Notification: method present but no meaningful id
        Some(MessageKind::Notification {
            method: method.clone(),
            params,
        })
    } else {
        // ServerRequest: method present with a non-empty id
        Some(MessageKind::ServerRequest {
            id: msg.id.clone().unwrap_or(Value::Null),
            method: method.clone(),
            params,
        })
    }
}

/// Encode a JSON-RPC request as a JSON line (terminated with newline).
pub fn encode_request(id: &str, method: &str, params: &Value) -> String {
    let request = serde_json::json!({
        "jsonrpc": "2.0",
        "id": id,
        "method": method,
        "params": params,
    });
    let mut line = serde_json::to_string(&request).expect("JSON serialization should not fail");
    line.push('\n');
    line
}

/// Encode a JSON-RPC response as a JSON line (terminated with newline).
pub fn encode_response(id: &Value, result: &Value) -> String {
    let response = serde_json::json!({
        "jsonrpc": "2.0",
        "id": id,
        "result": result,
    });
    let mut line = serde_json::to_string(&response).expect("JSON serialization should not fail");
    line.push('\n');
    line
}

/// Encode a JSON-RPC notification as a JSON line (no id field, terminated with newline).
pub fn encode_notification(method: &str, params: &Value) -> String {
    let notification = serde_json::json!({
        "jsonrpc": "2.0",
        "method": method,
        "params": params,
    });
    let mut line =
        serde_json::to_string(&notification).expect("JSON serialization should not fail");
    line.push('\n');
    line
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    #[test]
    fn encode_request_produces_valid_json_rpc_with_newline() {
        let output = encode_request("1", "initialize", &json!({"key": "value"}));
        assert!(output.ends_with('\n'), "Must end with newline");
        let parsed: Value = serde_json::from_str(output.trim()).unwrap();
        assert_eq!(parsed["jsonrpc"], "2.0");
        assert_eq!(parsed["id"], "1");
        assert_eq!(parsed["method"], "initialize");
        assert_eq!(parsed["params"]["key"], "value");
    }

    #[test]
    fn encode_response_produces_valid_json_rpc_with_newline() {
        let id = json!("srv-1");
        let result = json!({"outcome": "selected"});
        let output = encode_response(&id, &result);
        assert!(output.ends_with('\n'), "Must end with newline");
        let parsed: Value = serde_json::from_str(output.trim()).unwrap();
        assert_eq!(parsed["jsonrpc"], "2.0");
        assert_eq!(parsed["id"], "srv-1");
        assert_eq!(parsed["result"]["outcome"], "selected");
    }

    #[test]
    fn encode_notification_omits_id_field() {
        let output = encode_notification("session/cancel", &json!({"sessionId": "abc"}));
        assert!(output.ends_with('\n'), "Must end with newline");
        let parsed: Value = serde_json::from_str(output.trim()).unwrap();
        assert_eq!(parsed["jsonrpc"], "2.0");
        assert_eq!(parsed["method"], "session/cancel");
        assert_eq!(parsed["params"]["sessionId"], "abc");
        assert!(parsed.get("id").is_none(), "Notification must not have id field");
    }

    #[test]
    fn classify_response_with_result() {
        let msg = JsonRpcMessage {
            id: Some(json!("1")),
            method: None,
            params: None,
            result: Some(json!({"agentInfo": {}})),
            error: None,
        };
        let kind = classify_message(&msg).expect("Should classify");
        match kind {
            MessageKind::Response { id, result, error } => {
                assert_eq!(id, json!("1"));
                assert!(result.is_some());
                assert!(error.is_none());
            }
            _ => panic!("Expected Response"),
        }
    }

    #[test]
    fn classify_response_with_error() {
        let msg = JsonRpcMessage {
            id: Some(json!("2")),
            method: None,
            params: None,
            result: None,
            error: Some(JsonRpcError {
                code: -32600,
                message: "Invalid request".into(),
                data: None,
            }),
        };
        let kind = classify_message(&msg).expect("Should classify");
        match kind {
            MessageKind::Response { id, error, .. } => {
                assert_eq!(id, json!("2"));
                let err = error.unwrap();
                assert_eq!(err.code, -32600);
                assert_eq!(err.message, "Invalid request");
            }
            _ => panic!("Expected Response with error"),
        }
    }

    #[test]
    fn classify_server_request() {
        let msg = JsonRpcMessage {
            id: Some(json!("srv-1")),
            method: Some("session/request_permission".into()),
            params: Some(json!({"sessionId": "abc"})),
            result: None,
            error: None,
        };
        let kind = classify_message(&msg).expect("Should classify");
        match kind {
            MessageKind::ServerRequest { id, method, params } => {
                assert_eq!(id, json!("srv-1"));
                assert_eq!(method, "session/request_permission");
                assert_eq!(params["sessionId"], "abc");
            }
            _ => panic!("Expected ServerRequest"),
        }
    }

    #[test]
    fn classify_notification_with_empty_id() {
        let msg = JsonRpcMessage {
            id: Some(json!("")),
            method: Some("session/update".into()),
            params: Some(json!({"sessionId": "abc"})),
            result: None,
            error: None,
        };
        let kind = classify_message(&msg).expect("Should classify");
        match kind {
            MessageKind::Notification { method, params } => {
                assert_eq!(method, "session/update");
                assert_eq!(params["sessionId"], "abc");
            }
            _ => panic!("Expected Notification"),
        }
    }

    #[test]
    fn classify_notification_without_id() {
        let msg = JsonRpcMessage {
            id: None,
            method: Some("session/update".into()),
            params: Some(json!({"update": {}})),
            result: None,
            error: None,
        };
        let kind = classify_message(&msg).expect("Should classify");
        match kind {
            MessageKind::Notification { method, .. } => {
                assert_eq!(method, "session/update");
            }
            _ => panic!("Expected Notification"),
        }
    }
}
