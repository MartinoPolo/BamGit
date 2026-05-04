use std::collections::HashMap;
use std::path::PathBuf;

use async_trait::async_trait;
use serde::{Deserialize, Serialize};
use serde_json::Value;
use ts_rs::TS;
use tokio::process::{Child, ChildStderr, ChildStdin, ChildStdout};

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

/// Handle to a running CLI child process.
/// stdout/stderr are Option so the actor can take ownership for reading
/// while the handle is still passed to provider methods for stdin/child access.
pub struct SessionHandle {
    pub child: Child,
    pub stdin: Option<ChildStdin>,
    pub stdout: Option<ChildStdout>,
    pub stderr: Option<ChildStderr>,
    pub pid: u32,
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
}

/// A provider adapter is an agent CLI backend (Claude Code, Codex, etc.).
/// Each adapter knows how to spawn, communicate with, and control its CLI.
#[async_trait]
pub trait ProviderAdapter: Send + Sync {
    /// Spawn a new CLI process and return a handle for communication.
    async fn spawn(&self, config: SpawnConfig) -> Result<SessionHandle, ProviderError>;

    /// Send a user turn (prompt) to a running session via stdin.
    async fn send_turn(&self, handle: &mut SessionHandle, message: &str)
        -> Result<(), ProviderError>;

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

    /// Kill the CLI process immediately.
    async fn terminate(&self, handle: &mut SessionHandle) -> Result<(), ProviderError>;

    /// Parse a raw JSON line from stdout into zero or more SessionEvents.
    fn parse_event(&self, raw: &Value) -> Result<Vec<SessionEvent>, ProviderError>;
}
