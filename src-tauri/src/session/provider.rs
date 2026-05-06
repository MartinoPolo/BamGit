use std::collections::HashMap;
use std::path::PathBuf;

use async_trait::async_trait;
use serde::{Deserialize, Serialize};
use serde_json::Value;
use tokio::process::{Child, ChildStdin};
use tokio::sync::mpsc;
use ts_rs::TS;

/// Which provider backend to use for a session.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize, TS)]
#[ts(export)]
#[serde(rename_all = "kebab-case")]
pub enum ProviderKind {
    ClaudeCode,
    OpenCode,
    Codex,
    Cursor,
}

impl Default for ProviderKind {
    fn default() -> Self {
        Self::ClaudeCode
    }
}

impl ProviderKind {
    pub fn as_str(&self) -> &'static str {
        match self {
            Self::ClaudeCode => "claude-code",
            Self::OpenCode => "open-code",
            Self::Codex => "codex",
            Self::Cursor => "cursor",
        }
    }
}

/// Decision for responding to a tool-use permission prompt.
#[derive(Debug, Clone, Serialize, Deserialize, TS)]
#[ts(export)]
#[serde(rename_all = "snake_case")]
pub enum ApprovalDecision {
    Allow,
    Deny,
    AllowForSession,
}

impl ApprovalDecision {
    pub fn as_str(&self) -> &'static str {
        match self {
            Self::Allow => "allow",
            Self::Deny => "deny",
            Self::AllowForSession => "allow_for_session",
        }
    }
}

/// Capabilities a provider advertises to the frontend.
/// Not yet consumed by a Tauri command — will be wired when the
/// frontend settings panel queries provider capabilities.
#[allow(dead_code)]
#[derive(Debug, Clone, Serialize, Deserialize, TS)]
#[ts(export)]
pub struct ProviderCapabilities {
    pub supports_spawn: bool,
    pub supports_discovery: bool,
    pub supports_mid_session_mode_switch: bool,
    pub supports_mid_session_model_switch: bool,
    pub supported_image_types: Vec<String>,
    pub available_permission_modes: Vec<String>,
}

/// Configuration for spawning a new CLI session.
#[derive(Debug, Clone)]
pub struct SpawnConfig {
    pub prompt: String,
    pub working_directory: PathBuf,
    pub resume_session_id: Option<String>,
    pub permission_mode: Option<String>,
    pub model: Option<String>,
    pub max_turns: Option<u32>,
    pub env_vars: HashMap<String, String>,
}

/// Transport-specific data for provider operations.
pub enum SessionTransport {
    Stdio {
        stdin: Option<ChildStdin>,
    },
    Http {
        base_url: String,
        opencode_session_id: String,
        http_client: reqwest::Client,
    },
    CodexExec {
        thread_id: Option<String>,
        event_sender: mpsc::Sender<SessionEvent>,
        working_directory: PathBuf,
        model: Option<String>,
        sandbox: Option<String>,
    },
    AcpJsonRpc {
        stdin: Option<ChildStdin>,
        acp_session_id: String,
        next_request_id: u64,
    },
}

/// Handle to a running provider process.
/// The provider's `spawn` method also returns an event receiver — the actor
/// reads unified `SessionEvent`s from that channel regardless of transport.
pub struct SessionHandle {
    pub child: Child,
    pub pid: u32,
    pub transport: SessionTransport,
}

/// Unified event type that all providers map their protocol to.
/// Grovekeeper only deals with SessionEvent — never raw provider formats.
#[derive(Debug, Clone, Serialize, Deserialize, TS)]
#[ts(export)]
#[serde(tag = "type", rename_all = "snake_case")]
pub enum SessionEvent {
    SessionInit {
        session_id: String,
        model: String,
        tools: Vec<String>,
    },
    MessageDelta {
        text: String,
    },
    MessageComplete {
        text: String,
        message_id: String,
    },
    ThinkingDelta {
        text: String,
    },
    ToolStart {
        tool_use_id: String,
        tool_name: String,
        input: Value,
    },
    ToolEnd {
        tool_use_id: String,
        tool_name: String,
        output: Value,
        is_error: bool,
    },
    ToolProgress {
        tool_use_id: String,
        elapsed_seconds: f64,
    },
    ToolUseSummary {
        tool_use_id: String,
        summary: String,
    },
    RunState {
        state: String,
        error: Option<String>,
    },
    UsageUpdate {
        #[ts(type = "number")]
        input_tokens: u64,
        #[ts(type = "number")]
        output_tokens: u64,
        cost_usd: f64,
    },
    PermissionPrompt {
        request_id: String,
        tool_name: String,
        tool_input: Value,
    },
    ElicitationPrompt {
        request_id: String,
        message: String,
    },
    CompactBoundary {
        trigger: String,
    },
    SystemStatus {
        status: String,
    },
    ControlCancelled {
        request_id: String,
    },
    Raw {
        source: String,
        data: Value,
    },
}

/// Commands sent from the manager to a session actor via mpsc channel.
#[derive(Debug)]
pub enum ActorCommand {
    SendMessage { message: String },
    RespondToRequest { request_id: String, decision: ApprovalDecision },
    RespondToUserInput { request_id: String, answers: Value },
    Interrupt,
    Terminate,
}

/// Errors from provider operations.
#[derive(Debug, thiserror::Error)]
pub enum ProviderError {
    #[error("spawn failed: {0}")]
    SpawnFailed(String),
    #[error("io error: {0}")]
    IoError(#[from] std::io::Error),
    #[error("parse error: {0}")]
    ParseError(String),
    #[error("session not running")]
    NotRunning,
    #[error("http error: {0}")]
    HttpError(String),
}

/// A provider adapter is an agent CLI backend (Claude Code, OpenCode, etc.).
/// Each adapter knows how to spawn, communicate with, and control its backend.
///
/// The `spawn` method returns both a handle (for sending commands) and an event
/// receiver (for the actor to consume). The provider is responsible for pushing
/// parsed `SessionEvent`s into the channel — the actor never reads raw transport.
#[async_trait]
pub trait ProviderAdapter: Send + Sync {
    /// Spawn the provider process and return a handle + event stream.
    async fn spawn(
        &self,
        config: SpawnConfig,
    ) -> Result<(SessionHandle, mpsc::Receiver<SessionEvent>), ProviderError>;

    /// Send a user turn (prompt) to a running session.
    async fn send_turn(
        &self,
        handle: &mut SessionHandle,
        message: &str,
    ) -> Result<(), ProviderError>;

    /// Respond to a tool-use permission prompt with an approval decision.
    async fn respond_to_request(
        &self,
        handle: &mut SessionHandle,
        request_id: &str,
        decision: &ApprovalDecision,
    ) -> Result<(), ProviderError>;

    /// Respond to an elicitation prompt with user-provided answers.
    async fn respond_to_user_input(
        &self,
        handle: &mut SessionHandle,
        request_id: &str,
        answers: &Value,
    ) -> Result<(), ProviderError>;

    /// Advertise what this provider supports.
    #[allow(dead_code)]
    fn capabilities(&self) -> ProviderCapabilities;

    /// Gracefully interrupt the current turn.
    async fn interrupt(&self, handle: &mut SessionHandle) -> Result<(), ProviderError>;

    /// Kill the provider process immediately.
    async fn terminate(&self, handle: &mut SessionHandle) -> Result<(), ProviderError>;
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn provider_kind_cursor_serializes_to_kebab_case() {
        let serialized = serde_json::to_string(&ProviderKind::Cursor).unwrap();
        assert_eq!(serialized, "\"cursor\"");
    }

    #[test]
    fn provider_kind_cursor_as_str() {
        assert_eq!(ProviderKind::Cursor.as_str(), "cursor");
    }

    #[test]
    fn provider_kind_cursor_deserializes() {
        let deserialized: ProviderKind = serde_json::from_str("\"cursor\"").unwrap();
        assert_eq!(deserialized, ProviderKind::Cursor);
    }
}
